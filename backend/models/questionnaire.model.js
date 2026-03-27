const { query } = require('../config/db');

const QuestionnaireModel = {
  async getActiveQuestionnaire() {
    const rows = await query(
      `SELECT * FROM questionnaire WHERE published = TRUE ORDER BY created_at DESC LIMIT 1`
    );
    return rows[0] || null;
  },

  async getQuestions() {
    return query(
      `SELECT q.*, GROUP_CONCAT(qo.id ORDER BY qo.id) AS option_ids
       FROM question q
       LEFT JOIN question_option qo ON qo.question_id = q.id AND qo.is_active = TRUE
       WHERE q.is_active = TRUE
       GROUP BY q.id
       ORDER BY q.display_order`
    );
  },

  async getQuestionsWithOptions() {
    const questions = await query(
      `SELECT * FROM question WHERE is_active = TRUE ORDER BY display_order`
    );
    const options = await query(
      `SELECT * FROM question_option WHERE is_active = TRUE ORDER BY question_id, id`
    );
    const rules = await query(
      `SELECT * FROM visibility_rules WHERE active = TRUE ORDER BY priority`
    );

    const optionMap = {};
    for (const opt of options) {
      if (!optionMap[opt.question_id]) optionMap[opt.question_id] = [];
      optionMap[opt.question_id].push(opt);
    }

    const ruleMap = {};
    for (const rule of rules) {
      if (rule.target_type === 'question') {
        if (!ruleMap[rule.target_id]) ruleMap[rule.target_id] = [];
        ruleMap[rule.target_id].push(rule);
      }
    }

    return questions.map(q => ({
      ...q,
      options: optionMap[q.id] || [],
      visibility_rules: ruleMap[q.id] || [],
    }));
  },

  async createResponse({ questionnaire_id, consultation_id, user_id, pet_id, is_new_pet }) {
    const result = await query(
      `INSERT INTO questionnaire_response (questionnaire_id, consultation_id, user_id, pet_id, is_new_pet, submitted_at, created_by)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(6), ?)`,
      [questionnaire_id, consultation_id || null, user_id || null, pet_id || null, is_new_pet ? 1 : 0, user_id || null]
    );
    return result.insertId;
  },

  async createAnswer({ response_id, question_id, selected_option_id, selected_option_value_key, selected_option_value_keys, free_text, answer_number }) {
    await query(
      `INSERT INTO questionnaire_response_answer
         (response_id, question_id, selected_option_id, selected_option_value_key, selected_option_value_keys, free_text, answer_number, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        response_id, question_id,
        selected_option_id || null,
        selected_option_value_key || null,
        selected_option_value_keys ? JSON.stringify(selected_option_value_keys) : null,
        free_text || null,
        answer_number ?? null,
      ]
    );
  },
};

module.exports = QuestionnaireModel;
