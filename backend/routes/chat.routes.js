const router = require('express').Router();
const { optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/chat.controller');

/**
 * @swagger
 * /chat/message:
 *   post:
 *     summary: Send a chat message and receive an AI-generated response
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversation_id
 *               - message
 *             properties:
 *               conversation_id:
 *                 type: integer
 *                 description: ID of the conversation to send the message in
 *                 example: 55
 *               message:
 *                 type: string
 *                 description: The user's chat message
 *                 example: My dog has been scratching a lot lately
 *               consultation_id:
 *                 type: integer
 *                 description: ID of the associated consultation
 *                 example: 42
 *     responses:
 *       200:
 *         description: AI response returned successfully
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
 *                     reply:
 *                       type: string
 *                       description: The AI-generated response
 *                     is_final:
 *                       type: boolean
 *                       description: Whether a diagnosis was reached
 *                       example: false
 *                     is_emergency:
 *                       type: boolean
 *                       description: Whether an emergency was detected
 *                       example: false
 *                     diagnosis_id:
 *                       type: integer
 *                       nullable: true
 *                       description: ID of the created diagnosis if is_final is true
 *                     diagnosis_data:
 *                       type: object
 *                       nullable: true
 *                       description: Full diagnosis data if is_final is true
 *       400:
 *         description: Missing conversation_id or message
 */
router.post('/message', optionalAuth, ctrl.sendMessage);

/**
 * @swagger
 * /chat/history/{consultation_id}:
 *   get:
 *     summary: Get chat message history for a consultation
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultation_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The consultation ID to retrieve chat history for
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           sender_type:
 *                             type: string
 *                             enum: [user, ai]
 *                           content:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           json_data:
 *                             type: object
 *                             nullable: true
 *                     conversation_id:
 *                       type: integer
 *                       nullable: true
 */
router.get('/history/:consultation_id', optionalAuth, ctrl.getHistory);

module.exports = router;
