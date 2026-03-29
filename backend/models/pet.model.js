const { query } = require('../config/db');

const PetModel = {
  async findByOwner(ownerId) {
    return query(
      `SELECT p.*, s.name AS species_name, b.name AS breed_name,
              ia.file_url AS image_url
       FROM mast_pet p
       LEFT JOIN mast_species s ON p.species_id = s.id
       LEFT JOIN mast_breed b ON p.breed_id = b.id
       LEFT JOIN image_asset ia ON p.primary_image_id = ia.id
       WHERE p.owner_id = ? AND p.is_active = TRUE
       ORDER BY p.created_at DESC`,
      [ownerId]
    );
  },

  async findById(id) {
    const rows = await query(
      `SELECT p.*, s.name AS species_name, b.name AS breed_name,
              ia.file_url AS image_url
       FROM mast_pet p
       LEFT JOIN mast_species s ON p.species_id = s.id
       LEFT JOIN mast_breed b ON p.breed_id = b.id
       LEFT JOIN image_asset ia ON p.primary_image_id = ia.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data, userId) {
    const result = await query(
      `INSERT INTO mast_pet (owner_id, name, species_id, breed_id, dob, birth_year, birth_month, birth_day, weight, gender, medical_tags, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.owner_id, data.name, data.species_id,
        data.breed_id || null, data.dob || null,
        data.birth_year || null, data.birth_month || null, data.birth_day || null,
        data.weight || null, data.gender || 'Unknown',
        data.medical_tags ? JSON.stringify(data.medical_tags) : null,
        userId || null,
      ],
      userId
    );
    return result.insertId;
  },

  async update(id, data, userId) {
    const fields = [];
    const params = [];
    const allowed = ['name', 'species_id', 'breed_id', 'dob', 'birth_year', 'birth_month', 'birth_day', 'weight', 'gender', 'medical_tags', 'microchip_id', 'primary_image_id'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'medical_tags' ? JSON.stringify(data[key]) : data[key]);
      }
    }
    if (fields.length === 0) return;
    fields.push('updated_by = ?');
    params.push(userId || null);
    params.push(id);
    await query(`UPDATE mast_pet SET ${fields.join(', ')} WHERE id = ?`, params, userId);
  },

  async softDelete(id, userId) {
    await query('UPDATE mast_pet SET is_active = FALSE, updated_by = ? WHERE id = ?', [userId || null, id], userId);
  },

  async listSpecies() {
    return query('SELECT id, name, description FROM mast_species ORDER BY name');
  },

  async listBreeds(speciesId) {
    return query('SELECT id, species_id, name, description FROM mast_breed WHERE species_id = ? ORDER BY name', [speciesId]);
  },
};

module.exports = PetModel;
