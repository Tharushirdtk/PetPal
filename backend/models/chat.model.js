const { query } = require('../config/db');

const ChatModel = {
  async getConversationByConsultation(consultationId) {
    const rows = await query(
      'SELECT id FROM conversation WHERE consultation_id = ? ORDER BY id DESC LIMIT 1',
      [consultationId]
    );
    return rows[0] || null;
  },

  async getMessages(conversationId, limit = 50) {
    // Ensure limit is a safe integer
    const safeLimit = Math.max(1, Math.min(500, parseInt(limit) || 50));

    const rows = await query(
      `SELECT id, sender_type, content, created_at, json_data FROM message WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ${safeLimit}`,
      [conversationId]
    );
    return rows;
  },

  async createMessage({ conversation_id, sender_type, content, userId }) {
    const result = await query(
      'INSERT INTO message (conversation_id, sender_type, content, created_by) VALUES (?, ?, ?, ?)',
      [conversation_id, sender_type, content, userId || null],
      userId
    );
    return result.insertId;
  },
};

module.exports = ChatModel;
