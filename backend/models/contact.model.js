const { query } = require('../config/db');

const ContactModel = {
  async create({ heading, email, message }) {
    const result = await query(
      'INSERT INTO contact_message (heading, email, message) VALUES (?, ?, ?)',
      [heading || null, email || null, message]
    );
    return result.insertId;
  },

  async findAll({ status, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    // Ensure limit and offset are safe integers
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    let sql = 'SELECT * FROM contact_message';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    // Count total
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await query(countSql, params);
    const total = countResult.total;

    // Use literal values for LIMIT/OFFSET to avoid prepared statement issues
    sql += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const rows = await query(sql, params);
    return { contacts: rows, pagination: { page, limit: safeLimit, total } };
  },

  async updateStatus(id, status) {
    await query('UPDATE contact_message SET status = ? WHERE id = ?', [status, id]);
    const rows = await query('SELECT * FROM contact_message WHERE id = ?', [id]);
    return rows[0] || null;
  },
};

module.exports = ContactModel;
