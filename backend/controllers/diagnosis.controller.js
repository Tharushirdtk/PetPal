const DiagnosisModel = require('../models/diagnosis.model');
const { query } = require('../config/db');
const { asyncHandler, ok, fail } = require('../utils/helpers');

exports.getByConsultation = asyncHandler(async (req, res) => {
  const { consultation_id } = req.params;
  const diagnoses = await DiagnosisModel.findByConsultation(consultation_id);

  if (diagnoses.length === 0) {
    return ok(res, { diagnosis: null, symptoms: [] });
  }

  const diagnosis = diagnoses[0];
  const symptoms = await DiagnosisModel.getSymptoms(diagnosis.id);

  // Parse JSON fields
  if (typeof diagnosis.secondary_labels === 'string') {
    diagnosis.secondary_labels = JSON.parse(diagnosis.secondary_labels);
  }
  if (typeof diagnosis.recommended_actions === 'string') {
    diagnosis.recommended_actions = JSON.parse(diagnosis.recommended_actions);
  }
  if (typeof diagnosis.severity_flags === 'string') {
    diagnosis.severity_flags = JSON.parse(diagnosis.severity_flags);
  }

  return ok(res, { diagnosis, symptoms });
});

exports.getByPet = asyncHandler(async (req, res) => {
  const { pet_id } = req.params;
  const diagnoses = await DiagnosisModel.findByPet(pet_id);

  // Parse JSON fields for each
  for (const d of diagnoses) {
    if (typeof d.secondary_labels === 'string') d.secondary_labels = JSON.parse(d.secondary_labels);
    if (typeof d.recommended_actions === 'string') d.recommended_actions = JSON.parse(d.recommended_actions);
    if (typeof d.severity_flags === 'string') d.severity_flags = JSON.parse(d.severity_flags);
  }

  return ok(res, { diagnoses });
});
