const { v4: uuidv4 } = require('uuid');
const ConsultationModel = require('../models/consultation.model');
const LlmContextModel = require('../models/llmContext.model');
const { query } = require('../config/db');
const { asyncHandler, ok, fail } = require('../utils/helpers');

exports.startConsultation = asyncHandler(async (req, res) => {
  const { pet_id, guest_handle } = req.body;
  const userId = req.user?.id || null;
  const isGuest = !userId;

  // Get 'active' status id
  const statusId = await ConsultationModel.getStatusIdByName('active');
  if (!statusId) return fail(res, 'Status "active" not found in mast_status', 500);

  // Create consultation
  const consultationId = await ConsultationModel.create(
    {
      user_id: userId,
      guest_handle: isGuest ? (guest_handle || `guest_${uuidv4().slice(0, 8)}`) : null,
      pet_id: pet_id || null,
      status_id: statusId,
      is_guest: isGuest,
    },
    userId
  );

  // Create conversation
  const convResult = await query(
    `INSERT INTO conversation (user_id, consultation_id, pet_id, status_id, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, consultationId, pet_id || null, statusId, userId],
    userId
  );
  const conversationId = convResult.insertId;

  // Create empty llm_context
  await LlmContextModel.upsert({
    conversation_id: conversationId,
    json_data: {},
    image_processing_snapshot: {},
    recent_messages: { user: [], ai: [] },
  });

  return ok(res, {
    consultation_id: consultationId,
    conversation_id: conversationId,
  }, 201);
});

exports.getById = asyncHandler(async (req, res) => {
  const consultation = await ConsultationModel.findById(req.params.id);
  if (!consultation) return fail(res, 'Consultation not found', 404);

  // Get linked diagnosis summary
  const diagnoses = await query(
    `SELECT id, primary_label, confidence, severity_flags, created_at
     FROM diagnosis WHERE consultation_id = ? ORDER BY created_at DESC`,
    [req.params.id]
  );

  return ok(res, { consultation, diagnoses });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const consultations = await ConsultationModel.findByUser(req.user.id);
  return ok(res, { consultations });
});
