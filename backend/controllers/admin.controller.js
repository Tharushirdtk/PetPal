const AdminModel = require('../models/admin.model');
const EmergencyPatternModel = require('../models/emergencyPattern.model');
const { asyncHandler, ok, fail } = require('../utils/helpers');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 'Admin access required', 403);
  }
  next();
}

exports.requireAdmin = requireAdmin;

// --- Questions ---
exports.listQuestions = asyncHandler(async (req, res) => {
  const questions = await AdminModel.listQuestions();
  return ok(res, { questions });
});

exports.createQuestion = asyncHandler(async (req, res) => {
  const { code, text, question_type, display_order, options } = req.body;
  if (!code || !text) {
    return fail(res, 'code and text are required');
  }
  const question = await AdminModel.createQuestion({ code, text, question_type, display_order, options });
  return ok(res, { question }, 201);
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await AdminModel.updateQuestion(id, req.body);
  if (!question) return fail(res, 'Question not found', 404);
  return ok(res, { question });
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await AdminModel.deactivateQuestion(id);
  return ok(res, { message: 'Question deactivated' });
});

// --- Visibility Rules ---
exports.createVisibilityRule = asyncHandler(async (req, res) => {
  const { target_type, target_id, condition_json, priority } = req.body;
  if (!target_type || !target_id || !condition_json) {
    return fail(res, 'target_type, target_id, and condition_json are required');
  }
  const rule = await AdminModel.createVisibilityRule({ target_type, target_id, condition_json, priority });
  return ok(res, { rule }, 201);
});

exports.updateVisibilityRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { condition_json, priority, active } = req.body;
  const rule = await AdminModel.updateVisibilityRule(id, { condition_json, priority, active });
  if (!rule) return fail(res, 'Rule not found', 404);
  return ok(res, { rule });
});

exports.deleteVisibilityRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await AdminModel.deleteVisibilityRule(id);
  return ok(res, { message: 'Rule deleted' });
});

// --- Contacts ---
exports.listContacts = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const result = await AdminModel.listContacts({ status, page: parseInt(page), limit: parseInt(limit) });
  return ok(res, result);
});

exports.updateContactStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['new', 'read', 'resolved'].includes(status)) {
    return fail(res, 'status must be one of: new, read, resolved');
  }
  const contact = await AdminModel.updateContactStatus(id, status);
  if (!contact) return fail(res, 'Contact not found', 404);
  return ok(res, { contact });
});

exports.getStats = asyncHandler(async (req, res) => {
  const stats = await AdminModel.getStats();
  return ok(res, { stats });
});

// --- Users ---
exports.listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const result = await AdminModel.listUsers({ page: parseInt(page), limit: parseInt(limit), search });
  return ok(res, result);
});

// --- Emergency Patterns ---
/**
 * List all emergency patterns with pagination and filtering
 */
exports.listEmergencyPatterns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', severity = '' } = req.query;
  const result = await EmergencyPatternModel.getAllPatterns({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    severity
  });
  return ok(res, result);
});

/**
 * Get a single emergency pattern by ID
 */
exports.getEmergencyPattern = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pattern = await EmergencyPatternModel.getById(id);
  if (!pattern) {
    return fail(res, 'Emergency pattern not found', 404);
  }
  return ok(res, { pattern });
});

/**
 * Create a new emergency pattern
 */
exports.createEmergencyPattern = asyncHandler(async (req, res) => {
  const { name, description, pattern_regex, warning_message, severity_level, priority } = req.body;

  // Validation
  if (!name || !pattern_regex || !warning_message) {
    return fail(res, 'name, pattern_regex, and warning_message are required');
  }

  // Test regex validity
  try {
    new RegExp(pattern_regex, 'i');
  } catch (error) {
    return fail(res, `Invalid regex pattern: ${error.message}`, 400);
  }

  const result = await EmergencyPatternModel.create({
    name,
    description,
    pattern_regex,
    warning_message,
    severity_level,
    priority,
    created_by: req.user?.id
  });

  const pattern = await EmergencyPatternModel.getById(result.id);
  return ok(res, { pattern }, 201);
});

/**
 * Update an emergency pattern
 */
exports.updateEmergencyPattern = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, pattern_regex, warning_message, severity_level, priority, is_active } = req.body;

  // Test regex validity if provided
  if (pattern_regex) {
    try {
      new RegExp(pattern_regex, 'i');
    } catch (error) {
      return fail(res, `Invalid regex pattern: ${error.message}`, 400);
    }
  }

  const pattern = await EmergencyPatternModel.update(id, {
    name,
    description,
    pattern_regex,
    warning_message,
    severity_level,
    priority,
    is_active,
    updated_by: req.user?.id
  });

  if (!pattern) {
    return fail(res, 'Emergency pattern not found', 404);
  }

  return ok(res, { pattern });
});

/**
 * Delete an emergency pattern
 */
exports.deleteEmergencyPattern = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await EmergencyPatternModel.delete(id, req.user?.id);
  return ok(res, { message: 'Emergency pattern deleted successfully' });
});

/**
 * Toggle emergency pattern active status
 */
exports.toggleEmergencyPattern = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const pattern = await EmergencyPatternModel.toggleActive(id, req.user?.id);
  return ok(res, { pattern });
});

/**
 * Test an emergency pattern against sample text
 */
exports.testEmergencyPattern = asyncHandler(async (req, res) => {
  const { pattern_regex, test_text } = req.body;

  if (!pattern_regex || !test_text) {
    return fail(res, 'pattern_regex and test_text are required');
  }

  try {
    const regex = new RegExp(pattern_regex, 'i');
    const matches = regex.test(test_text);
    const match = test_text.match(regex);

    return ok(res, {
      matches,
      match_details: match ? {
        full_match: match[0],
        index: match.index,
        groups: match.slice(1)
      } : null
    });
  } catch (error) {
    return fail(res, `Invalid regex pattern: ${error.message}`, 400);
  }
});

/**
 * Bulk update priorities (for drag & drop reordering)
 */
exports.updateEmergencyPatternPriorities = asyncHandler(async (req, res) => {
  const { priority_updates } = req.body;

  if (!Array.isArray(priority_updates)) {
    return fail(res, 'priority_updates must be an array of {id, priority} objects');
  }

  // Validate format
  for (const update of priority_updates) {
    if (!update.id || typeof update.priority !== 'number') {
      return fail(res, 'Each priority update must have id and priority (number)');
    }
  }

  await EmergencyPatternModel.updatePriorities(priority_updates, req.user?.id);
  return ok(res, { message: 'Priorities updated successfully' });
});

/**
 * Get emergency pattern statistics
 */
exports.getEmergencyPatternStats = asyncHandler(async (req, res) => {
  const stats = await EmergencyPatternModel.getStats();
  return ok(res, { stats });
});

/**
 * Get audit history for an emergency pattern
 */
exports.getEmergencyPatternAudit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;

  const audit = await EmergencyPatternModel.getAuditHistory(id, parseInt(limit));
  return ok(res, { audit });
});
