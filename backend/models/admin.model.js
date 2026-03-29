const { query } = require('../config/db');

const AdminModel = {
  // --- Questions ---
  async listQuestions() {
    const questions = await query(
      'SELECT * FROM question ORDER BY display_order ASC'
    );
    for (const q of questions) {
      q.options = await query(
        'SELECT id, value_key, label, is_active FROM question_option WHERE question_id = ? ORDER BY id ASC',
        [q.id]
      );
      q.visibility_rules = await query(
        "SELECT id, condition_json, priority, active FROM visibility_rules WHERE target_type = 'question' AND target_id = ?",
        [q.id]
      );
    }
    return questions;
  },

  async createQuestion({ code, text, question_type, display_order, options }) {
    const result = await query(
      'INSERT INTO question (code, text, question_type, display_order) VALUES (?, ?, ?, ?)',
      [code, text, question_type || 'single', display_order || 0]
    );
    const questionId = result.insertId;

    if (options && options.length > 0) {
      for (const opt of options) {
        await query(
          'INSERT INTO question_option (question_id, value_key, label) VALUES (?, ?, ?)',
          [questionId, opt.value_key, opt.label]
        );
      }
    }

    return this.getQuestionById(questionId);
  },

  async getQuestionById(id) {
    const rows = await query('SELECT * FROM question WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const q = rows[0];
    q.options = await query(
      'SELECT id, value_key, label, is_active FROM question_option WHERE question_id = ?',
      [id]
    );
    q.visibility_rules = await query(
      "SELECT id, condition_json, priority, active FROM visibility_rules WHERE target_type = 'question' AND target_id = ?",
      [id]
    );
    return q;
  },

  async updateQuestion(id, { text, question_type, display_order, is_active }) {
    const fields = [];
    const params = [];
    if (text !== undefined) { fields.push('text = ?'); params.push(text); }
    if (question_type !== undefined) { fields.push('question_type = ?'); params.push(question_type); }
    if (display_order !== undefined) { fields.push('display_order = ?'); params.push(display_order); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active); }

    if (fields.length === 0) return this.getQuestionById(id);

    params.push(id);
    await query(`UPDATE question SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.getQuestionById(id);
  },

  async deactivateQuestion(id) {
    await query('UPDATE question SET is_active = FALSE WHERE id = ?', [id]);
  },

  // --- Visibility Rules ---
  async createVisibilityRule({ target_type, target_id, condition_json, priority }) {
    const result = await query(
      'INSERT INTO visibility_rules (target_type, target_id, condition_json, priority) VALUES (?, ?, ?, ?)',
      [target_type, target_id, JSON.stringify(condition_json), priority || 100]
    );
    const rows = await query('SELECT * FROM visibility_rules WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  async deleteVisibilityRule(id) {
    await query('DELETE FROM visibility_rules WHERE id = ?', [id]);
  },

  // --- Contacts ---
  async listContacts({ status, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM contact_message';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await query(countSql, params);
    const total = countResult.total;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = await query(sql, params);

    return { contacts: rows, pagination: { page, limit, total } };
  },

  async updateContactStatus(id, status) {
    await query('UPDATE contact_message SET status = ? WHERE id = ?', [status, id]);
    const rows = await query('SELECT * FROM contact_message WHERE id = ?', [id]);
    return rows[0];
  },

  async getStats() {
    try {
      const [questions] = await query(
        'SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) as active, COALESCE(SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END), 0) as inactive FROM question'
      );
      const [rules] = await query(
        'SELECT COUNT(*) as total FROM visibility_rules'
      );
      const contactRows = await query(
        "SELECT status, COUNT(*) as count FROM contact_message GROUP BY status"
      );
      const contacts = { total: 0, new: 0, read: 0, resolved: 0 };
      if (contactRows && contactRows.length > 0) {
        for (const r of contactRows) {
          contacts[r.status] = r.count;
          contacts.total += r.count;
        }
      }
      const [consultations] = await query(
        'SELECT COUNT(*) as total FROM consultation'
      );
      const [diagnoses] = await query(
        'SELECT COUNT(*) as total FROM diagnosis'
      );
      const [users] = await query(
        'SELECT COUNT(*) as total FROM mast_user'
      );
      return {
        questions: {
          total: questions?.total || 0,
          active: questions?.active || 0,
          inactive: questions?.inactive || 0
        },
        rules: { total: rules?.total || 0 },
        contacts,
        consultations: { total: consultations?.total || 0 },
        diagnoses: { total: diagnoses?.total || 0 },
        users: { total: users?.total || 0 },
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        questions: { total: 0, active: 0, inactive: 0 },
        rules: { total: 0 },
        contacts: { total: 0, new: 0, read: 0, resolved: 0 },
        consultations: { total: 0 },
        diagnoses: { total: 0 },
        users: { total: 0 },
      };
    }
  },
};

module.exports = AdminModel;
