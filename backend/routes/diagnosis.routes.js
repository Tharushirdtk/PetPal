const router = require('express').Router();
const { optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/diagnosis.controller');

/**
 * @swagger
 * /diagnosis/{consultation_id}:
 *   get:
 *     summary: Get diagnosis results for a specific consultation
 *     tags: [Diagnosis]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultation_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The consultation ID to retrieve diagnosis for
 *     responses:
 *       200:
 *         description: Diagnosis and symptoms retrieved (diagnosis may be null if not yet generated)
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
 *                     diagnosis:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         consultation_id:
 *                           type: integer
 *                         primary_label:
 *                           type: string
 *                           example: Dermatitis
 *                         confidence:
 *                           type: number
 *                           example: 0.85
 *                         secondary_labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                         explanation:
 *                           type: string
 *                         recommended_actions:
 *                           type: array
 *                           items:
 *                             type: string
 *                         severity_flags:
 *                           type: object
 *                     symptoms:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/:consultation_id', optionalAuth, ctrl.getByConsultation);

module.exports = router;
