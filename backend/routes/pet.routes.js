const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/pet.controller');
const diagCtrl = require('../controllers/diagnosis.controller');

// Species & breeds (public)

/**
 * @swagger
 * /pets/species:
 *   get:
 *     summary: List all available pet species
 *     tags: [Pets]
 *     responses:
 *       200:
 *         description: List of species retrieved successfully
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
 *                     species:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: Dog
 */
router.get('/species', ctrl.listSpecies);

/**
 * @swagger
 * /pets/breeds:
 *   get:
 *     summary: List breeds filtered by species
 *     tags: [Pets]
 *     parameters:
 *       - in: query
 *         name: species_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The species ID to filter breeds by
 *         example: 1
 *     responses:
 *       200:
 *         description: List of breeds retrieved successfully
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
 *                     breeds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: Labrador Retriever
 *                           species_id:
 *                             type: integer
 *                             example: 1
 *       400:
 *         description: Missing species_id query parameter
 */
router.get('/breeds', ctrl.listBreeds);

// Pet CRUD (auth required)

/**
 * @swagger
 * /pets:
 *   get:
 *     summary: Get all pets owned by the authenticated user
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's pets
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
 *                     pets:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', requireAuth, ctrl.getMyPets);

/**
 * @swagger
 * /pets:
 *   post:
 *     summary: Create a new pet for the authenticated user
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - species_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Buddy
 *               species_id:
 *                 type: integer
 *                 example: 1
 *               breed_id:
 *                 type: integer
 *                 example: 5
 *               age_years:
 *                 type: number
 *                 example: 3
 *               weight_kg:
 *                 type: number
 *                 example: 12.5
 *               gender:
 *                 type: string
 *                 example: male
 *     responses:
 *       201:
 *         description: Pet created successfully
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
 *                     pet:
 *                       type: object
 *       400:
 *         description: Missing required fields (name, species_id)
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.post('/', requireAuth, ctrl.createPet);

/**
 * @swagger
 * /pets/{id}:
 *   put:
 *     summary: Update an existing pet's information
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The pet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Buddy
 *               species_id:
 *                 type: integer
 *                 example: 1
 *               breed_id:
 *                 type: integer
 *                 example: 5
 *               age_years:
 *                 type: number
 *                 example: 4
 *               weight_kg:
 *                 type: number
 *                 example: 13.0
 *               gender:
 *                 type: string
 *                 example: male
 *     responses:
 *       200:
 *         description: Pet updated successfully
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
 *                     pet:
 *                       type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user does not own this pet
 *       404:
 *         description: Pet not found
 */
router.put('/:id', requireAuth, ctrl.updatePet);

/**
 * @swagger
 * /pets/{id}/image:
 *   post:
 *     summary: Upload a profile image for a pet
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The pet ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded and pet updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not own this pet
 *       404:
 *         description: Pet not found
 */
router.post('/:id/image', requireAuth, upload.single('image'), ctrl.uploadPetImage);

/**
 * @swagger
 * /pets/{id}:
 *   delete:
 *     summary: Soft-delete a pet
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The pet ID
 *     responses:
 *       200:
 *         description: Pet deleted successfully
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
 *                       example: Pet deleted
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user does not own this pet
 *       404:
 *         description: Pet not found
 */
router.delete('/:id', requireAuth, ctrl.deletePet);

// Pet diagnosis history

/**
 * @swagger
 * /pets/{pet_id}/history:
 *   get:
 *     summary: Get diagnosis history for a specific pet
 *     tags: [Pets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pet_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The pet ID
 *     responses:
 *       200:
 *         description: Pet diagnosis history retrieved
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
 *                     diagnoses:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/:pet_id/history', requireAuth, diagCtrl.getByPet);

module.exports = router;
