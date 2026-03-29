import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Camera, ChevronRight, Calendar, Activity, FileText, Pencil, Trash2, Stethoscope } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePets } from '../hooks/usePets';
import { uploadPetImage } from '../api/pets';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import AddPetForm from '../components/forms/AddPetForm';
import EditPetForm from '../components/forms/EditPetForm';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');

const speciesEmoji = (speciesName) => {
  const map = {
    dog: '\uD83D\uDC15', cat: '\uD83D\uDC08', bird: '\uD83D\uDC26', fish: '\uD83D\uDC1F',
    rabbit: '\uD83D\uDC07', hamster: '\uD83D\uDC39', turtle: '\uD83D\uDC22',
    snake: '\uD83D\uDC0D', horse: '\uD83D\uDC34',
  };
  return map[(speciesName || '').toLowerCase()] || '\uD83D\uDC3E';
};

const speciesGradient = (speciesName) => {
  const map = {
    dog: 'from-amber-100 to-amber-50',
    cat: 'from-purple-100 to-purple-50',
    bird: 'from-sky-100 to-sky-50',
    fish: 'from-blue-100 to-blue-50',
    rabbit: 'from-pink-100 to-pink-50',
    hamster: 'from-orange-100 to-orange-50',
    turtle: 'from-green-100 to-green-50',
    snake: 'from-lime-100 to-lime-50',
    horse: 'from-yellow-100 to-yellow-50',
  };
  return map[(speciesName || '').toLowerCase()] || 'from-gray-100 to-gray-50';
};

const getAge = (birthYear) => {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
};

