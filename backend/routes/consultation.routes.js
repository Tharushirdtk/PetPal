const router = require('express').Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/consultation.controller');

/**
 * @swagger
 * /consultations/start:
 *   post:
 *     summary: Start a new consultation session
 *     tags: [Consultations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pet_id:
 *                 type: integer
 *                 description: ID of the pet for this consultation (optional for guests)
 *                 example: 1
 *               guest_handle:
 *                 type: string
 *                 description: Display name for guest users (auto-generated if omitted)
 *                 example: guest_abc123
 *     responses:
 *       201:
 *         description: Consultation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     consultation_id:
 *                       type: integer
 *                       example: 42
 *                     conversation_id:
 *                       type: integer
 *                       example: 55
 *       400:
 *         description: Bad request
 */
router.post('/start', optionalAuth, ctrl.startConsultation);

/**
 * @swagger
 * /consultations/history:
 *   get:
 *     summary: Get consultation history for the authenticated user
 *     tags: [Consultations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of past consultations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     consultations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/active/:petId', requireAuth, ctrl.getActiveForPet);
router.get('/history', requireAuth, ctrl.getHistory);

/**
 * @swagger
 * /consultations/{id}:
 *   get:
 *     summary: Get a specific consultation by ID with its diagnoses
 *     tags: [Consultations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The consultation ID
 *     responses:
 *       200:
 *         description: Consultation details with linked diagnoses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     consultation:
 *                       type: object
 *                     diagnoses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           primary_label:
 *                             type: string
 *                           confidence:
 *                             type: number
 *                           severity_flags:
 *                             type: object
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Consultation not found
 */
router.get('/:id', optionalAuth, ctrl.getById);

module.exports = router;
