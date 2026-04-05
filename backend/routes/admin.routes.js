const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(requireAuth, ctrl.requireAdmin);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         questions:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                             active: { type: integer }
 *                             inactive: { type: integer }
 *                         rules:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                         contacts:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                             new: { type: integer }
 *                             read: { type: integer }
 *                             resolved: { type: integer }
 *                         consultations:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                         diagnoses:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *                         users:
 *                           type: object
 *                           properties:
 *                             total: { type: integer }
 *       403:
 *         description: Admin access required
 */
router.get('/stats', ctrl.getStats);

/**
 * @swagger
 * /admin/questions:
 *   get:
 *     summary: List all questions with options and rules
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of questions
 *       403:
 *         description: Admin access required
 */
router.get('/questions', ctrl.listQuestions);

/**
 * @swagger
 * /admin/questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, text]
 *             properties:
 *               code: { type: string, example: "q_new" }
 *               text: { type: string, example: "What symptoms do you see?" }
 *               question_type: { type: string, enum: [single, multi, text, number, date, boolean, image], example: "single" }
 *               display_order: { type: integer, example: 10 }
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     value_key: { type: string }
 *                     label: { type: string }
 *     responses:
 *       201:
 *         description: Question created
 */
router.post('/questions', ctrl.createQuestion);

/**
 * @swagger
 * /admin/questions/{id}:
 *   put:
 *     summary: Update a question
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *               question_type: { type: string }
 *               display_order: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Question updated
 */
router.put('/questions/:id', ctrl.updateQuestion);

/**
 * @swagger
 * /admin/questions/{id}:
 *   delete:
 *     summary: Deactivate a question (soft delete)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Question deactivated
 */
router.delete('/questions/:id', ctrl.deleteQuestion);

/**
 * @swagger
 * /admin/visibility-rules:
 *   post:
 *     summary: Create a visibility rule
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [target_type, target_id, condition_json]
 *             properties:
 *               target_type: { type: string, enum: [question, option] }
 *               target_id: { type: integer }
 *               condition_json: { type: object }
 *               priority: { type: integer, example: 100 }
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/visibility-rules', ctrl.createVisibilityRule);

/**
 * @swagger
 * /admin/visibility-rules/{id}:
 *   put:
 *     summary: Update a visibility rule (condition, priority, or active status)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition_json: { type: object }
 *               priority: { type: integer }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Rule updated
 *       404:
 *         description: Rule not found
 */
router.put('/visibility-rules/:id', ctrl.updateVisibilityRule);

/**
 * @swagger
 * /admin/visibility-rules/{id}:
 *   delete:
 *     summary: Delete a visibility rule
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Rule deleted
 */
router.delete('/visibility-rules/:id', ctrl.deleteVisibilityRule);

/**
 * @swagger
 * /admin/contacts:
 *   get:
 *     summary: List contact messages
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [new, read, resolved] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of contacts
 */
router.get('/contacts', ctrl.listContacts);

/**
 * @swagger
 * /admin/contacts/{id}:
 *   put:
 *     summary: Update contact message status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [new, read, resolved] }
 *     responses:
 *       200:
 *         description: Contact status updated
 */
router.put('/contacts/:id', ctrl.updateContactStatus);

router.get('/users', ctrl.listUsers);

// --- Emergency Patterns Routes ---

/**
 * @swagger
 * /admin/emergency-patterns:
 *   get:
 *     summary: List emergency detection patterns
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in name, description, or warning message
 *       - in: query
 *         name: severity
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *     responses:
 *       200:
 *         description: Paginated list of emergency patterns
 */
router.get('/emergency-patterns', ctrl.listEmergencyPatterns);

/**
 * @swagger
 * /admin/emergency-patterns/stats:
 *   get:
 *     summary: Get emergency patterns statistics
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency patterns statistics
 */
router.get('/emergency-patterns/stats', ctrl.getEmergencyPatternStats);

/**
 * @swagger
 * /admin/emergency-patterns/test:
 *   post:
 *     summary: Test a regex pattern against text
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pattern_regex, test_text]
 *             properties:
 *               pattern_regex: { type: string }
 *               test_text: { type: string }
 *     responses:
 *       200:
 *         description: Test results
 */
router.post('/emergency-patterns/test', ctrl.testEmergencyPattern);

/**
 * @swagger
 * /admin/emergency-patterns/priorities:
 *   put:
 *     summary: Bulk update pattern priorities
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [priority_updates]
 *             properties:
 *               priority_updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     priority: { type: integer }
 *     responses:
 *       200:
 *         description: Priorities updated successfully
 */
router.put('/emergency-patterns/priorities', ctrl.updateEmergencyPatternPriorities);

/**
 * @swagger
 * /admin/emergency-patterns:
 *   post:
 *     summary: Create a new emergency pattern
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, pattern_regex, warning_message]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               pattern_regex: { type: string }
 *               warning_message: { type: string }
 *               severity_level: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL], default: HIGH }
 *               priority: { type: integer, default: 10 }
 *     responses:
 *       201:
 *         description: Emergency pattern created
 */
router.post('/emergency-patterns', ctrl.createEmergencyPattern);

/**
 * @swagger
 * /admin/emergency-patterns/{id}:
 *   get:
 *     summary: Get emergency pattern by ID
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Emergency pattern details
 *       404:
 *         description: Pattern not found
 */
router.get('/emergency-patterns/:id', ctrl.getEmergencyPattern);

/**
 * @swagger
 * /admin/emergency-patterns/{id}:
 *   put:
 *     summary: Update emergency pattern
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               pattern_regex: { type: string }
 *               warning_message: { type: string }
 *               severity_level: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *               priority: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Emergency pattern updated
 *       404:
 *         description: Pattern not found
 */
router.put('/emergency-patterns/:id', ctrl.updateEmergencyPattern);

/**
 * @swagger
 * /admin/emergency-patterns/{id}/toggle:
 *   post:
 *     summary: Toggle emergency pattern active status
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Pattern status toggled
 */
router.post('/emergency-patterns/:id/toggle', ctrl.toggleEmergencyPattern);

/**
 * @swagger
 * /admin/emergency-patterns/{id}:
 *   delete:
 *     summary: Delete emergency pattern
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Pattern deleted successfully
 */
router.delete('/emergency-patterns/:id', ctrl.deleteEmergencyPattern);

/**
 * @swagger
 * /admin/emergency-patterns/{id}/audit:
 *   get:
 *     summary: Get emergency pattern audit history
 *     tags: [Admin - Emergency Patterns]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Audit history
 */
router.get('/emergency-patterns/:id/audit', ctrl.getEmergencyPatternAudit);

module.exports = router;
