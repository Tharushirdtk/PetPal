const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               heading:
 *                 type: string
 *                 description: Subject or heading of the message
 *                 example: Feature Request
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email address
 *                 example: user@example.com
 *               message:
 *                 type: string
 *                 description: The contact message body
 *                 example: I would like to suggest a new feature for pet tracking.
 *     responses:
 *       201:
 *         description: Contact message submitted successfully
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
 *                     message:
 *                       type: string
 *                       example: Contact message submitted successfully
 *       400:
 *         description: Missing required message field
 */
router.post('/', ctrl.submitContact);

module.exports = router;
