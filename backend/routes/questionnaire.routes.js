const router = require('express').Router();
const { optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/questionnaire.controller');

/**
 * @swagger
 * /questionnaire/active:
 *   get:
 *     summary: Get the currently active questionnaire with all questions and options
 *     tags: [Questionnaire]
 *     responses:
 *       200:
 *         description: Active questionnaire with questions retrieved
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
 *                     questionnaire:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         is_active:
 *                           type: boolean
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: No active questionnaire found
 */
router.get('/active', ctrl.getActive);

/**
 * @swagger
 * /questionnaire/response:
 *   post:
 *     summary: Submit answers to a questionnaire
 *     tags: [Questionnaire]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionnaire_id
 *               - answers
 *             properties:
 *               questionnaire_id:
 *                 type: integer
 *                 description: ID of the questionnaire being answered
 *                 example: 1
 *               consultation_id:
 *                 type: integer
 *                 description: ID of the associated consultation
 *                 example: 42
 *               pet_id:
 *                 type: integer
 *                 description: ID of the pet this response is about
 *                 example: 1
 *               is_new_pet:
 *                 type: boolean
 *                 description: Whether this is a newly added pet
 *                 example: false
 *               answers:
 *                 type: array
 *                 description: Array of answer objects
 *                 items:
 *                   type: object
 *                   required:
 *                     - question_id
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                       example: 1
 *                     selected_option_id:
 *                       type: integer
 *                       example: 3
 *                     selected_option_value_key:
 *                       type: string
 *                       example: itching
 *                     selected_option_value_keys:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["itching", "redness"]
 *                     free_text:
 *                       type: string
 *                       example: The rash appeared two days ago
 *                     answer_number:
 *                       type: number
 *                       example: 3
 *               context:
 *                 type: object
 *                 description: Context for rule evaluation
 *                 properties:
 *                   pet:
 *                     type: object
 *                   image_analysis:
 *                     type: object
 *     responses:
 *       201:
 *         description: Questionnaire response submitted successfully
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
 *                     response_id:
 *                       type: integer
 *                       example: 10
 *                     structured_answers:
 *                       type: object
 *                     visible_question_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       nullable: true
 *       400:
 *         description: Missing questionnaire_id or answers array
 */
router.post('/response', optionalAuth, ctrl.submitResponse);

/**
 * @swagger
 * /questionnaire/context:
 *   post:
 *     summary: Save structured questionnaire answers directly to llm_context
 *     tags: [Questionnaire]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consultation_id
 *               - answers
 *             properties:
 *               consultation_id:
 *                 type: integer
 *               answers:
 *                 type: object
 *     responses:
 *       200:
 *         description: Context updated
 */
router.post('/context', optionalAuth, ctrl.saveContext);

module.exports = router;
