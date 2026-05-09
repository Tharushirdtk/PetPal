const path = require('path');
const { query } = require('../config/db');
const { runInference } = require('../services/imageModel.service');
const LlmContextModel = require('../models/llmContext.model');
const { asyncHandler, ok, fail } = require('../utils/helpers');

function extractDiseaseName(predictionText) {
  if (!predictionText) return predictionText;
  for (const suffix of [' in Cat', ' in Dog']) {
    if (predictionText.endsWith(suffix)) return predictionText.slice(0, -suffix.length);
  }
  return predictionText;
}

exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, 'No image file uploaded');
  }

  const { consultation_id, pet_id } = req.body;
  const userId = req.user?.id || null;
  const filePath = req.file.path;
  const fileUrl = `/uploads/${req.file.filename}`;

  // 1. Create image_asset
  const assetResult = await query(
    `INSERT INTO image_asset (owner_user_id, pet_id, consultation_id, file_url, file_name, file_size, file_type, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'queued', ?)`,
    [userId, pet_id || null, consultation_id || null, fileUrl, req.file.originalname, req.file.size, req.file.mimetype, userId]
  );
  const imageAssetId = assetResult.insertId;

  // 2. Create image_processing_job
  const jobResult = await query(
    `INSERT INTO image_processing_job (image_asset_id, job_status, created_by)
     VALUES (?, 'queued', ?)`,
    [imageAssetId, userId]
  );
  const jobId = jobResult.insertId;

  // 3. Update status to analyzing
  await query("UPDATE image_asset SET status = 'analyzing' WHERE id = ?", [imageAssetId]);
  await query("UPDATE image_processing_job SET job_status = 'running', started_at = CURRENT_TIMESTAMP(6) WHERE id = ?", [jobId]);

  // 4. Run inference
  let analysisResult;
  try {
    const absolutePath = path.resolve(filePath);
    const startTime = Date.now();

    // Look up pet species to filter predictions to correct animal type
    let species = null;
    if (pet_id) {
      const petRows = await query(
        `SELECT s.name AS species_name FROM mast_pet p
         JOIN mast_species s ON p.species_id = s.id
         WHERE p.id = ?`,
        [pet_id]
      );
      if (petRows[0]) species = petRows[0].species_name;
    }

    analysisResult = await runInference(absolutePath, species);
    const processingTime = Date.now() - startTime;

    // 5. Save to image_analysis
    const topConfidence = (analysisResult.confidence_percent / 100);

    await query(
      `INSERT INTO image_analysis
         (image_processing_job_id, image_asset_id, raw_result_json, prediction_text,
          raw_confidence_percent, ml_model, top_label, top_confidence, processing_time_ms, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId, imageAssetId,
        JSON.stringify(analysisResult.raw_result),
        analysisResult.prediction_text,
        analysisResult.confidence_percent,
        'petpal_skin_model_v1',
        analysisResult.top_label,
        topConfidence,
        processingTime,
        userId,
      ]
    );

    // 6. Update statuses to success/complete
    await query("UPDATE image_asset SET status = 'complete' WHERE id = ?", [imageAssetId]);
    await query(
      "UPDATE image_processing_job SET job_status = 'success', completed_at = CURRENT_TIMESTAMP(6) WHERE id = ?",
      [jobId]
    );

    // 7. Update llm_context.image_processing_snapshot
    if (consultation_id) {
      const convRows = await query(
        'SELECT id FROM conversation WHERE consultation_id = ? ORDER BY id DESC LIMIT 1',
        [consultation_id]
      );
      if (convRows[0]) {
        const existing = await LlmContextModel.getByConversation(convRows[0].id);
        const currentSnapshot = existing?.image_processing_snapshot
          ? (typeof existing.image_processing_snapshot === 'string'
              ? JSON.parse(existing.image_processing_snapshot)
              : existing.image_processing_snapshot)
          : {};

        currentSnapshot.latest = {
          image_asset_id: imageAssetId,
          prediction_text: analysisResult.prediction_text,
          top_label: analysisResult.top_label,
          disease_name: analysisResult.disease_name,
          confidence_percent: analysisResult.confidence_percent,
          top_confidence: topConfidence,
          confidence_level: analysisResult.confidence_level,
          is_uncertain: analysisResult.is_uncertain,
          prediction_note: analysisResult.prediction_note,
          top5: analysisResult.top5,
        };

        await LlmContextModel.updateImageSnapshot(convRows[0].id, currentSnapshot);
      }
    }
  } catch (err) {
    // Mark as failed
    await query("UPDATE image_asset SET status = 'error' WHERE id = ?", [imageAssetId]);
    await query(
      "UPDATE image_processing_job SET job_status = 'failed', completed_at = CURRENT_TIMESTAMP(6) WHERE id = ?",
      [jobId]
    );

    return ok(res, {
      image_asset_id: imageAssetId,
      status: 'error',
      error: err.message,
    }, 201);
  }

  return ok(res, {
    image_asset_id: imageAssetId,
    file_url: fileUrl,
    status: 'complete',
    analysis: {
      prediction_text: analysisResult.prediction_text,
      disease_name: analysisResult.disease_name,
      top_label: analysisResult.top_label,
      confidence_percent: analysisResult.confidence_percent,
      confidence_level: analysisResult.confidence_level,
      is_uncertain: analysisResult.is_uncertain,
      prediction_note: analysisResult.prediction_note,
      top5: (analysisResult.top5 || []).map((item) => ({
        ...item,
        label: extractDiseaseName(item.label),
      })),
    },
  }, 201);
});

exports.getStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assets = await query('SELECT * FROM image_asset WHERE id = ?', [id]);
  if (assets.length === 0) return fail(res, 'Image not found', 404);

  const asset = assets[0];
  let analysis = null;

  if (asset.status === 'complete') {
    const rows = await query(
      'SELECT * FROM image_analysis WHERE image_asset_id = ? ORDER BY processed_at DESC LIMIT 1',
      [id]
    );
    if (rows[0]) {
      analysis = rows[0];
      if (typeof analysis.raw_result_json === 'string') {
        analysis.raw_result_json = JSON.parse(analysis.raw_result_json);
      }
      // Derive disease_name — not stored in DB, computed from prediction_text
      analysis.disease_name = extractDiseaseName(analysis.prediction_text);
      // Clean top5 labels too
      if (analysis.raw_result_json?.top5) {
        analysis.raw_result_json.top5 = analysis.raw_result_json.top5.map((item) => ({
          ...item,
          label: extractDiseaseName(item.label),
        }));
      }
    }
  }

  return ok(res, { image: asset, analysis });
});
