import { useState, useEffect, useRef } from 'react';
import { getSpecies, getBreeds, uploadPetImage } from '../../api/pets';
import { useLang } from '../../i18n/LanguageContext';
import ErrorAlert from '../ErrorAlert';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');

export default function EditPetForm({ pet, onSubmit, onClose, loading: externalLoading }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: pet.name || '',
    species_id: pet.species?.id || pet.species_id || '',
    breed_id: pet.breed?.id || pet.breed_id || '',
    gender: pet.gender || 'Unknown',
    weight: pet.weight || '',
    birth_year: pet.birth_year || '',
    birth_month: pet.birth_month || '',
    birth_day: pet.birth_day || '',
    microchip_id: pet.microchip_id || '',
  });
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    pet.image_url ? `${SERVER_BASE}${pet.image_url}` : null
  );
  const fileRef = useRef(null);

  useEffect(() => {
    getSpecies().then(res => setSpecies(res.data.species || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.species_id) {
      getBreeds(form.species_id).then(res => setBreeds(res.data.breeds || [])).catch(() => {});
    } else {
      setBreeds([]);
    }
  }, [form.species_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = { ...form };
      data.species_id = parseInt(data.species_id);
      if (data.breed_id) data.breed_id = parseInt(data.breed_id);
      else delete data.breed_id;
      if (data.weight) data.weight = parseFloat(data.weight);
      else delete data.weight;
      if (data.birth_year) data.birth_year = parseInt(data.birth_year);
      else delete data.birth_year;
      if (data.birth_month) data.birth_month = parseInt(data.birth_month);
      else delete data.birth_month;
      if (data.birth_day) data.birth_day = parseInt(data.birth_day);
      else delete data.birth_day;
      if (!data.microchip_id) delete data.microchip_id;

      await onSubmit(pet.id, data);

      // Upload image after saving pet data
      if (imageFile) {
        await uploadPetImage(pet.id, imageFile);
      }
    } catch (err) {
      setError(err.error || t('form_error_update_pet_failed'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{t('form_edit_pet_title')} {pet.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl cursor-pointer">&times;</button>
        </div>

        <ErrorAlert message={error} onClose={() => setError(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-2">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-[#7C3AED] transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Pet" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">📷</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-[#7C3AED] font-medium cursor-pointer"
            >
              {t('form_pet_change_photo')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_name')} *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_species')} *</label>
            <select name="species_id" value={form.species_id} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="">{t('form_pet_select_species')}</option>
              {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {breeds.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_breed')}</label>
              <select name="breed_id" value={form.breed_id} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">{t('form_pet_select_breed')}</option>
                {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_gender')}</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="Unknown">{t('form_pet_gender_unknown')}</option>
              <option value="Male">{t('form_pet_gender_male')}</option>
              <option value="Female">{t('form_pet_gender_female')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_weight')}</label>
            <input name="weight" type="number" step="0.1" min="0" value={form.weight} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_birth_year')}</label>
              <input name="birth_year" type="number" min="1990" max="2026" value={form.birth_year} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_birth_month')}</label>
              <input name="birth_month" type="number" min="1" max="12" value={form.birth_month} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_birth_day')}</label>
              <input name="birth_day" type="number" min="1" max="31" value={form.birth_day} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('form_pet_microchip')}</label>
            <input name="microchip_id" value={form.microchip_id} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer">
              {t('form_button_cancel')}
            </button>
            <button type="submit" disabled={externalLoading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 cursor-pointer">
              {externalLoading ? t('form_button_saving') : t('form_button_save_changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
