import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Stethoscope, Camera, Pencil, Calendar, Activity, Weight,
  Heart, Clock, ChevronRight, Shield, AlertTriangle, CheckCircle,
  FileText, TrendingUp, Cpu, Dna, Hash, Sparkles,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { usePets } from '../hooks/usePets';
import { getPetHistory, uploadPetImage } from '../api/pets';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
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
    dog: 'from-amber-400 to-orange-300',
    cat: 'from-purple-400 to-fuchsia-300',
    bird: 'from-sky-400 to-cyan-300',
    fish: 'from-blue-400 to-indigo-300',
    rabbit: 'from-pink-400 to-rose-300',
    hamster: 'from-orange-400 to-amber-300',
    turtle: 'from-green-400 to-emerald-300',
    snake: 'from-lime-400 to-green-300',
    horse: 'from-yellow-400 to-amber-300',
  };
  return map[(speciesName || '').toLowerCase()] || 'from-gray-400 to-slate-300';
};

const getAge = (birthYear, birthMonth, birthDay, t) => {
  if (!birthYear) return null;
  const now = new Date();
  let years = now.getFullYear() - birthYear;
  if (birthMonth && now.getMonth() + 1 < birthMonth) years--;
  else if (birthMonth && now.getMonth() + 1 === birthMonth && birthDay && now.getDate() < birthDay) years--;
  years = Math.max(0, years);

  if (years > 0) return `${years} ${years === 1 ? t('age_unit_year') : t('age_unit_years')}`;

  // Calculate months
  let months = (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1) - (birthMonth || 1);
  if (birthDay && now.getDate() < birthDay) months--;
  months = Math.max(0, months);

  if (months > 0) return `${months} ${months === 1 ? t('age_unit_month') : t('age_unit_months')}`;

  // Calculate weeks
  const birthDate = new Date(birthYear, (birthMonth || 1) - 1, birthDay || 1);
  const diffMs = now - birthDate;
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  if (weeks > 0) return `${weeks} ${weeks === 1 ? t('age_unit_week') : t('age_unit_weeks')}`;

  const days = Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  return `${days} ${days === 1 ? t('age_unit_day') : t('age_unit_days')}`;
};

const severityColor = (flags) => {
  if (!flags) return 'green';
  const str = typeof flags === 'string' ? flags : JSON.stringify(flags);
  const count = str.split(',').length;
  if (count >= 3) return 'red';
  if (count >= 2) return 'orange';
  return 'yellow';
};

