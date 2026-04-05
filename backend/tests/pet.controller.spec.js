/**
 * Pet Controller Tests
 * Scenarios from: frontend-scenarios-api-guide.md Section 4.3
 */

jest.mock('../models/pet.model');
jest.mock('../config/db');
jest.mock('../utils/helpers', () => {
  const original = jest.requireActual('../utils/helpers');
  return {
    ...original,
    asyncHandler: (fn) => fn,
  };
});

const PetModel = require('../models/pet.model');
const { query } = require('../config/db');
const petCtrl = require('../controllers/pet.controller');

function mockReq(body = {}, params = {}, query_ = {}, user = { id: 456 }, file = null) {
  return { body, params, query: query_, user, file };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// ── Get My Pets ────────────────────────────────────
describe('Pet Controller - getMyPets', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns all pets for authenticated user with nested structure', async () => {
    PetModel.findByOwner.mockResolvedValue([
      {
        id: 123, name: 'Max', owner_id: 456, species_id: 1, breed_id: 25,
        species_name: 'Dog', breed_name: 'Golden Retriever', image_url: '/uploads/max.jpg',
        age_years: 4, weight_kg: 28.5, gender: 'male', is_active: true,
      },
      {
        id: 124, name: 'Luna', owner_id: 456, species_id: 2, breed_id: 45,
        species_name: 'Cat', breed_name: 'British Shorthair', image_url: null,
        age_years: 2, weight_kg: 4.2, gender: 'female', is_active: true,
      },
    ]);

    const req = mockReq({}, {}, {}, { id: 456 });
    const res = mockRes();
    await petCtrl.getMyPets(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.pets).toHaveLength(2);
    expect(data.pets[0].species).toEqual({ id: 1, name: 'Dog' });
    expect(data.pets[0].breed).toEqual({ id: 25, name: 'Golden Retriever' });
    expect(data.pets[0].image_url).toBe('/uploads/max.jpg');
    expect(data.pets[1].image_url).toBeNull();
  });

  test('SCENARIO: User with no pets returns empty array', async () => {
    PetModel.findByOwner.mockResolvedValue([]);

    const res = mockRes();
    await petCtrl.getMyPets(mockReq({}, {}, {}, { id: 999 }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.pets).toEqual([]);
  });
});

// ── Create Pet ─────────────────────────────────────
describe('Pet Controller - createPet', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successfully create a new pet returns 201', async () => {
    PetModel.create.mockResolvedValue(125);
    PetModel.findById.mockResolvedValue({
      id: 125, name: 'Bella', owner_id: 456, species_id: 1, breed_id: 4,
      species_name: 'Dog', breed_name: 'French Bulldog', image_url: null,
      age_years: 3, weight_kg: 8.2, gender: 'female', is_active: true,
    });

    const body = {
      name: 'Bella', species_id: 1, breed_id: 4,
      age_years: 3, weight_kg: 8.2, gender: 'female',
      medical_tags: ['vaccinated', 'spayed'],
    };
    const req = mockReq(body, {}, {}, { id: 456 });
    const res = mockRes();
    await petCtrl.createPet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    const data = res.json.mock.calls[0][0].data;
    expect(data.pet.name).toBe('Bella');
    expect(data.pet.species).toEqual({ id: 1, name: 'Dog' });
    expect(PetModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Bella', species_id: 1, owner_id: 456 }),
      456
    );
  });

  test('SCENARIO: Missing name returns 400', async () => {
    const res = mockRes();
    await petCtrl.createPet(mockReq({ species_id: 1 }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'name and species_id are required' })
    );
  });

  test('SCENARIO: Missing species_id returns 400', async () => {
    const res = mockRes();
    await petCtrl.createPet(mockReq({ name: 'Max' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'name and species_id are required' })
    );
  });
});

// ── Update Pet ─────────────────────────────────────
describe('Pet Controller - updatePet', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successfully update pet returns 200', async () => {
    PetModel.findById
      .mockResolvedValueOnce({ id: 125, owner_id: 456 })
      .mockResolvedValueOnce({
        id: 125, name: 'Bella Rose', owner_id: 456, species_id: 1, breed_id: 4,
        species_name: 'Dog', breed_name: 'French Bulldog', image_url: null,
      });
    PetModel.update.mockResolvedValue(true);

    const req = mockReq({ name: 'Bella Rose', age_years: 4 }, { id: '125' }, {}, { id: 456 });
    const res = mockRes();
    await petCtrl.updatePet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(PetModel.update).toHaveBeenCalledWith('125', expect.any(Object), 456);
  });

  test('SCENARIO: Pet not found returns 404', async () => {
    PetModel.findById.mockResolvedValue(null);

    const res = mockRes();
    await petCtrl.updatePet(mockReq({}, { id: '999' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Pet not found' })
    );
  });

  test('SCENARIO: Unauthorized pet access returns 403', async () => {
    PetModel.findById.mockResolvedValue({ id: 123, owner_id: 999 });

    const req = mockReq({}, { id: '123' }, {}, { id: 456 });
    const res = mockRes();
    await petCtrl.updatePet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Forbidden' })
    );
  });
});

