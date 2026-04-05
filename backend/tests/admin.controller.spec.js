/**
 * Admin Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.7
 */

jest.mock('../models/admin.model');
jest.mock('../models/emergencyPattern.model');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const AdminModel = require('../models/admin.model');
const EmergencyPatternModel = require('../models/emergencyPattern.model');
const adminCtrl = require('../controllers/admin.controller');

function mockReq(body = {}, params = {}, query_ = {}, user = { id: 1, role: 'admin' }) {
  return { body, params, query: query_, user };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── requireAdmin middleware ─────────────────────────
describe('Admin Controller - requireAdmin', () => {
  test('SCENARIO: Admin user passes through', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();
    adminCtrl.requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('SCENARIO: Non-admin user returns 403', () => {
    const req = { user: { id: 2, role: 'user' } };
    const res = mockRes();
    const next = jest.fn();
    adminCtrl.requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Admin access required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('SCENARIO: Missing user object returns 403', () => {
    const req = { user: null };
    const res = mockRes();
    const next = jest.fn();
    adminCtrl.requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── Questions CRUD ─────────────────────────────────
describe('Admin Controller - Questions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: List questions returns all questions', async () => {
    AdminModel.listQuestions.mockResolvedValue([{ id: 1, text: 'Q1' }]);
    const res = mockRes();
    await adminCtrl.listQuestions(mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.questions).toHaveLength(1);
  });

  test('SCENARIO: Create question with valid data returns 201', async () => {
    AdminModel.createQuestion.mockResolvedValue({ id: 10, code: 'q_new', text: 'New question' });
    const req = mockReq({ code: 'q_new', text: 'New question', question_type: 'single_select' });
    const res = mockRes();
    await adminCtrl.createQuestion(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('SCENARIO: Create question missing code or text returns 400', async () => {
    const cases = [{ text: 'Q' }, { code: 'q1' }, {}];
    for (const body of cases) {
      const res = mockRes();
      await adminCtrl.createQuestion(mockReq(body), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'code and text are required' })
      );
    }
  });

  test('SCENARIO: Update nonexistent question returns 404', async () => {
    AdminModel.updateQuestion.mockResolvedValue(null);
    const res = mockRes();
    await adminCtrl.updateQuestion(mockReq({ text: 'Updated' }, { id: '999' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('SCENARIO: Delete question deactivates it', async () => {
    AdminModel.deactivateQuestion.mockResolvedValue(true);
    const res = mockRes();
    await adminCtrl.deleteQuestion(mockReq({}, { id: '5' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { message: 'Question deactivated' } })
    );
  });
});

// ── Visibility Rules ───────────────────────────────
describe('Admin Controller - Visibility Rules', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Create rule with valid data returns 201', async () => {
    AdminModel.createVisibilityRule.mockResolvedValue({ id: 1 });
    const req = mockReq({
      target_type: 'question',
      target_id: 5,
      condition_json: '{"==":[{"var":"pet.species"},"dog"]}',
    });
    const res = mockRes();
    await adminCtrl.createVisibilityRule(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('SCENARIO: Create rule missing required fields returns 400', async () => {
    const res = mockRes();
    await adminCtrl.createVisibilityRule(mockReq({ target_type: 'question' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'target_type, target_id, and condition_json are required',
      })
    );
  });

  test('SCENARIO: Update nonexistent rule returns 404', async () => {
    AdminModel.updateVisibilityRule.mockResolvedValue(null);
    const res = mockRes();
    await adminCtrl.updateVisibilityRule(mockReq({}, { id: '999' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('SCENARIO: Delete rule returns success', async () => {
    AdminModel.deleteVisibilityRule.mockResolvedValue(true);
    const res = mockRes();
    await adminCtrl.deleteVisibilityRule(mockReq({}, { id: '1' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { message: 'Rule deleted' } })
    );
  });
});

// ── Contacts Management ────────────────────────────
describe('Admin Controller - Contacts', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: List contacts with pagination', async () => {
    AdminModel.listContacts.mockResolvedValue({ contacts: [], total: 0 });
    const res = mockRes();
    await adminCtrl.listContacts(mockReq({}, {}, { page: '1', limit: '10', status: 'new' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(AdminModel.listContacts).toHaveBeenCalledWith({ status: 'new', page: 1, limit: 10 });
  });

  test('SCENARIO: Update contact status to "read"', async () => {
    AdminModel.updateContactStatus.mockResolvedValue({ id: 1, status: 'read' });
    const res = mockRes();
    await adminCtrl.updateContactStatus(mockReq({ status: 'read' }, { id: '1' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('SCENARIO: Update contact with invalid status returns 400', async () => {
    const invalidStatuses = ['pending', 'closed', 'spam', '', null, undefined];
    for (const status of invalidStatuses) {
      const res = mockRes();
      await adminCtrl.updateContactStatus(mockReq({ status }, { id: '1' }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'status must be one of: new, read, resolved',
        })
      );
    }
  });

  test('SCENARIO: Update nonexistent contact returns 404', async () => {
    AdminModel.updateContactStatus.mockResolvedValue(null);
    const res = mockRes();
    await adminCtrl.updateContactStatus(mockReq({ status: 'read' }, { id: '999' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── Stats ──────────────────────────────────────────
describe('Admin Controller - Stats', () => {
  test('SCENARIO: Returns dashboard statistics', async () => {
    AdminModel.getStats.mockResolvedValue({
      questions: 10, rules: 5, contacts: 20, consultations: 100,
    });
    const res = mockRes();
    await adminCtrl.getStats(mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.stats).toBeDefined();
  });
});

// ── Users ──────────────────────────────────────────
describe('Admin Controller - Users', () => {
  test('SCENARIO: List users with search filter', async () => {
    AdminModel.listUsers.mockResolvedValue({ users: [], total: 0 });
    const res = mockRes();
    await adminCtrl.listUsers(mockReq({}, {}, { page: '1', limit: '20', search: 'sarah' }), res, jest.fn());
    expect(AdminModel.listUsers).toHaveBeenCalledWith({ page: 1, limit: 20, search: 'sarah' });
  });
});

// ── Emergency Patterns ─────────────────────────────
describe('Admin Controller - Emergency Patterns', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Create emergency pattern with valid regex returns 201', async () => {
    EmergencyPatternModel.create.mockResolvedValue({ id: 1 });
    EmergencyPatternModel.getById.mockResolvedValue({
      id: 1, name: 'Seizure', pattern_regex: 'seizure|convulsion',
      warning_message: 'Seek immediate vet care', severity_level: 'critical',
    });

    const req = mockReq({
      name: 'Seizure',
      pattern_regex: 'seizure|convulsion',
      warning_message: 'Seek immediate vet care',
      severity_level: 'critical',
      priority: 1,
    });
    const res = mockRes();
    await adminCtrl.createEmergencyPattern(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('SCENARIO: Create emergency pattern with invalid regex returns 400', async () => {
    const req = mockReq({
      name: 'Bad', pattern_regex: '[invalid', warning_message: 'test',
    });
    const res = mockRes();
    await adminCtrl.createEmergencyPattern(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toContain('Invalid regex pattern');
  });

  test('SCENARIO: Create emergency pattern missing required fields returns 400', async () => {
    const cases = [
      { name: 'Test' },
      { name: 'Test', pattern_regex: 'test' },
      { pattern_regex: 'test', warning_message: 'msg' },
    ];
    for (const body of cases) {
      const res = mockRes();
      await adminCtrl.createEmergencyPattern(mockReq(body), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    }
  });

  test('SCENARIO: Test emergency pattern with matching text', async () => {
    const req = mockReq({
      pattern_regex: 'seizure|collapse',
      test_text: 'My dog had a seizure last night',
    });
    const res = mockRes();
    await adminCtrl.testEmergencyPattern(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.matches).toBe(true);
    expect(data.match_details.full_match).toBe('seizure');
  });

  test('SCENARIO: Test emergency pattern with non-matching text', async () => {
    const req = mockReq({
      pattern_regex: 'seizure|collapse',
      test_text: 'My dog is happy and healthy',
    });
    const res = mockRes();
    await adminCtrl.testEmergencyPattern(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.matches).toBe(false);
  });

  test('SCENARIO: Test pattern missing fields returns 400', async () => {
    const res = mockRes();
    await adminCtrl.testEmergencyPattern(mockReq({ pattern_regex: 'test' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('SCENARIO: Update emergency pattern priorities with valid data', async () => {
    EmergencyPatternModel.updatePriorities.mockResolvedValue(true);
    const req = mockReq({
      priority_updates: [{ id: 1, priority: 1 }, { id: 2, priority: 2 }],
    });
    const res = mockRes();
    await adminCtrl.updateEmergencyPatternPriorities(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('SCENARIO: Update priorities with invalid format returns 400', async () => {
    const res = mockRes();
    await adminCtrl.updateEmergencyPatternPriorities(
      mockReq({ priority_updates: 'not-array' }),
      res, jest.fn()
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('SCENARIO: Update priorities with invalid items returns 400', async () => {
    const res = mockRes();
    await adminCtrl.updateEmergencyPatternPriorities(
      mockReq({ priority_updates: [{ id: 1 }] }),
      res, jest.fn()
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Each priority update must have id and priority (number)',
      })
    );
  });

  test('SCENARIO: Get emergency pattern not found returns 404', async () => {
    EmergencyPatternModel.getById.mockResolvedValue(null);
    const res = mockRes();
    await adminCtrl.getEmergencyPattern(mockReq({}, { id: '999' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('SCENARIO: Delete emergency pattern returns success', async () => {
    EmergencyPatternModel.delete.mockResolvedValue(true);
    const res = mockRes();
    await adminCtrl.deleteEmergencyPattern(mockReq({}, { id: '1' }, {}, { id: 1, role: 'admin' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: 'Emergency pattern deleted successfully' },
      })
    );
  });

  test('SCENARIO: Toggle emergency pattern active status', async () => {
    EmergencyPatternModel.toggleActive.mockResolvedValue({ id: 1, is_active: false });
    const res = mockRes();
    await adminCtrl.toggleEmergencyPattern(mockReq({}, { id: '1' }, {}, { id: 1, role: 'admin' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('SCENARIO: Get emergency pattern stats', async () => {
    EmergencyPatternModel.getStats.mockResolvedValue({ total: 10, active: 8 });
    const res = mockRes();
    await adminCtrl.getEmergencyPatternStats(mockReq(), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.stats).toBeDefined();
  });

  test('SCENARIO: Get audit history for pattern', async () => {
    EmergencyPatternModel.getAuditHistory.mockResolvedValue([
      { id: 1, action: 'created', changed_at: '2026-04-01' },
    ]);
    const res = mockRes();
    await adminCtrl.getEmergencyPatternAudit(mockReq({}, { id: '1' }, { limit: '10' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.audit).toHaveLength(1);
  });
});
