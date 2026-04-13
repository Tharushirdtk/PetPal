/**
 * Image Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.1 Steps 4-5
 */

jest.mock('../config/db');
jest.mock('../services/imageModel.service');
jest.mock('../models/llmContext.model');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const { query } = require('../config/db');
const { runInference } = require('../services/imageModel.service');
const LlmContextModel = require('../models/llmContext.model');
const imageCtrl = require('../controllers/image.controller');

function mockReq(body = {}, params = {}, user = null, file = null) {
  return { body, params, user, file };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Upload Image ───────────────────────────────────
describe('Image Controller - uploadImage', () => {
  beforeEach(() => jest.resetAllMocks());

  test('SCENARIO: No image file returns 400', async () => {
    const req = mockReq({}, {}, { id: 1 }, null);
    const res = mockRes();
    await imageCtrl.uploadImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'No image file uploaded' })
    );
  });

  test('SCENARIO: Successful image upload and analysis returns 201', async () => {
    query
      .mockResolvedValueOnce({ insertId: 100 })  // image_asset insert
      .mockResolvedValueOnce({ insertId: 200 })  // processing_job insert
      .mockResolvedValueOnce({})                  // update asset to analyzing
      .mockResolvedValueOnce({})                  // update job to running
      .mockResolvedValueOnce([{ species_name: 'Dog' }])  // pet species lookup
      .mockResolvedValueOnce({})                  // image_analysis insert
      .mockResolvedValueOnce({})                  // update asset to complete
      .mockResolvedValueOnce({})                  // update job to success
      .mockResolvedValueOnce([{ id: 50 }]);       // conversation lookup for llm_context

    runInference.mockResolvedValue({
      prediction_text: 'Allergic Dermatitis',
      confidence_percent: 87,
      top_label: 'allergic_dermatitis',
      raw_result: { predictions: [] },
      confidence_level: 'high',
      is_uncertain: false,
      prediction_note: null,
      top5: [
        { label: 'Allergic Dermatitis', confidence: 87 },
        { label: 'Skin Allergy in Dog', confidence: 6 },
      ],
    });

    LlmContextModel.getByConversation.mockResolvedValue({ image_processing_snapshot: '{}' });
    LlmContextModel.updateImageSnapshot.mockResolvedValue(true);

    const file = {
      path: '/tmp/uploads/abc.jpg',
      filename: 'abc.jpg',
      originalname: 'pet_photo.jpg',
      size: 2048,
      mimetype: 'image/jpeg',
    };
    const req = mockReq(
      { consultation_id: '10', pet_id: '123' },
      {},
      { id: 456 },
      file
    );
    req.file = file;
    const res = mockRes();
    await imageCtrl.uploadImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.status).toBe('complete');
    expect(data.analysis.prediction_text).toBe('Allergic Dermatitis');
    expect(data.analysis.confidence_percent).toBe(87);
    expect(data.file_url).toBe('/uploads/abc.jpg');
  });

  test('SCENARIO: ML inference fails returns 201 with error status', async () => {
    query
      .mockResolvedValueOnce({ insertId: 100 })
      .mockResolvedValueOnce({ insertId: 200 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([])   // no species found
      .mockResolvedValueOnce({})   // error update asset
      .mockResolvedValueOnce({});  // error update job

    runInference.mockRejectedValue(new Error('Model sidecar down'));

    const file = {
      path: '/tmp/uploads/abc.jpg',
      filename: 'abc.jpg',
      originalname: 'pet.jpg',
      size: 1024,
      mimetype: 'image/jpeg',
    };
    const req = mockReq({ pet_id: '5' }, {}, { id: 1 }, file);
    req.file = file;
    const res = mockRes();
    await imageCtrl.uploadImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.status).toBe('error');
    expect(data.error).toBe('Model sidecar down');
  });

  test('SCENARIO: Guest user (no auth) can upload images', async () => {
    query
      .mockResolvedValueOnce({ insertId: 100 })
      .mockResolvedValueOnce({ insertId: 200 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})  // image_analysis
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    runInference.mockResolvedValue({
      prediction_text: 'Normal skin',
      confidence_percent: 95,
      top_label: 'normal',
      raw_result: {},
      confidence_level: 'high',
      is_uncertain: false,
      prediction_note: null,
      top5: [{ label: 'Normal skin', confidence: 95 }],
    });

    const file = {
      path: '/tmp/uploads/guest.jpg',
      filename: 'guest.jpg',
      originalname: 'photo.jpg',
      size: 512,
      mimetype: 'image/png',
    };
    const req = mockReq({}, {}, null, file);
    req.file = file;
    const res = mockRes();
    await imageCtrl.uploadImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('SCENARIO: Low confidence prediction includes uncertainty metadata in response', async () => {
    query
      .mockResolvedValueOnce({ insertId: 100 })
      .mockResolvedValueOnce({ insertId: 200 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([])   // no pet species
      .mockResolvedValueOnce({})   // image_analysis insert
      .mockResolvedValueOnce({})   // update asset
      .mockResolvedValueOnce({});  // update job

    runInference.mockResolvedValue({
      prediction_text: 'Kennel Cough in Dog',
      confidence_percent: 23,
      top_label: 'kennel_cough_in_dog',
      raw_result: {},
      confidence_level: 'low',
      is_uncertain: true,
      prediction_note: 'Model confidence is low. This prediction should be verified with clinical symptoms and veterinary consultation.',
      top5: [
        { label: 'Kennel Cough in Dog', confidence: 23 },
        { label: 'Skin Allergy in Dog', confidence: 18 },
        { label: 'Hot Spots in Dog', confidence: 15 },
      ],
    });

    const file = {
      path: '/tmp/uploads/wound.jpg',
      filename: 'wound.jpg',
      originalname: 'wound.jpg',
      size: 2048,
      mimetype: 'image/jpeg',
    };
    const req = mockReq({}, {}, { id: 1 }, file);
    req.file = file;
    const res = mockRes();
    await imageCtrl.uploadImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.analysis.confidence_level).toBe('low');
    expect(data.analysis.is_uncertain).toBe(true);
    expect(data.analysis.prediction_note).toContain('Model confidence is low');
    expect(data.analysis.top5).toHaveLength(3);
  });

  test('SCENARIO: LLM context snapshot includes top5 and confidence metadata', async () => {
    query
      .mockResolvedValueOnce({ insertId: 100 })
      .mockResolvedValueOnce({ insertId: 200 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([{ species_name: 'Dog' }])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([{ id: 50 }]);  // conversation lookup

    runInference.mockResolvedValue({
      prediction_text: 'Skin Allergy in Dog',
      confidence_percent: 72,
      top_label: 'skin_allergy_in_dog',
      raw_result: {},
      confidence_level: 'high',
      is_uncertain: false,
      prediction_note: null,
      top5: [
        { label: 'Skin Allergy in Dog', confidence: 72 },
        { label: 'Hot Spots in Dog', confidence: 12 },
      ],
    });

    LlmContextModel.getByConversation.mockResolvedValueOnce({ image_processing_snapshot: '{}' });
    LlmContextModel.updateImageSnapshot.mockResolvedValueOnce(true);

    const file = {
      path: '/tmp/uploads/skin.jpg',
      filename: 'skin.jpg',
      originalname: 'skin.jpg',
      size: 2048,
      mimetype: 'image/jpeg',
    };
    const req = mockReq(
      { consultation_id: '10', pet_id: '5' },
      {},
      { id: 1 },
      file
    );
    req.file = file;
    const res = mockRes();
    await imageCtrl.uploadImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.status).toBe('complete');
    expect(data.analysis.confidence_level).toBe('high');
    expect(data.analysis.top5).toHaveLength(2);

    // Verify LLM context snapshot was updated with enriched data
    expect(LlmContextModel.updateImageSnapshot).toHaveBeenCalledTimes(1);
    const snapshotArg = LlmContextModel.updateImageSnapshot.mock.calls[0][1];
    expect(snapshotArg.latest.confidence_level).toBe('high');
    expect(snapshotArg.latest.is_uncertain).toBe(false);
    expect(snapshotArg.latest.top5).toHaveLength(2);
    expect(snapshotArg.latest.top5[0].label).toBe('Skin Allergy in Dog');
  });
});

// ── Get Image Status ───────────────────────────────
describe('Image Controller - getStatus', () => {
  beforeEach(() => jest.resetAllMocks());

  test('SCENARIO: Image not found returns 404', async () => {
    query.mockResolvedValue([]);

    const res = mockRes();
    await imageCtrl.getStatus(mockReq({}, { id: '999' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Image not found' })
    );
  });

  test('SCENARIO: Complete image returns asset with analysis', async () => {
    query
      .mockResolvedValueOnce([{ id: 100, status: 'complete', file_url: '/uploads/abc.jpg' }])
      .mockResolvedValueOnce([{
        id: 1,
        prediction_text: 'Allergic Dermatitis',
        raw_result_json: '{"predictions":[]}',
      }]);

    const res = mockRes();
    await imageCtrl.getStatus(mockReq({}, { id: '100' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.image.status).toBe('complete');
    expect(data.analysis.prediction_text).toBe('Allergic Dermatitis');
    expect(data.analysis.raw_result_json).toEqual({ predictions: [] });
  });

  test('SCENARIO: Queued image returns asset without analysis', async () => {
    query.mockResolvedValue([{ id: 100, status: 'queued' }]);

    const res = mockRes();
    await imageCtrl.getStatus(mockReq({}, { id: '100' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.image.status).toBe('queued');
    expect(data.analysis).toBeNull();
  });
});
