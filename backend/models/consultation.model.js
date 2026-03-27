const { query } = require('../config/db');

const ConsultationModel = {
  async create({ user_id, guest_handle, pet_id, status_id, is_guest }, userId) {
    const result = await query(
      `INSERT INTO consultation (user_id, guest_handle, pet_id, status_id, is_guest, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id || null, guest_handle || null, pet_id || null, status_id, is_guest ? 1 : 0, userId || null],
      userId
    );
    return result.insertId;
  },

  async findById(id) {
    const rows = await query(
      `SELECT c.*, s.name AS status_name
       FROM consultation c
       LEFT JOIN mast_status s ON c.status_id = s.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUser(userId) {
    return query(
      `SELECT c.*, s.name AS status_name,
              p.name AS pet_name, sp.name AS species_name,
              d.primary_label, d.confidence, d.severity_flags
       FROM consultation c
       LEFT JOIN mast_status s ON c.status_id = s.id
       LEFT JOIN mast_pet p ON c.pet_id = p.id
       LEFT JOIN mast_species sp ON p.species_id = sp.id
       LEFT JOIN diagnosis d ON d.consultation_id = c.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );
  },

  async updateStatus(id, statusId, userId) {
    await query(
      'UPDATE consultation SET status_id = ?, completed_at = CURRENT_TIMESTAMP(6), updated_by = ? WHERE id = ?',
      [statusId, userId || null, id],
      userId
    );
  },

  async getStatusIdByName(name) {
    const rows = await query('SELECT id FROM mast_status WHERE name = ?', [name]);
    return rows[0]?.id || null;
  },
};

module.exports = ConsultationModel;
