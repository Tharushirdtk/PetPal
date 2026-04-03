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

module.exports = router;
