/**
 * Questionnaire Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.1 Step 3
 */

jest.mock('../models/questionnaire.model');
jest.mock('../models/llmContext.model');
jest.mock('../services/ruleEngine.service');
jest.mock('../config/db');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const QuestionnaireModel = require('../models/questionnaire.model');
const LlmContextModel = require('../models/llmContext.model');
const { getVisibleQuestions } = require('../services/ruleEngine.service');
const { query } = require('../config/db');
const questCtrl = require('../controllers/questionnaire.controller');

function mockReq(body = {}, params = {}, user = null) {
  return { body, params, user };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Get Active Questionnaire ───────────────────────
describe('Questionnaire Controller - getActive', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns active questionnaire with questions', async () => {
    QuestionnaireModel.getActiveQuestionnaire.mockResolvedValue({
      id: 1, name: 'Pet Health Assessment', published: true,
    });
    QuestionnaireModel.getQuestionsWithOptions.mockResolvedValue([
      {
        id: 1, code: 'q1', text: 'Main concern?', question_type: 'single_select',
        options: [{ id: 1, value_key: 'skin_issues', label: 'Skin problems' }],
      },
    ]);

    const res = mockRes();
    await questCtrl.getActive({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.questionnaire.published).toBe(true);
    expect(data.questions).toHaveLength(1);
  });

  test('SCENARIO: No active questionnaire returns 404', async () => {
    QuestionnaireModel.getActiveQuestionnaire.mockResolvedValue(null);

    const res = mockRes();
    await questCtrl.getActive({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'No active questionnaire found' })
    );
  });
});

// ── Save Context ───────────────────────────────────
describe('Questionnaire Controller - saveContext', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Saves answers to llm_context', async () => {
    query.mockResolvedValue([{ id: 10 }]);
    LlmContextModel.getByConversation.mockResolvedValue({ json_data: '{}' });
    LlmContextModel.updateJsonData.mockResolvedValue(true);

    const req = mockReq({
      consultation_id: 5,
      answers: { main_concern: 'skin_issues', severity: 'moderate' },
    });
    const res = mockRes();
    await questCtrl.saveContext(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(LlmContextModel.updateJsonData).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        answers: { main_concern: 'skin_issues', severity: 'moderate' },
      })
    );
  });

  test('SCENARIO: Missing consultation_id or answers returns 400', async () => {
    const cases = [
      { consultation_id: 5 },
      { answers: {} },
      { consultation_id: 5, answers: 'not-object' },
      {},
    ];

    for (const body of cases) {
      const res = mockRes();
      await questCtrl.saveContext(mockReq(body), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    }
  });

  test('SCENARIO: No conversation found returns 404', async () => {
    query.mockResolvedValue([]);

    const req = mockReq({ consultation_id: 999, answers: { q1: 'a' } });
    const res = mockRes();
    await questCtrl.saveContext(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'No conversation found for this consultation' })
    );
  });
});

// ── Submit Response ────────────────────────────────
describe('Questionnaire Controller - submitResponse', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Submit responses with answers array returns 201', async () => {
    QuestionnaireModel.createResponse.mockResolvedValue(50);
    QuestionnaireModel.createAnswer.mockResolvedValue(true);
    query
      .mockResolvedValueOnce([{ code: 'main_concern' }])
      .mockResolvedValueOnce([{ code: 'severity' }]);

    const req = mockReq({
      questionnaire_id: 1,
      answers: [
        { question_id: 1, selected_option_value_key: 'skin_issues' },
        { question_id: 2, selected_option_value_key: 'moderate' },
      ],
    });
    const res = mockRes();
    await questCtrl.submitResponse(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.response_id).toBe(50);
    expect(data.structured_answers.main_concern).toBe('skin_issues');
    expect(data.structured_answers.severity).toBe('moderate');
  });

  test('SCENARIO: Missing questionnaire_id returns 400', async () => {
    const res = mockRes();
    await questCtrl.submitResponse(mockReq({ answers: [] }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('SCENARIO: Missing answers array returns 400', async () => {
    const res = mockRes();
    await questCtrl.submitResponse(mockReq({ questionnaire_id: 1 }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('SCENARIO: answers must be an array not object returns 400', async () => {
    const res = mockRes();
    await questCtrl.submitResponse(
      mockReq({ questionnaire_id: 1, answers: { q1: 'v' } }),
      res, jest.fn()
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('SCENARIO: Multi-select answers stored as array', async () => {
    QuestionnaireModel.createResponse.mockResolvedValue(60);
    QuestionnaireModel.createAnswer.mockResolvedValue(true);
    query.mockResolvedValue([{ code: 'affected_areas' }]);

    const req = mockReq({
      questionnaire_id: 1,
      answers: [
        {
          question_id: 3,
          selected_option_value_keys: ['face', 'ears', 'paws'],
        },
      ],
    });
    const res = mockRes();
    await questCtrl.submitResponse(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.structured_answers.affected_areas).toEqual(['face', 'ears', 'paws']);
  });

  test('SCENARIO: Free text answers stored correctly', async () => {
    QuestionnaireModel.createResponse.mockResolvedValue(70);
    QuestionnaireModel.createAnswer.mockResolvedValue(true);
    query.mockResolvedValue([{ code: 'additional_notes' }]);

    const req = mockReq({
      questionnaire_id: 1,
      answers: [
        { question_id: 5, free_text: 'My dog has been scratching a lot' },
      ],
    });
    const res = mockRes();
    await questCtrl.submitResponse(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.structured_answers.additional_notes).toBe('My dog has been scratching a lot');
  });

  test('SCENARIO: With context, evaluates visibility rules', async () => {
    QuestionnaireModel.createResponse.mockResolvedValue(80);
    QuestionnaireModel.createAnswer.mockResolvedValue(true);
    QuestionnaireModel.getQuestionsWithOptions.mockResolvedValue([
      { id: 1, code: 'q1' },
      { id: 2, code: 'q2' },
    ]);
    query.mockResolvedValue([{ code: 'q1' }]);
    getVisibleQuestions.mockResolvedValue([{ id: 1, code: 'q1' }]);

    const req = mockReq({
      questionnaire_id: 1,
      answers: [{ question_id: 1, selected_option_value_key: 'val' }],
      context: { pet: { species: 'dog' } },
    });
    const res = mockRes();
    await questCtrl.submitResponse(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.visible_question_ids).toEqual([1]);
    expect(getVisibleQuestions).toHaveBeenCalled();
  });

  test('SCENARIO: LLM context updated when consultation_id provided', async () => {
    QuestionnaireModel.createResponse.mockResolvedValue(90);
    QuestionnaireModel.createAnswer.mockResolvedValue(true);
    query
      .mockResolvedValueOnce([{ code: 'q1' }])           // question code lookup
      .mockResolvedValueOnce([{ id: 20 }])                // conversation lookup
      .mockResolvedValueOnce({});                         // update llm_context link

    LlmContextModel.getByConversation.mockResolvedValue({ json_data: '{}' });
    LlmContextModel.updateJsonData.mockResolvedValue(true);

    const req = mockReq({
      questionnaire_id: 1,
      consultation_id: 5,
      answers: [{ question_id: 1, selected_option_value_key: 'skin_issues' }],
    });
    const res = mockRes();
    await questCtrl.submitResponse(req, res, jest.fn());

    expect(LlmContextModel.updateJsonData).toHaveBeenCalled();
  });
});