// ── Delete Pet ─────────────────────────────────────
describe('Pet Controller - deletePet', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successfully soft-delete pet returns 200', async () => {
    PetModel.findById.mockResolvedValue({ id: 125, owner_id: 456 });
    PetModel.softDelete.mockResolvedValue(true);

    const req = mockReq({}, { id: '125' }, {}, { id: 456 });
    const res = mockRes();
    await petCtrl.deletePet(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { message: 'Pet deleted' } })
    );
    expect(PetModel.softDelete).toHaveBeenCalledWith('125', 456);
  });

  test('SCENARIO: Delete nonexistent pet returns 404', async () => {
    PetModel.findById.mockResolvedValue(null);

    const res = mockRes();
    await petCtrl.deletePet(mockReq({}, { id: '999' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('SCENARIO: Delete pet owned by another user returns 403', async () => {
    PetModel.findById.mockResolvedValue({ id: 123, owner_id: 999 });

    const res = mockRes();
    await petCtrl.deletePet(mockReq({}, { id: '123' }, {}, { id: 456 }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── Upload Pet Image ───────────────────────────────
describe('Pet Controller - uploadPetImage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Successfully upload pet image returns 200', async () => {
    PetModel.findById
      .mockResolvedValueOnce({ id: 125, owner_id: 456 })
      .mockResolvedValueOnce({
        id: 125, name: 'Bella', owner_id: 456, species_id: 1, breed_id: 4,
        species_name: 'Dog', breed_name: 'French Bulldog', image_url: '/uploads/abc.jpg',
      });
    PetModel.update.mockResolvedValue(true);
    query.mockResolvedValue({ insertId: 890 });

    const file = { filename: 'abc.jpg', originalname: 'bella.jpg', size: 1024, mimetype: 'image/jpeg' };
    const req = mockReq({}, { id: '125' }, {}, { id: 456 }, file);
    req.file = file;
    const res = mockRes();
    await petCtrl.uploadPetImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO image_asset'),
      expect.any(Array)
    );
    expect(PetModel.update).toHaveBeenCalledWith('125', { primary_image_id: 890 }, 456);
  });

  test('SCENARIO: No image file provided returns 400', async () => {
    PetModel.findById.mockResolvedValue({ id: 125, owner_id: 456 });

    const req = mockReq({}, { id: '125' }, {}, { id: 456 });
    req.file = null;
    const res = mockRes();
    await petCtrl.uploadPetImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'No image file provided' })
    );
  });

  test('SCENARIO: Upload image for nonexistent pet returns 404', async () => {
    PetModel.findById.mockResolvedValue(null);

    const req = mockReq({}, { id: '999' }, {}, { id: 456 });
    req.file = { filename: 'a.jpg' };
    const res = mockRes();
    await petCtrl.uploadPetImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('SCENARIO: Upload image for another users pet returns 403', async () => {
    PetModel.findById.mockResolvedValue({ id: 123, owner_id: 999 });

    const req = mockReq({}, { id: '123' }, {}, { id: 456 });
    req.file = { filename: 'a.jpg' };
    const res = mockRes();
    await petCtrl.uploadPetImage(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── List Species ───────────────────────────────────
describe('Pet Controller - listSpecies', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns all active species', async () => {
    PetModel.listSpecies.mockResolvedValue([
      { id: 1, name: 'Dog', description: 'Canis familiaris' },
      { id: 2, name: 'Cat', description: 'Felis catus' },
    ]);

    const res = mockRes();
    await petCtrl.listSpecies({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.species).toHaveLength(2);
  });
});

// ── List Breeds ────────────────────────────────────
describe('Pet Controller - listBreeds', () => {
  beforeEach(() => jest.clearAllMocks());

  test('SCENARIO: Returns breeds for given species_id', async () => {
    PetModel.listBreeds.mockResolvedValue([
      { id: 1, name: 'Golden Retriever', species_id: 1 },
      { id: 2, name: 'Labrador Retriever', species_id: 1 },
    ]);

    const res = mockRes();
    await petCtrl.listBreeds(mockReq({}, {}, { species_id: '1' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(PetModel.listBreeds).toHaveBeenCalledWith('1');
  });

  test('SCENARIO: Missing species_id query param returns 400', async () => {
    const res = mockRes();
    await petCtrl.listBreeds(mockReq({}, {}, {}), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'species_id query param required' })
    );
  });
});
