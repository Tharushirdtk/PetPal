/**
 * Chat Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.5
 */

jest.mock('../config/db');
jest.mock('../models/llmContext.model');
jest.mock('../models/diagnosis.model');
jest.mock('../models/consultation.model');
jest.mock('../models/pet.model');
jest.mock('../models/emergencyPattern.model');
jest.mock('../services/llm.service');
jest.mock('../services/vectordb.service');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const { query } = require('../config/db');
const LlmContextModel = require('../models/llmContext.model');
const DiagnosisModel = require('../models/diagnosis.model');
const ConsultationModel = require('../models/consultation.model');
const PetModel = require('../models/pet.model');
const EmergencyPatternModel = require('../models/emergencyPattern.model');
const { getLLMResponse } = require('../services/llm.service');
const { querySimilar, addDiagnosisToVectorDB } = require('../services/vectordb.service');
const chatCtrl = require('../controllers/chat.controller');

function mockReq(body = {}, params = {}, user = null) {
  return { body, params, user };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Send Message ───────────────────────────────────
describe('Chat Controller - sendMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Missing conversation_id or message returns 400', async () => {
    const cases = [
      { conversation_id: 1 },
      { message: 'hello' },
      {},
    ];

    for (const body of cases) {
      const res = mockRes();
      await chatCtrl.sendMessage(mockReq(body), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversation_id and message are required',
        })
      );
    }
  });

  test('SCENARIO: Emergency pattern detected returns emergency response', async () => {
    EmergencyPatternModel.checkEmergency.mockResolvedValue({
      triggered: true,
      pattern: { id: 1, name: 'Seizure', severity: 'critical', priority: 1 },
      warning: '⚠️ EMERGENCY: Your pet needs immediate care!',
    });
    query.mockResolvedValue({});

    const req = mockReq(
      { conversation_id: 1, message: 'My dog is having a seizure' },
      {},
      { id: 456 }
    );
    const res = mockRes();
    await chatCtrl.sendMessage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.is_emergency).toBe(true);
    expect(data.reply).toContain('EMERGENCY');
    expect(data.is_final).toBe(false);
    // Should save both user msg and AI emergency response
    expect(query).toHaveBeenCalledTimes(2);
  });

  test('SCENARIO: Normal message gets AI response', async () => {
    EmergencyPatternModel.checkEmergency.mockResolvedValue({ triggered: false });
    LlmContextModel.getByConversation.mockResolvedValue({
      json_data: '{}',
      image_processing_snapshot: '{}',
      recent_messages: '{"user":[],"ai":[]}',
    });
    query.mockResolvedValue([]);
    querySimilar.mockResolvedValue([]);
    getLLMResponse.mockResolvedValue({
      reply: 'Based on your description, your dog may have allergic dermatitis.',
      diagnosis: null,
    });

    const req = mockReq(
      { conversation_id: 1, message: 'My dog has skin issues for 2 weeks' },
      {},
      { id: 456 }
    );
    const res = mockRes();
    await chatCtrl.sendMessage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.reply).toContain('allergic dermatitis');
    expect(data.is_final).toBe(false);
    expect(data.diagnosis_id).toBeNull();
  });

  test('SCENARIO: LLM returns diagnosis - saves to DB and marks consultation completed', async () => {
    EmergencyPatternModel.checkEmergency.mockResolvedValue({ triggered: false });
    LlmContextModel.getByConversation.mockResolvedValue({
      json_data: {},
      image_processing_snapshot: {},
      recent_messages: { user: [], ai: [] },
    });
    query.mockResolvedValue([]);
    querySimilar.mockResolvedValue([]);
    getLLMResponse.mockResolvedValue({
      reply: 'Final diagnosis: Allergic Dermatitis.',
      diagnosis: {
        primary_label: 'Allergic Dermatitis',
        confidence: 0.87,
        secondary_labels: ['food_allergy'],
        explanation: 'Skin condition from food allergy',
        recommended_actions: ['Change diet'],
        severity: 'moderate',
      },
    });
    ConsultationModel.findById.mockResolvedValue({ id: 10, pet_id: 123 });
    ConsultationModel.getStatusIdByName.mockResolvedValue(2);
    ConsultationModel.updateStatus.mockResolvedValue(true);
    DiagnosisModel.create.mockResolvedValue(50);
    PetModel.findById.mockResolvedValue({ species_name: 'Dog' });
    LlmContextModel.updateRecentMessages.mockResolvedValue(true);
    addDiagnosisToVectorDB.mockResolvedValue(true);

    const req = mockReq(
      { conversation_id: 1, message: 'Thank you', consultation_id: 10 },
      {},
      { id: 456 }
    );
    const res = mockRes();
    await chatCtrl.sendMessage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.is_final).toBe(true);
    expect(data.diagnosis_id).toBe(50);
    expect(DiagnosisModel.create).toHaveBeenCalled();
    expect(ConsultationModel.updateStatus).toHaveBeenCalledWith(10, 2, 456);
  });

  test('SCENARIO: LLM service fails (429 rate limit) returns friendly message', async () => {
    EmergencyPatternModel.checkEmergency.mockResolvedValue({ triggered: false });
    LlmContextModel.getByConversation.mockResolvedValue(null);
    query.mockResolvedValue([]);
    querySimilar.mockResolvedValue([]);

    const error = new Error('Rate limit');
    error.status = 429;
    getLLMResponse.mockRejectedValue(error);

    const req = mockReq(
      { conversation_id: 1, message: 'test' },
      {},
      { id: 1 }
    );
    const res = mockRes();
    await chatCtrl.sendMessage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.reply).toContain('temporarily busy');
    expect(data.is_final).toBe(false);
  });

  test('SCENARIO: LLM service fails (generic error) returns friendly message', async () => {
    EmergencyPatternModel.checkEmergency.mockResolvedValue({ triggered: false });
    LlmContextModel.getByConversation.mockResolvedValue(null);
    query.mockResolvedValue([]);
    querySimilar.mockResolvedValue([]);
    getLLMResponse.mockRejectedValue(new Error('Connection refused'));

    const req = mockReq({ conversation_id: 1, message: 'test' }, {}, { id: 1 });
    const res = mockRes();
    await chatCtrl.sendMessage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.reply).toContain('having trouble connecting');
    expect(data.is_final).toBe(false);
  });

  test('SCENARIO: Vector DB failure is non-fatal', async () => {
    EmergencyPatternModel.checkEmergency.mockResolvedValue({ triggered: false });
    LlmContextModel.getByConversation.mockResolvedValue(null);
    query.mockResolvedValue([]);
    querySimilar.mockRejectedValue(new Error('ChromaDB down'));
    getLLMResponse.mockResolvedValue({ reply: 'AI response', diagnosis: null });
    LlmContextModel.updateRecentMessages.mockResolvedValue(true);

    const req = mockReq({ conversation_id: 1, message: 'test' }, {}, { id: 1 });
    const res = mockRes();
    await chatCtrl.sendMessage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.reply).toBe('AI response');
  });

  test('SCENARIO: Guest user (no userId) can send messages', async () => {
    EmergencyPatternModel.checkEmergency.mockResolvedValue({ triggered: false });
    LlmContextModel.getByConversation.mockResolvedValue(null);
    query.mockResolvedValue([]);
    querySimilar.mockResolvedValue([]);
    getLLMResponse.mockResolvedValue({ reply: 'Guest response', diagnosis: null });
    LlmContextModel.updateRecentMessages.mockResolvedValue(true);

    const req = mockReq({ conversation_id: 5, message: 'help' }, {}, null);
    const res = mockRes();
    await chatCtrl.sendMessage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.reply).toBe('Guest response');
  });
});

// ── Get Chat History ───────────────────────────────
describe('Chat Controller - getHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns chat messages for consultation', async () => {
    query
      .mockResolvedValueOnce([{ id: 10 }]) // conversation lookup
      .mockResolvedValueOnce([
        { id: 1, sender_type: 'ai', content: 'Hello', created_at: '2026-04-05' },
        { id: 2, sender_type: 'user', content: 'Help', created_at: '2026-04-05' },
      ]);

    const req = mockReq({}, { consultation_id: '5' });
    const res = mockRes();
    await chatCtrl.getHistory(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.messages).toHaveLength(2);
    expect(data.conversation_id).toBe(10);
  });

  test('SCENARIO: No conversation found returns empty messages', async () => {
    query.mockResolvedValue([]);

    const req = mockReq({}, { consultation_id: '999' });
    const res = mockRes();
    await chatCtrl.getHistory(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.messages).toEqual([]);
    expect(data.conversation_id).toBeNull();
  });
});