const PetDashboard = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const { pets, loading, error, refetch, addPet, editPet, removePet } = usePets();

  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [deletingPet, setDeletingPet] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const imageTargetPetRef = useRef(null);

  const handleAddPet = async (data) => {
    setFormLoading(true);
    try {
      const newPet = await addPet(data);
      setShowAddPet(false);
      return newPet;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPet = async (id, data) => {
    setFormLoading(true);
    try {
      await editPet(id, data);
      setEditingPet(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePet = async (pet) => {
    if (!window.confirm(`Are you sure you want to remove ${pet.name}? This action cannot be undone.`)) return;
    setDeletingPet(pet.id);
    try {
      await removePet(pet.id);
    } finally {
      setDeletingPet(null);
    }
  };

  const handleCameraClick = (pet) => {
    imageTargetPetRef.current = pet.id;
    imageInputRef.current?.click();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !imageTargetPetRef.current) return;
    const petId = imageTargetPetRef.current;
    setUploadingImage(petId);
    try {
      await uploadPetImage(petId, file);
      await refetch();
    } catch {
      /* silently fail — user sees no change */
    } finally {
      setUploadingImage(null);
      imageTargetPetRef.current = null;
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Row */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">
              {t('dashboard_greeting')}{user?.first_name ? `, ${user.first_name}!` : '!'}
            </h1>
            <p className="text-gray-500 mt-1">{t('dashboard_subtitle')}</p>
          </div>
          <button
            onClick={() => setShowAddPet(true)}
            className="bg-[#7C3AED] text-white rounded-full px-5 py-2.5 font-semibold hover:bg-[#6D28D9] shadow-md transition-colors cursor-pointer"
          >
            {t('dashboard_add_pet')}
          </button>
        </div>

        {/* Loading & Error states */}
        {loading && <LoadingSpinner />}
        {error && <ErrorAlert message={error} />}

        {/* Pet Cards Row */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {pets.map((pet) => {
              const age = getAge(pet.birth_year);
              const emoji = speciesEmoji(pet.species?.name);
              const gradient = speciesGradient(pet.species?.name);
              const breedDisplay = [pet.species?.name, pet.breed?.name].filter(Boolean).join(' \u2022 ');

              return (
                <div
                  key={pet.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Cover image area */}
                  <div className={`bg-gradient-to-br ${gradient} h-36 flex items-center justify-center relative overflow-hidden`}>
                    {pet.image_url ? (
                      <img
                        src={pet.image_url.startsWith('http') ? pet.image_url : `${SERVER_BASE}${pet.image_url}`}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center text-4xl shadow-sm"
                      style={{ display: pet.image_url ? 'none' : 'flex' }}
                    >
                      {emoji}
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display font-bold text-lg text-gray-900">
                        {pet.name}
                      </h3>
                      <StatusBadge status="healthy" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {breedDisplay}{age !== null ? ` \u2022 ${age}y` : ''}
                    </p>

                    {/* Info rows */}
                    <div className="space-y-2 mb-4">
                      {pet.gender && pet.gender !== 'Unknown' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Gender
                          </span>
                          <span className="text-gray-700 font-medium">{pet.gender}</span>
                        </div>
                      )}
                      {pet.weight && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Activity className="w-4 h-4" />
                            Weight
                          </span>
                          <span className="text-gray-700 font-medium">{pet.weight} kg</span>
                        </div>
                      )}
                      {pet.microchip_id && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            Microchip
                          </span>
                          <span className="text-gray-700 font-medium">{pet.microchip_id}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom actions */}
                    <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                      {/* Prominent Diagnose Button */}
                      <button
                        onClick={() => navigate(`/questionnaire?pet_id=${pet.id}`)}
                        className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-[#6D28D9] transition-colors"
                      >
                        <Stethoscope className="w-4 h-4" />
                        {t('diagnosis_selector_diagnose_btn') || 'Diagnose this Pet'}
                      </button>

                      {/* Secondary actions */}
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/pet/${pet.id}`}
                          className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors no-underline"
                        >
                          {t('dashboard_view_profile')}
                        </Link>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingPet(pet)}
                            className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-gray-400 hover:text-[#7C3AED] hover:border-[#7C3AED] transition-colors cursor-pointer"
                            title="Edit pet"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePet(pet)}
                            disabled={deletingPet === pet.id}
                            className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete pet"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCameraClick(pet)}
                            disabled={uploadingImage === pet.id}
                            className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-gray-400 hover:text-[#7C3AED] hover:border-[#7C3AED] transition-colors cursor-pointer disabled:opacity-50"
                            title="Upload photo"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Another Pet Card */}
            <div
              onClick={() => setShowAddPet(true)}
              className="border-2 border-dashed border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center p-8 hover:border-[#7C3AED] transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <Plus className="w-7 h-7 text-[#7C3AED]" />
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-1">
                {t('dashboard_add_another')}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                {t('dashboard_add_another_desc')}
              </p>
              <span className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors no-underline">
                {t('dashboard_get_started')}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
          {/* Recent Pawsitivity */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-gray-900">
                {t('dashboard_recent_activity')}
              </h2>
              <Link
                to="/activity"
                className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors no-underline flex items-center gap-1"
              >
                {t('dashboard_see_all')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Activity list */}
            <div className="divide-y divide-[#E5E7EB]">
              <p className="text-sm text-gray-400 text-center py-8">
                No recent activity
              </p>
            </div>
          </div>

          {/* Pet Wellness */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white rounded-2xl p-6 flex flex-col">
            <h2 className="font-display font-bold text-lg mb-1">
              {t('dashboard_wellness')}
            </h2>
            <p className="text-white/70 text-sm mb-5">
              {t('dashboard_overall_score')}
            </p>

            {/* Score */}
            <div className="text-5xl font-display font-bold mb-4">94%</div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-white/20 mb-4">
              <div
                className="h-full rounded-full bg-white/90"
                style={{ width: '94%' }}
              />
            </div>

            {/* Description */}
            <p className="text-sm text-white/80 mb-6 leading-relaxed">
              {t('dashboard_wellness_desc')}
            </p>

            {/* Button */}
            <div className="mt-auto">
              <Link
                to="/wellness"
                className="inline-block bg-white text-[#7C3AED] rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors no-underline"
              >
                {t('dashboard_wellness_reports')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for pet image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleImageSelected}
      />

      {/* Modals */}
      {showAddPet && (
        <AddPetForm
          onSubmit={handleAddPet}
          onClose={() => setShowAddPet(false)}
          loading={formLoading}
        />
      )}

      {editingPet && (
        <EditPetForm
          pet={editingPet}
          onSubmit={handleEditPet}
          onClose={() => setEditingPet(null)}
          loading={formLoading}
        />
      )}
    </div>
  );
};

export default PetDashboard;
