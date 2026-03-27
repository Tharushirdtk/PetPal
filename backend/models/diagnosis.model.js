const { query } = require('../config/db');

const DiagnosisModel = {
  async create({ consultation_id, pet_id, user_id, primary_label, confidence, secondary_labels, explanation, recommended_actions, severity_flags, status_id }) {
    const result = await query(
      `INSERT INTO diagnosis
         (consultation_id, pet_id, user_id, primary_label, confidence, secondary_labels, explanation, recommended_actions, severity_flags, status_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        consultation_id, pet_id, user_id || null,
        primary_label || null,
        confidence ?? null,
        secondary_labels ? JSON.stringify(secondary_labels) : null,
        explanation || null,
        recommended_actions ? JSON.stringify(recommended_actions) : null,
        severity_flags ? JSON.stringify(severity_flags) : null,
        status_id,
        user_id || null,
      ]
    );
    return result.insertId;
  },

  async findByConsultation(consultationId) {
    const rows = await query(
      `SELECT d.*, s.name AS status_name
       FROM diagnosis d
       LEFT JOIN mast_status s ON d.status_id = s.id
       WHERE d.consultation_id = ?
       ORDER BY d.created_at DESC`,
      [consultationId]
    );
    return rows;
  },

  async findByPet(petId) {
    return query(
      `SELECT d.*, s.name AS status_name, c.started_at AS consultation_started
       FROM diagnosis d
       LEFT JOIN mast_status s ON d.status_id = s.id
       LEFT JOIN consultation c ON d.consultation_id = c.id
       WHERE d.pet_id = ?
       ORDER BY d.created_at DESC`,
      [petId]
    );
  },

  async findById(id) {
    const rows = await query('SELECT * FROM diagnosis WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getSymptoms(diagnosisId) {
    return query(
      `SELECT ds.*, sm.name AS symptom_name
       FROM diagnosis_symptom ds
       LEFT JOIN symptom_master sm ON ds.symptom_id = sm.id
       WHERE ds.diagnosis_id = ?`,
      [diagnosisId]
    );
  },
};

module.exports = DiagnosisModel;
