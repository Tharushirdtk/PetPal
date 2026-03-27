const router = require('express').Router();
const { optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/image.controller');

/**
 * @swagger
 * /images/upload:
 *   post:
 *     summary: Upload a pet image for AI analysis
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The pet image file to upload
 *               consultation_id:
 *                 type: integer
 *                 description: ID of the associated consultation
 *                 example: 42
 *               pet_id:
 *                 type: integer
 *                 description: ID of the pet in the image
 *                 example: 1
 *     responses:
 *       201:
 *         description: Image uploaded and analyzed successfully
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
 *                     image_asset_id:
 *                       type: integer
 *                       example: 10
 *                     file_url:
 *                       type: string
 *                       example: /uploads/image-12345.jpg
 *                     status:
 *                       type: string
 *                       enum: [complete, error]
 *                       example: complete
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         prediction_text:
 *                           type: string
 *                           example: Dermatitis
 *                         top_label:
 *                           type: string
 *                           example: dermatitis
 *                         confidence_percent:
 *                           type: number
 *                           example: 87.5
 *       400:
 *         description: No image file uploaded
 */
router.post('/upload', optionalAuth, upload.single('image'), ctrl.uploadImage);

/**
 * @swagger
 * /images/{id}/status:
 *   get:
 *     summary: Get the processing status and analysis results for an uploaded image
 *     tags: [Images]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The image asset ID
 *     responses:
 *       200:
 *         description: Image status and analysis retrieved
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
 *                     image:
 *                       type: object
 *                       description: The image asset record
 *                     analysis:
 *                       type: object
 *                       nullable: true
 *                       description: Analysis results (null if not yet complete)
 *       404:
 *         description: Image not found
 */
router.get('/:id/status', optionalAuth, ctrl.getStatus);

module.exports = router;
