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
  beforeEach(() => jest.clearAllMocks());

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
});

// ── Get Image Status ───────────────────────────────
describe('Image Controller - getStatus', () => {
  beforeEach(() => jest.clearAllMocks());

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
