const { query } = require('../config/db');

const LlmContextModel = {
  /**
   * Get or create llm_context for a conversation.
   */
  async getByConversation(conversationId) {
    const rows = await query('SELECT * FROM llm_context WHERE conversation_id = ?', [conversationId]);
    return rows[0] || null;
  },

  /**
   * Upsert llm_context (INSERT ... ON DUPLICATE KEY UPDATE).
   */
  async upsert({ conversation_id, questionnaire_response_id, conversation_summary, recent_messages, json_data, image_processing_snapshot }) {
    await query(
      `INSERT INTO llm_context
         (conversation_id, questionnaire_response_id, conversation_summary, recent_messages, json_data, image_processing_snapshot)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         questionnaire_response_id = COALESCE(VALUES(questionnaire_response_id), questionnaire_response_id),
         conversation_summary = COALESCE(VALUES(conversation_summary), conversation_summary),
         recent_messages = COALESCE(VALUES(recent_messages), recent_messages),
         json_data = COALESCE(VALUES(json_data), json_data),
         image_processing_snapshot = COALESCE(VALUES(image_processing_snapshot), image_processing_snapshot)`,
      [
        conversation_id,
        questionnaire_response_id || null,
        conversation_summary || null,
        recent_messages ? JSON.stringify(recent_messages) : null,
        json_data ? JSON.stringify(json_data) : null,
        image_processing_snapshot ? JSON.stringify(image_processing_snapshot) : null,
      ]
    );
  },

  /**
   * Update only recent_messages JSON column.
   */
  async updateRecentMessages(conversationId, recentMessages) {
    await query(
      'UPDATE llm_context SET recent_messages = ? WHERE conversation_id = ?',
      [JSON.stringify(recentMessages), conversationId]
    );
  },

  /**
   * Update image_processing_snapshot.
   */
  async updateImageSnapshot(conversationId, snapshot) {
    await query(
      'UPDATE llm_context SET image_processing_snapshot = ? WHERE conversation_id = ?',
      [JSON.stringify(snapshot), conversationId]
    );
  },

  /**
   * Update json_data (questionnaire answers).
   */
  async updateJsonData(conversationId, jsonData) {
    await query(
      'UPDATE llm_context SET json_data = ? WHERE conversation_id = ?',
      [JSON.stringify(jsonData), conversationId]
    );
  },
};

module.exports = LlmContextModel;
