const { query } = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const rows = await query('SELECT * FROM mast_user WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const rows = await query(
      'SELECT id, first_name, last_name, email, phone, preferred_language, is_verified, role, created_at FROM mast_user WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async create({ first_name, last_name, email, password_hash, phone, preferred_language }) {
    const result = await query(
      `INSERT INTO mast_user (first_name, last_name, email, password_hash, phone, preferred_language, created_by)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [first_name, last_name, email, password_hash, phone || null, preferred_language || null]
    );
    return result.insertId;
  },

  async findByIdWithPassword(id) {
    const rows = await query('SELECT * FROM mast_user WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async update(id, { first_name, last_name, phone, preferred_language }) {
    await query(
      'UPDATE mast_user SET first_name = ?, last_name = ?, phone = ?, preferred_language = ? WHERE id = ?',
      [first_name, last_name, phone || null, preferred_language || null, id],
      id
    );
    return this.findById(id);
  },

  async updatePassword(id, newPasswordHash) {
    await query('UPDATE mast_user SET password_hash = ? WHERE id = ?', [newPasswordHash, id], id);
  },
};

module.exports = UserModel;
