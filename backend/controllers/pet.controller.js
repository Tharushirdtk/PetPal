const PetModel = require('../models/pet.model');
const { asyncHandler, ok, fail } = require('../utils/helpers');

exports.getMyPets = asyncHandler(async (req, res) => {
  const pets = await PetModel.findByOwner(req.user.id);
  return ok(res, { pets });
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
  return ok(res, { pet }, 201);
});

exports.updatePet = asyncHandler(async (req, res) => {
  const pet = await PetModel.findById(req.params.id);
  if (!pet) return fail(res, 'Pet not found', 404);
  if (pet.owner_id !== req.user.id) return fail(res, 'Forbidden', 403);

  await PetModel.update(req.params.id, req.body, req.user.id);
  const updated = await PetModel.findById(req.params.id);
  return ok(res, { pet: updated });
});

exports.deletePet = asyncHandler(async (req, res) => {
  const pet = await PetModel.findById(req.params.id);
  if (!pet) return fail(res, 'Pet not found', 404);
  if (pet.owner_id !== req.user.id) return fail(res, 'Forbidden', 403);

  await PetModel.softDelete(req.params.id, req.user.id);
  return ok(res, { message: 'Pet deleted' });
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
