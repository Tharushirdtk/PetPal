const AdminModel = require('../models/admin.model');
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
