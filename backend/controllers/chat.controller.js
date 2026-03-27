const { query } = require('../config/db');
const LlmContextModel = require('../models/llmContext.model');
const DiagnosisModel = require('../models/diagnosis.model');
const ConsultationModel = require('../models/consultation.model');
const PetModel = require('../models/pet.model');
const { getLLMResponse } = require('../services/llm.service');
const { querySimilar, addDiagnosisToVectorDB } = require('../services/vectordb.service');
const { checkEmergency } = require('../utils/emergency');
const { asyncHandler, ok, fail } = require('../utils/helpers');

exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversation_id, message, consultation_id } = req.body;
  const userId = req.user?.id || null;

  if (!conversation_id || !message) {
    return fail(res, 'conversation_id and message are required');
  }

  // 1. Save user message to message table
  await query(
    `INSERT INTO message (conversation_id, sender_type, content, created_by)
     VALUES (?, 'user', ?, ?)`,
    [conversation_id, message, userId]
  );

  // 2. Emergency trigger check — skip LLM if triggered
  const emergency = checkEmergency(message);
  if (emergency.triggered) {
    // Save emergency response as AI message
    await query(
      `INSERT INTO message (conversation_id, sender_type, content, created_by)
       VALUES (?, 'ai', ?, NULL)`,
      [conversation_id, emergency.warning]
    );

    return ok(res, {
      reply: emergency.warning,
      is_final: false,
      is_emergency: true,
    });
  }

  // 3. Load llm_context
  const llmContext = await LlmContextModel.getByConversation(conversation_id);
  const jsonData = llmContext?.json_data
    ? (typeof llmContext.json_data === 'string' ? JSON.parse(llmContext.json_data) : llmContext.json_data)
    : {};
  const imageSnapshot = llmContext?.image_processing_snapshot
    ? (typeof llmContext.image_processing_snapshot === 'string'
        ? JSON.parse(llmContext.image_processing_snapshot)
        : llmContext.image_processing_snapshot)
    : {};
  const recentMsgs = llmContext?.recent_messages
    ? (typeof llmContext.recent_messages === 'string' ? JSON.parse(llmContext.recent_messages) : llmContext.recent_messages)
    : { user: [], ai: [] };

  // 4. Load pet info if available
  let pet = null;
  if (consultation_id) {
    const consultation = await ConsultationModel.findById(consultation_id);
    if (consultation?.pet_id) {
      pet = await PetModel.findById(consultation.pet_id);
    }
  }

  // 5. Build conversation history (last 3 user + last 3 AI interleaved)
  const historyRows = await query(
    `SELECT sender_type, content FROM message
     WHERE conversation_id = ?
     ORDER BY created_at DESC
     LIMIT 6`,
    [conversation_id]
  );
  const conversationHistory = historyRows.reverse();

  // 6. Query ChromaDB for similar past cases
  let vectorResults = [];
  try {
    vectorResults = await querySimilar(message, 3);
  } catch (err) {
    console.warn('Vector DB query failed (non-fatal):', err.message);
  }

  // 7. Call Gemini LLM
  const { reply, diagnosis } = await getLLMResponse({
    pet,
    jsonAnswers: jsonData.answers || {},
    imageSnapshot,
    vectorResults,
    conversationHistory,
    currentMessage: message,
  });

  // 8. Save AI response to message table
  await query(
    `INSERT INTO message (conversation_id, sender_type, content, created_by)
     VALUES (?, 'ai', ?, NULL)`,
    [conversation_id, reply]
  );

  // 9. Update llm_context.recent_messages (keep last 3 each)
  recentMsgs.user = [...(recentMsgs.user || []), message].slice(-3);
  recentMsgs.ai = [...(recentMsgs.ai || []), reply].slice(-3);
  await LlmContextModel.updateRecentMessages(conversation_id, recentMsgs);

  // 10. If confident diagnosis detected, save to DB
  let diagnosisId = null;
  if (diagnosis && consultation_id) {
    const completedStatusId = await ConsultationModel.getStatusIdByName('completed');

    // Get pet_id from consultation
    const consultation = await ConsultationModel.findById(consultation_id);
    const petId = consultation?.pet_id;

    if (petId && completedStatusId) {
      diagnosisId = await DiagnosisModel.create({
        consultation_id,
        pet_id: petId,
        user_id: userId,
        primary_label: diagnosis.primary_label,
        confidence: diagnosis.confidence,
        secondary_labels: diagnosis.secondary_labels,
        explanation: diagnosis.explanation,
        recommended_actions: diagnosis.recommended_actions,
        severity_flags: { severity: diagnosis.severity },
        status_id: completedStatusId,
      });

      // Update consultation status to completed
      await ConsultationModel.updateStatus(consultation_id, completedStatusId, userId);

      // Add to vector DB for future RAG
      try {
        const vectorText = `${diagnosis.primary_label}: ${diagnosis.explanation}. Symptoms: ${JSON.stringify(diagnosis.secondary_labels)}`;
        await addDiagnosisToVectorDB(diagnosisId, vectorText, {
          species: pet?.species_name || 'unknown',
          primary_label: diagnosis.primary_label,
        });
      } catch (err) {
        console.warn('Failed to add diagnosis to vector DB:', err.message);
      }
    }
  }

  return ok(res, {
    reply,
    is_final: !!diagnosis,
    diagnosis_id: diagnosisId,
    diagnosis_data: diagnosis || null,
  });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const { consultation_id } = req.params;

  const convRows = await query(
    'SELECT id FROM conversation WHERE consultation_id = ? ORDER BY id DESC LIMIT 1',
    [consultation_id]
  );
  if (!convRows[0]) return ok(res, { messages: [], conversation_id: null });

  const messages = await query(
    'SELECT id, sender_type, content, created_at, json_data FROM message WHERE conversation_id = ? ORDER BY created_at ASC',
    [convRows[0].id]
  );
  return ok(res, { messages, conversation_id: convRows[0].id });
});
