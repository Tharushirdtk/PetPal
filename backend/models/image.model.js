const { query } = require('../config/db');

const ImageModel = {
  async createAsset({ owner_user_id, pet_id, consultation_id, file_url, file_name, file_size, file_type }) {
    const result = await query(
      `INSERT INTO image_asset (owner_user_id, pet_id, consultation_id, file_url, file_name, file_size, file_type, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?)`,
      [owner_user_id || null, pet_id || null, consultation_id || null, file_url, file_name || null, file_size || null, file_type || null, owner_user_id || null],
      owner_user_id
    );
    return result.insertId;
  },

  async findById(id) {
    const rows = await query('SELECT * FROM image_asset WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    await query('UPDATE image_asset SET status = ? WHERE id = ?', [status, id]);
  },

  async createJob(imageAssetId) {
    const result = await query(
      `INSERT INTO image_processing_job (image_asset_id, job_status) VALUES (?, 'queued')`,
      [imageAssetId]
    );
    return result.insertId;
  },

  async updateJobStatus(jobId, status) {
    const updates = { job_status: status };
    if (status === 'running') updates.started_at = new Date();
    if (status === 'success' || status === 'failed') updates.completed_at = new Date();

    const fields = Object.entries(updates).map(([k]) => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    await query(`UPDATE image_processing_job SET ${fields} WHERE id = ?`, [...values, jobId]);
  },

  async createAnalysis({ image_processing_job_id, image_asset_id, raw_result_json, prediction_text, raw_confidence_percent, ml_model, top_label, top_confidence, processing_time_ms }) {
    const result = await query(
      `INSERT INTO image_analysis (image_processing_job_id, image_asset_id, raw_result_json, prediction_text, raw_confidence_percent, ml_model, top_label, top_confidence, processing_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [image_processing_job_id, image_asset_id, JSON.stringify(raw_result_json), prediction_text, raw_confidence_percent, ml_model, top_label, top_confidence, processing_time_ms]
    );
    return result.insertId;
  },

  async getAnalysisByAssetId(imageAssetId) {
    const rows = await query(
      'SELECT * FROM image_analysis WHERE image_asset_id = ? ORDER BY id DESC LIMIT 1',
      [imageAssetId]
    );
    return rows[0] || null;
  },

  async getJobByAssetId(imageAssetId) {
    const rows = await query(
      'SELECT * FROM image_processing_job WHERE image_asset_id = ? ORDER BY id DESC LIMIT 1',
      [imageAssetId]
    );
    return rows[0] || null;
  },
};

module.exports = ImageModel;