const PetProfilePage = () => {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const { pets, loading: petsLoading, editPet } = usePets();

  const [diagnoses, setDiagnoses] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const pet = pets.find((p) => String(p.id) === String(id));

  useEffect(() => {
    if (!id) return;
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const res = await getPetHistory(id);
        const data = res.data;
        const list = Array.isArray(data) ? data : (data.diagnoses || data.history || []);
        setDiagnoses(list);
      } catch {
        setDiagnoses([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [id]);

  const handleEditPet = async (petId, data) => {
    setFormLoading(true);
    try {
      await editPet(petId, data);
      setEditingPet(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pet) return;
    setUploadingImage(true);
    try {
      await uploadPetImage(pet.id, file);
      window.location.reload();
    } catch {
      // silently fail
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Compute stats
  const totalDiagnoses = diagnoses.length;
  const completedDiagnoses = diagnoses.filter(
    (d) => (d.status_name || '').toLowerCase() === 'completed'
  ).length;
  const lastDiagnosis = diagnoses[0] || null;
  const lastDiagnosisDate = lastDiagnosis?.created_at
    ? new Date(lastDiagnosis.created_at)
    : null;

  // Wellness score from diagnosis severity
  const wellnessScore = (() => {
    if (diagnoses.length === 0) return null;
    const scored = diagnoses.filter((r) => r.severity_flags);
    if (scored.length === 0) return 100;
    const penalty = scored.reduce((sum, r) => {
      const flags = typeof r.severity_flags === 'string' ? r.severity_flags : JSON.stringify(r.severity_flags || '');
      const count = flags ? flags.split(',').length : 0;
      return sum + count * 15;
    }, 0);
    return Math.max(0, Math.min(100, 100 - Math.round(penalty / scored.length)));
  })();

  const wellnessColorClass =
    wellnessScore === null ? 'text-gray-400' :
    wellnessScore >= 80 ? 'text-green-500' :
    wellnessScore >= 50 ? 'text-amber-500' : 'text-red-500';

  const wellnessStroke =
    wellnessScore === null ? '#D1D5DB' :
    wellnessScore >= 80 ? '#22C55E' :
    wellnessScore >= 50 ? '#F59E0B' : '#EF4444';

  if (petsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <ErrorAlert message="Pet not found." />
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 text-[#7C3AED] font-semibold hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const age = getAge(pet.birth_year, pet.birth_month, pet.birth_day, t);
  const emoji = speciesEmoji(pet.species?.name);
  const gradient = speciesGradient(pet.species?.name);
  const breedDisplay = [pet.species?.name, pet.breed?.name].filter(Boolean).join(' \u2022 ');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/30 to-white" />

        <div className="relative max-w-6xl mx-auto px-6 pt-6 pb-8">
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('pet_profile_back') || 'Back to Dashboard'}
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Pet Image */}
            <div className="relative group flex-shrink-0">
              <div className={`w-40 h-40 md:w-48 md:h-48 rounded-3xl bg-gradient-to-br ${gradient} shadow-lg overflow-hidden flex items-center justify-center`}>
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
                  className="w-full h-full flex items-center justify-center text-7xl"
                  style={{ display: pet.image_url ? 'none' : 'flex' }}
                >
                  {emoji}
                </div>
              </div>
              {/* Camera overlay */}
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-[#7C3AED] hover:shadow-lg transition-all cursor-pointer border-none opacity-0 group-hover:opacity-100"
              >
                <Camera className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Pet Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 mb-1">
                    {pet.name}
                  </h1>
                  <p className="text-gray-500 text-lg">{breedDisplay}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPet(pet)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED] hover:bg-purple-50 transition-colors cursor-pointer bg-white"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t('common_edit') || 'Edit'}
                  </button>
                  <button
                    onClick={() => navigate(`/questionnaire?pet_id=${pet.id}`)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-colors shadow-sm cursor-pointer border-none"
                  >
                    <Stethoscope className="w-4 h-4" />
                    {t('dashboard_diagnose_pet') || 'Diagnose'}
                  </button>
                </div>
              </div>

              {/* Info chips */}
              <div className="flex flex-wrap gap-3 mt-5">
                {age !== null && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
                    {age} old
                  </div>
                )}
                {pet.gender && pet.gender !== 'Unknown' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 shadow-sm">
                    <Heart className="w-3.5 h-3.5 text-pink-400" />
                    {pet.gender}
                  </div>
                )}
                {pet.weight && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 shadow-sm">
                    <Weight className="w-3.5 h-3.5 text-blue-400" />
                    {pet.weight} kg
                  </div>
                )}
                {pet.microchip_id && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 shadow-sm">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    {pet.microchip_id}
                  </div>
                )}
                {pet.species?.name && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 shadow-sm">
                    <Dna className="w-3.5 h-3.5 text-emerald-400" />
                    {pet.species.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-6xl mx-auto px-6 -mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Wellness Score */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">
                {t('pet_profile_wellness') || 'Wellness Score'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              {wellnessScore !== null ? (
                <>
                  <span className={`text-3xl font-bold ${wellnessColorClass}`}>{wellnessScore}%</span>
                  <span className="text-xs text-gray-400 mb-1">
                    {wellnessScore >= 80 ? 'Excellent' : wellnessScore >= 50 ? 'Fair' : 'Needs Attention'}
                  </span>
                </>
              ) : (
                <span className="text-lg text-gray-400">{t('common_no_data') || 'No data'}</span>
              )}
            </div>
            {wellnessScore !== null && (
              <div className="w-full h-1.5 rounded-full bg-gray-100 mt-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${wellnessScore}%`, backgroundColor: wellnessStroke }}
                />
              </div>
            )}
          </div>

          {/* Total Diagnoses */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">
                {t('pet_profile_total_diagnoses') || 'Total Diagnoses'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-[#7C3AED]" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {historyLoading ? '...' : totalDiagnoses}
              </span>
              {completedDiagnoses > 0 && (
                <span className="text-xs text-green-500 mb-1 flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3" /> {completedDiagnoses} completed
                </span>
              )}
            </div>
          </div>

          {/* Last Checkup */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">
                {t('pet_profile_last_checkup') || 'Last Checkup'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            {lastDiagnosisDate ? (
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {lastDiagnosisDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {lastDiagnosisDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            ) : (
              <span className="text-lg text-gray-400">{t('pet_profile_no_checkups') || 'No checkups yet'}</span>
            )}
          </div>

          {/* Latest Diagnosis */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">
                {t('pet_profile_latest_result') || 'Latest Result'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            {lastDiagnosis?.primary_label ? (
              <div>
                <span className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">
                  {lastDiagnosis.primary_label}
                </span>
                {lastDiagnosis.confidence && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Math.round(lastDiagnosis.confidence * 100)}% confidence
                  </p>
                )}
              </div>
            ) : (
              <span className="text-lg text-gray-400">{t('common_no_data') || 'No data'}</span>
            )}
          </div>
        </div>
      </section>

      {/* AI-Powered Insights Banner */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">
                {t('pet_profile_ai_title') || 'AI-Powered Health Insights'}
              </h3>
              <p className="text-white/70 text-sm">
                {t('pet_profile_ai_desc') || 'Get instant diagnosis with our ML image classification and Gemini AI analysis.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/questionnaire?pet_id=${pet.id}`)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#7C3AED] font-semibold text-sm hover:bg-white/90 transition-colors whitespace-nowrap cursor-pointer border-none shadow-sm"
          >
            <Stethoscope className="w-4 h-4" />
            {t('pet_profile_start_diagnosis') || 'Start AI Diagnosis'}
          </button>
        </div>
      </section>

      {/* Diagnosis History Section */}
      <section className="max-w-6xl mx-auto px-6 mt-8 pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl text-gray-900">
            {t('pet_profile_history_title') || 'Diagnosis History'}
          </h2>
          {diagnoses.length > 0 && (
            <Link
              to="/records"
              className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors no-underline flex items-center gap-1"
            >
              {t('dashboard_see_all') || 'See All'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : diagnoses.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
              {t('pet_profile_no_history') || 'No Diagnosis History Yet'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              {t('pet_profile_no_history_desc') || `Start ${pet.name}'s first AI-powered health checkup to build their medical profile.`}
            </p>
            <button
              onClick={() => navigate(`/questionnaire?pet_id=${pet.id}`)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] transition-colors cursor-pointer border-none shadow-sm"
            >
              <Stethoscope className="w-4 h-4" />
              {t('pet_profile_first_diagnosis') || 'Run First Diagnosis'}
            </button>
          </div>
        ) : (
          /* Diagnosis timeline */
          <div className="space-y-4">
            {diagnoses.map((diag, idx) => {
              const date = diag.created_at ? new Date(diag.created_at) : null;
              const status = (diag.status_name || '').toLowerCase();
              const isCompleted = status === 'completed';
              const confidence = diag.confidence ? Math.round(diag.confidence * 100) : null;

              let severityFlags = [];
              try {
                severityFlags = typeof diag.severity_flags === 'string'
                  ? JSON.parse(diag.severity_flags)
                  : (diag.severity_flags || []);
              } catch {
                severityFlags = diag.severity_flags ? [diag.severity_flags] : [];
              }
              if (!Array.isArray(severityFlags)) severityFlags = [severityFlags];

              let secondaryLabels = [];
              try {
                secondaryLabels = typeof diag.secondary_labels === 'string'
                  ? JSON.parse(diag.secondary_labels)
                  : (diag.secondary_labels || []);
              } catch {
                secondaryLabels = [];
              }
              if (!Array.isArray(secondaryLabels)) secondaryLabels = [];

              let actions = [];
              try {
                actions = typeof diag.recommended_actions === 'string'
                  ? JSON.parse(diag.recommended_actions)
                  : (diag.recommended_actions || []);
              } catch {
                actions = [];
              }
              if (!Array.isArray(actions)) actions = [];

              const sColor = severityFlags.length >= 3 ? 'red' : severityFlags.length >= 1 ? 'amber' : 'green';
              const statusIcon = isCompleted
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <Clock className="w-5 h-5 text-amber-500" />;

              return (
                <div
                  key={diag.id || idx}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Top row */}
                  <div className="p-5 flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className={`w-3 h-3 rounded-full ${
                        sColor === 'red' ? 'bg-red-500' : sColor === 'amber' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      {idx < diagnoses.length - 1 && (
                        <div className="w-px h-8 bg-gray-200" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">
                            {diag.primary_label || (t('dashboard_diagnosis_started') || 'Diagnosis started')}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {date && (
                              <span className="text-xs text-gray-400">
                                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' \u2022 '}
                                {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {confidence !== null && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full">
                                <Activity className="w-3 h-3" />
                                {confidence}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusIcon}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            isCompleted
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isCompleted ? (t('common_completed') || 'Completed') : (t('common_pending') || 'Pending')}
                          </span>
                        </div>
                      </div>

                      {/* Explanation */}
                      {diag.explanation && (
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-2">
                          {diag.explanation}
                        </p>
                      )}

                      {/* Tags row */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {secondaryLabels.slice(0, 3).map((label, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600"
                          >
                            {typeof label === 'string' ? label : label.label || label.name || ''}
                          </span>
                        ))}
                        {severityFlags.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            {severityFlags.length} severity flag{severityFlags.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Recommended actions */}
                      {actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                            Recommended Actions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {actions.slice(0, 3).map((action, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-xs text-[#7C3AED]"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {typeof action === 'string' ? action : action.text || action.description || ''}
                              </span>
                            ))}
                            {actions.length > 3 && (
                              <span className="text-xs text-gray-400">+{actions.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer with link to report */}
                  {diag.consultation_id && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                      <Link
                        to={`/report?consultation_id=${diag.consultation_id}`}
                        className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] no-underline inline-flex items-center gap-1 transition-colors"
                      >
                        {t('dashboard_view_report') || 'View Report'}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleImageSelected}
      />

      {/* Edit modal */}
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

export default PetProfilePage;
