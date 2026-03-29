const PetModel = require('../models/pet.model');
const { query } = require('../config/db');
const { asyncHandler, ok, fail } = require('../utils/helpers');

/* Transform flat SQL row into nested shape the frontend expects */
const nestPet = (row) => {
  if (!row) return row;
  const { species_id, species_name, breed_id, breed_name, image_url, ...rest } = row;
  return {
    ...rest,
    species_id,
    breed_id,
    species: { id: species_id, name: species_name || null },
    breed: breed_id ? { id: breed_id, name: breed_name || null } : null,
    image_url: image_url || null,
  };
};

exports.getMyPets = asyncHandler(async (req, res) => {
  const pets = await PetModel.findByOwner(req.user.id);
  return ok(res, { pets: pets.map(nestPet) });
});

exports.createPet = asyncHandler(async (req, res) => {
  const { name, species_id } = req.body;
  if (!name || !species_id) {
    return fail(res, 'name and species_id are required');
  }

  const petId = await PetModel.create(
    { ...req.body, owner_id: req.user.id },
    req.user.id
  );

  const pet = await PetModel.findById(petId);
  return ok(res, { pet: nestPet(pet) }, 201);
});

exports.updatePet = asyncHandler(async (req, res) => {
  const pet = await PetModel.findById(req.params.id);
  if (!pet) return fail(res, 'Pet not found', 404);
  if (pet.owner_id !== req.user.id) return fail(res, 'Forbidden', 403);

  await PetModel.update(req.params.id, req.body, req.user.id);
  const updated = await PetModel.findById(req.params.id);
  return ok(res, { pet: nestPet(updated) });
});

exports.deletePet = asyncHandler(async (req, res) => {
  const pet = await PetModel.findById(req.params.id);
  if (!pet) return fail(res, 'Pet not found', 404);
  if (pet.owner_id !== req.user.id) return fail(res, 'Forbidden', 403);

  await PetModel.softDelete(req.params.id, req.user.id);
  return ok(res, { message: 'Pet deleted' });
});

exports.uploadPetImage = asyncHandler(async (req, res) => {
  const pet = await PetModel.findById(req.params.id);
  if (!pet) return fail(res, 'Pet not found', 404);
  if (pet.owner_id !== req.user.id) return fail(res, 'Forbidden', 403);
  if (!req.file) return fail(res, 'No image file provided');

  const fileUrl = `/uploads/${req.file.filename}`;

  // Create image_asset row
  const result = await query(
    `INSERT INTO image_asset (owner_user_id, pet_id, file_url, file_name, file_size, file_type, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'complete', ?)`,
    [req.user.id, pet.id, fileUrl, req.file.originalname, req.file.size, req.file.mimetype, req.user.id]
  );
  const assetId = result.insertId;

  // Update pet's primary_image_id
  await PetModel.update(req.params.id, { primary_image_id: assetId }, req.user.id);

  const updated = await PetModel.findById(req.params.id);
  return ok(res, { pet: nestPet(updated) });
});

exports.listSpecies = asyncHandler(async (_req, res) => {
  const species = await PetModel.listSpecies();
  return ok(res, { species });
});

exports.listBreeds = asyncHandler(async (req, res) => {
  const { species_id } = req.query;
  if (!species_id) return fail(res, 'species_id query param required');
  const breeds = await PetModel.listBreeds(species_id);
  return ok(res, { breeds });
});
