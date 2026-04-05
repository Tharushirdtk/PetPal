/**
 * Diagnosis Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.1 Step 6
 */

jest.mock('../models/diagnosis.model');
jest.mock('../config/db');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const DiagnosisModel = require('../models/diagnosis.model');
const diagCtrl = require('../controllers/diagnosis.controller');

function mockReq(body = {}, params = {}, user = null) {
  return { body, params, user };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Get By Consultation ────────────────────────────
describe('Diagnosis Controller - getByConsultation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns diagnosis with parsed JSON fields and symptoms', async () => {
    DiagnosisModel.findByConsultation.mockResolvedValue([
      {
        id: 234,
        consultation_id: 789,
        primary_label: 'Allergic Dermatitis',
        confidence: 0.87,
        secondary_labels: '["food_allergy","seasonal_allergy"]',
        recommended_actions: '["Switch to hypoallergenic food","Monitor symptoms"]',
        severity_flags: '{"severity":"moderate"}',
        explanation: 'Inflammatory skin condition',
      },
    ]);
    DiagnosisModel.getSymptoms.mockResolvedValue([
      { id: 1, symptom_name: 'Scratching', diagnosis_id: 234 },
      { id: 2, symptom_name: 'Hair loss', diagnosis_id: 234 },
    ]);

    const req = mockReq({}, { consultation_id: '789' });
    const res = mockRes();
    await diagCtrl.getByConsultation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.diagnosis.primary_label).toBe('Allergic Dermatitis');
    expect(data.diagnosis.secondary_labels).toEqual(['food_allergy', 'seasonal_allergy']);
    expect(data.diagnosis.recommended_actions).toEqual(['Switch to hypoallergenic food', 'Monitor symptoms']);
    expect(data.diagnosis.severity_flags).toEqual({ severity: 'moderate' });
    expect(data.symptoms).toHaveLength(2);
  });

  test('SCENARIO: No diagnosis found returns null with empty symptoms', async () => {
    DiagnosisModel.findByConsultation.mockResolvedValue([]);

    const req = mockReq({}, { consultation_id: '999' });
    const res = mockRes();
    await diagCtrl.getByConsultation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.diagnosis).toBeNull();
    expect(data.symptoms).toEqual([]);
  });

  test('SCENARIO: Handles already-parsed JSON fields (object not string)', async () => {
    DiagnosisModel.findByConsultation.mockResolvedValue([
      {
        id: 1,
        primary_label: 'Healthy',
        confidence: 0.95,
        secondary_labels: ['routine_check'],
        recommended_actions: ['Continue current diet'],
        severity_flags: { severity: 'normal' },
      },
    ]);
    DiagnosisModel.getSymptoms.mockResolvedValue([]);

    const req = mockReq({}, { consultation_id: '1' });
    const res = mockRes();
    await diagCtrl.getByConsultation(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.diagnosis.secondary_labels).toEqual(['routine_check']);
  });
});

// ── Get By Pet ─────────────────────────────────────
describe('Diagnosis Controller - getByPet', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns all diagnoses for a pet with parsed JSON', async () => {
    DiagnosisModel.findByPet.mockResolvedValue([
      {
        id: 234, primary_label: 'Allergic Dermatitis', confidence: 0.87,
        secondary_labels: '["food_allergy"]',
        recommended_actions: '["Switch food"]',
        severity_flags: '{"severity":"moderate"}',
      },
      {
        id: 198, primary_label: 'Healthy', confidence: 0.95,
        secondary_labels: '[]',
        recommended_actions: '["Continue diet"]',
        severity_flags: '{"severity":"normal"}',
      },
    ]);

    const req = mockReq({}, { pet_id: '125' });
    const res = mockRes();
    await diagCtrl.getByPet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.diagnoses).toHaveLength(2);
    expect(Array.isArray(data.diagnoses[0].secondary_labels)).toBe(true);
    expect(Array.isArray(data.diagnoses[1].recommended_actions)).toBe(true);
  });

  test('SCENARIO: Pet with no diagnoses returns empty array', async () => {
    DiagnosisModel.findByPet.mockResolvedValue([]);

    const req = mockReq({}, { pet_id: '999' });
    const res = mockRes();
    await diagCtrl.getByPet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.diagnoses).toEqual([]);
  });
});
