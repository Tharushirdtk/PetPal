/**
 * Consultation Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.4
 */

jest.mock('../models/consultation.model');
jest.mock('../models/llmContext.model');
jest.mock('../config/db');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const ConsultationModel = require('../models/consultation.model');
const LlmContextModel = require('../models/llmContext.model');
const { query } = require('../config/db');
const consultCtrl = require('../controllers/consultation.controller');

function mockReq(body = {}, params = {}, user = null) {
  return { body, params, user };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Start Consultation ─────────────────────────────
describe('Consultation Controller - startConsultation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Authenticated user starts consultation for existing pet', async () => {
    ConsultationModel.getStatusIdByName.mockResolvedValue(1);
    ConsultationModel.create.mockResolvedValue(456);
    query.mockResolvedValue({ insertId: 789 });
    LlmContextModel.upsert.mockResolvedValue(true);

    const req = mockReq({ pet_id: 123 }, {}, { id: 456 });
    const res = mockRes();
    await consultCtrl.startConsultation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.consultation_id).toBe(456);
    expect(data.conversation_id).toBe(789);

    expect(ConsultationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 456,
        pet_id: 123,
        is_guest: false,
        guest_handle: null,
      }),
      456
    );
  });

  test('SCENARIO: Guest user starts consultation gets guest_handle', async () => {
    ConsultationModel.getStatusIdByName.mockResolvedValue(1);
    ConsultationModel.create.mockResolvedValue(100);
    query.mockResolvedValue({ insertId: 200 });
    LlmContextModel.upsert.mockResolvedValue(true);

    const req = mockReq({ pet_id: null }, {}, null);
    const res = mockRes();
    await consultCtrl.startConsultation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(ConsultationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        is_guest: true,
        guest_handle: expect.stringContaining('guest_'),
      }),
      null
    );
  });

  test('SCENARIO: Status "active" not found in database returns 500', async () => {
    ConsultationModel.getStatusIdByName.mockResolvedValue(null);

    const req = mockReq({}, {}, { id: 1 });
    const res = mockRes();
    await consultCtrl.startConsultation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Status "active" not found in mast_status',
      })
    );
  });

  test('SCENARIO: LLM context is initialized for new conversation', async () => {
    ConsultationModel.getStatusIdByName.mockResolvedValue(1);
    ConsultationModel.create.mockResolvedValue(1);
    query.mockResolvedValue({ insertId: 10 });
    LlmContextModel.upsert.mockResolvedValue(true);

    const req = mockReq({ pet_id: 5 }, {}, { id: 1 });
    const res = mockRes();
    await consultCtrl.startConsultation(req, res, jest.fn());

    expect(LlmContextModel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 10,
        json_data: {},
        image_processing_snapshot: {},
        recent_messages: { user: [], ai: [] },
      })
    );
  });
});

// ── Get Consultation By ID ─────────────────────────
describe('Consultation Controller - getById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns consultation with linked diagnoses', async () => {
    ConsultationModel.findById.mockResolvedValue({
      id: 456, pet_id: 123, user_id: 789, status_name: 'completed',
    });
    query.mockResolvedValue([
      { id: 1, primary_label: 'Allergic Dermatitis', confidence: 0.87 },
    ]);

    const req = mockReq({}, { id: '456' });
    const res = mockRes();
    await consultCtrl.getById(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.consultation.id).toBe(456);
    expect(data.diagnoses).toHaveLength(1);
  });

  test('SCENARIO: Consultation not found returns 404', async () => {
    ConsultationModel.findById.mockResolvedValue(null);

    const res = mockRes();
    await consultCtrl.getById(mockReq({}, { id: '999' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Consultation not found' })
    );
  });
});

// ── Get Active Consultation For Pet ────────────────
describe('Consultation Controller - getActiveForPet', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns active consultation for pet', async () => {
    ConsultationModel.findActiveByPet.mockResolvedValue({
      consultation_id: 456, conversation_id: 789,
    });

    const req = mockReq({}, { petId: '123' }, { id: 456 });
    const res = mockRes();
    await consultCtrl.getActiveForPet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(ConsultationModel.findActiveByPet).toHaveBeenCalledWith('123', 456);
  });

  test('SCENARIO: No active consultation returns null', async () => {
    ConsultationModel.findActiveByPet.mockResolvedValue(null);

    const req = mockReq({}, { petId: '123' }, { id: 456 });
    const res = mockRes();
    await consultCtrl.getActiveForPet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.active).toBeNull();
  });

  test('SCENARIO: Unauthenticated user returns 401', async () => {
    const req = mockReq({}, { petId: '123' }, null);
    req.user = null;
    const res = mockRes();
    await consultCtrl.getActiveForPet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Authentication required' })
    );
  });
});

// ── Get Consultation History ───────────────────────
describe('Consultation Controller - getHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns consultation history for user', async () => {
    ConsultationModel.findByUser.mockResolvedValue([
      { id: 1, status_name: 'completed' },
      { id: 2, status_name: 'active' },
    ]);

    const req = mockReq({}, {}, { id: 456 });
    const res = mockRes();
    await consultCtrl.getHistory(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.consultations).toHaveLength(2);
  });
});
