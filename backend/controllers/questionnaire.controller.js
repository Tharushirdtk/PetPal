const QuestionnaireModel = require('../models/questionnaire.model');
const LlmContextModel = require('../models/llmContext.model');
const { getVisibleQuestions } = require('../services/ruleEngine.service');
const { query } = require('../config/db');
const { asyncHandler, ok, fail } = require('../utils/helpers');

exports.getActive = asyncHandler(async (_req, res) => {
  const questionnaire = await QuestionnaireModel.getActiveQuestionnaire();
  if (!questionnaire) return fail(res, 'No active questionnaire found', 404);

  const questionsWithRules = await QuestionnaireModel.getQuestionsWithOptions();

  return ok(res, {
    questionnaire,
    questions: questionsWithRules,
  });
});

/**
 * Save structured answers directly to llm_context (used when mock questions are used
 * or when we just need to update the LLM context with questionnaire answers).
 */
exports.saveContext = asyncHandler(async (req, res) => {
  const { consultation_id, answers } = req.body;

  if (!consultation_id || !answers || typeof answers !== 'object') {
    return fail(res, 'consultation_id and answers object are required');
  }

  // Find conversation for this consultation
  const convRows = await query(
    'SELECT id FROM conversation WHERE consultation_id = ? ORDER BY id DESC LIMIT 1',
    [consultation_id]
  );

  if (!convRows[0]) {
    return fail(res, 'No conversation found for this consultation', 404);
  }

  const conversationId = convRows[0].id;

  // Load existing llm_context
  const existing = await LlmContextModel.getByConversation(conversationId);
  const currentData = existing?.json_data
    ? (typeof existing.json_data === 'string' ? JSON.parse(existing.json_data) : existing.json_data)
    : {};

  // Merge answers into json_data
  currentData.answers = answers;

  await LlmContextModel.updateJsonData(conversationId, currentData);

  return ok(res, { message: 'Context updated', conversation_id: conversationId });
});

exports.submitResponse = asyncHandler(async (req, res) => {
  const {
    questionnaire_id,
    consultation_id,
    pet_id,
    is_new_pet,
    answers,      // Array of { question_id, selected_option_id?, selected_option_value_key?, selected_option_value_keys?, free_text?, answer_number? }
    context,      // { pet: {...}, image_analysis: {...} } — for rule evaluation
  } = req.body;

  const userId = req.user?.id || null;

  if (!questionnaire_id || !answers || !Array.isArray(answers)) {
    return fail(res, 'questionnaire_id and answers array are required');
  }

  // Create questionnaire_response
  const responseId = await QuestionnaireModel.createResponse({
    questionnaire_id,
    consultation_id,
    user_id: userId,
    pet_id: pet_id || null,
    is_new_pet: is_new_pet || false,
  });

  // Insert all answer rows
  for (const answer of answers) {
    await QuestionnaireModel.createAnswer({
      response_id: responseId,
      question_id: answer.question_id,
      selected_option_id: answer.selected_option_id,
      selected_option_value_key: answer.selected_option_value_key,
      selected_option_value_keys: answer.selected_option_value_keys,
      free_text: answer.free_text,
      answer_number: answer.answer_number,
    });
  }

  // Build structured answers object for llm_context
  const structuredAnswers = {};
  for (const answer of answers) {
    // Look up question code
    const qRows = await query('SELECT code FROM question WHERE id = ?', [answer.question_id]);
    const code = qRows[0]?.code || `q_${answer.question_id}`;

    if (answer.selected_option_value_keys && answer.selected_option_value_keys.length > 0) {
      structuredAnswers[code] = answer.selected_option_value_keys;
    } else if (answer.selected_option_value_key) {
      structuredAnswers[code] = answer.selected_option_value_key;
    } else if (answer.free_text) {
      structuredAnswers[code] = answer.free_text;
    } else if (answer.answer_number !== undefined && answer.answer_number !== null) {
      structuredAnswers[code] = answer.answer_number;
    }
  }

  // Evaluate visibility rules if context provided
  let visibleQuestionIds = null;
  if (context) {
    const questionsWithRules = await QuestionnaireModel.getQuestionsWithOptions();
    const evalContext = {
      pet: context.pet || {},
      answers: structuredAnswers,
      image_analysis: context.image_analysis || {},
    };
    const visible = await getVisibleQuestions(questionsWithRules, evalContext);
    visibleQuestionIds = visible.map(q => q.id);
  }

  // Update llm_context.json_data with structured answers
  if (consultation_id) {
    const convRows = await query(
      'SELECT id FROM conversation WHERE consultation_id = ? ORDER BY id DESC LIMIT 1',
      [consultation_id]
    );
    if (convRows[0]) {
      const existing = await LlmContextModel.getByConversation(convRows[0].id);
      const currentData = existing?.json_data
        ? (typeof existing.json_data === 'string' ? JSON.parse(existing.json_data) : existing.json_data)
        : {};

      currentData.answers = structuredAnswers;
      if (context?.pet) currentData.pet = context.pet;

      await LlmContextModel.updateJsonData(convRows[0].id, currentData);

      // Link questionnaire_response to llm_context
      await query(
        'UPDATE llm_context SET questionnaire_response_id = ? WHERE conversation_id = ?',
        [responseId, convRows[0].id]
      );
    }
  }

  return ok(res, {
    response_id: responseId,
    structured_answers: structuredAnswers,
    visible_question_ids: visibleQuestionIds,
  }, 201);
});
