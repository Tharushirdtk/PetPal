import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Dog,
  Cat,
} from 'lucide-react';
import jsonLogic from 'json-logic-js';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../context/ConsultationContext';
import { useStartConsultation } from '../hooks/useConsultation';
import { getActiveQuestionnaire, submitResponse, saveContext } from '../api/questionnaire';
import { getSpecies, getBreeds } from '../api/pets';
import { questionFlow, EMERGENCY_RULES } from '../data/mockData';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

/* ── Step labels ── */
const STEP_TITLES = {
  1: { en: 'Pet Details', si: 'සුරතල් විස්තර' },
  2: { en: 'Main Symptom', si: 'ප්‍රධාන රෝග ලක්ෂණය' },
  3: { en: 'Symptom Details', si: 'රෝග ලක්ෂණ විස්තර' },
  4: { en: 'General Assessment', si: 'සාමාන්‍ය තක්සේරුව' },
};

const TOTAL_STEPS = 4;

/* ── Option colours by index ── */
const OPTION_COLORS = [
  'bg-green-50 border-green-200',
  'bg-blue-50 border-blue-200',
  'bg-yellow-50 border-yellow-200',
  'bg-orange-50 border-orange-200',
  'bg-red-50 border-red-200',
  'bg-purple-50 border-purple-200',
  'bg-pink-50 border-pink-200',
  'bg-teal-50 border-teal-200',
];

/* ── Map API question → rendering format ── */
const mapApiQuestion = (apiQ) => ({
  id: apiQ.id,
  code: apiQ.code,
  text: apiQ.text,
  question_type: apiQ.question_type,
  options: (apiQ.options || []).map((opt, i) => ({
    value: opt.value_key,
    label: opt.label,
    icon: '',
    color: OPTION_COLORS[i % OPTION_COLORS.length],
    optionId: opt.id,
  })),
  visibility_rules: apiQ.visibility_rules || [],
});

/* ── Map mock question → rendering format ── */
const mapMockQuestion = (mq, lang) => ({
  id: mq.code,
  code: mq.code,
  text: lang === 'si' ? mq.text_si : mq.text_en,
  question_type: mq.type === 'yesno' ? 'single' : mq.type,
  step: mq.step,
  visibleWhen: mq.visibleWhen || null,
  options: (mq.options || []).map((opt) => ({
    value: opt.value,
    label: lang === 'si' ? opt.label_si : opt.label_en,
    icon: opt.icon || '',
    color: opt.color || 'bg-gray-50 border-gray-200',
    emergencyTrigger: opt.emergencyTrigger || false,
  })),
  visibility_rules: [],
});

/* ── Determine step from question code ── */
const getStepForCode = (code) => {
  if (/^P\d+$/.test(code)) return 1;
  if (code === 'SD1') return 2;
  if (/^SD[234]/.test(code)) return 3;
  if (/^SD[567]$/.test(code)) return 4;
  return 0;
};

/* ── Evaluate visibility ── */
const isVisible = (question, answers, usingMock) => {
  if (usingMock) {
    if (!question.visibleWhen) return true;
    return Object.entries(question.visibleWhen).every(
      ([key, val]) => answers[key] === val
    );
  }
  if (!question.visibility_rules || question.visibility_rules.length === 0) return true;
  return question.visibility_rules.every((rule) => {
    try {
      const cond = typeof rule.condition_json === 'string'
        ? JSON.parse(rule.condition_json) : rule.condition_json;
      return jsonLogic.apply(cond, { answers });
    } catch { return true; }
  });
};

/* ── SD1 symptom icons ── */
const SD1_ICONS = {
  skin: '🐾', vomiting: '🤮', diarrhea: '💩', coughing: '🫁',
  injury: '🩹', appetite_loss: '🍽️', other: '❓',
};

/* ════════════════════════════════════════════════════════════════ */
const QuestionnairePage = () => {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { consultationId, savePetInfo } = useConsultation();
  const { isAuthenticated } = useAuth(); // eslint-disable-line no-unused-vars
  const { start: startNewConsultation } = useStartConsultation();

  /* ── Core state ── */
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionnaireId, setQuestionnaireId] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState('');

  /* ── Pet breed state ── */
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [petBreedId, setPetBreedId] = useState('');
  const [petBreedName, setPetBreedName] = useState('');

  /* ── Auto-create consultation if needed ── */
  useEffect(() => {
    if (!consultationId) {
      startNewConsultation({ guest_handle: `guest_${Date.now()}` }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Load questionnaire ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getActiveQuestionnaire();
        if (cancelled) return;

        const data = res.data;
        const apiQs = (data?.questions || []).map(mapApiQuestion);
        const usable = apiQs.filter((q) => (q.question_type !== 'single' && q.question_type !== 'multi') || (q.options && q.options.length > 0));

        if (usable.length > 0) {
          /* Assign step based on code */
          usable.forEach((q) => { q.step = getStepForCode(q.code); });
          setQuestionnaireId(data.questionnaire?.id);
          setAllQuestions(usable);
          setUsingMock(false);
        } else {
          loadMock();
        }
      } catch {
        if (!cancelled) loadMock();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const loadMock = () => {
      setAllQuestions(questionFlow.map((q) => mapMockQuestion(q, lang)));
      setUsingMock(true);
      setQuestionnaireId(null);
    };
    load();
    return () => { cancelled = true; };
  }, [lang]);

  /* ── Load species ── */
  useEffect(() => {
    getSpecies()
      .then((res) => {
        const list = res.data?.species || (Array.isArray(res.data) ? res.data : []);
        setSpeciesList(list.length > 0 ? list : [{ id: 1, name: 'Dog' }, { id: 2, name: 'Cat' }]);
      })
      .catch(() => setSpeciesList([{ id: 1, name: 'Dog' }, { id: 2, name: 'Cat' }]));
  }, []);

  /* ── Load breeds when pet type changes ── */
  const petType = answers.P1 || '';
  useEffect(() => {
    if (!petType) { setBreedList([]); return; }
    const species = speciesList.find((s) => s.name.toLowerCase() === petType.toLowerCase());
    if (!species) return;
    setLoadingBreeds(true);
    setPetBreedId('');
    setPetBreedName('');
    getBreeds(species.id)
      .then((res) => {
        const breeds = res.data?.breeds || (Array.isArray(res.data) ? res.data : []);
        setBreedList(breeds);
      })
      .catch(() => setBreedList([]))
      .finally(() => setLoadingBreeds(false));
  }, [petType, speciesList]);

  /* ── Get questions for a step ── */
  const getStepQuestions = useCallback((step) => {
    return allQuestions.filter((q) => {
      if (q.step !== step) return false;
      if (step === 3) return isVisible(q, answers, usingMock);
      return true;
    });
  }, [allQuestions, answers, usingMock]);

  /* ── Emergency check ── */
  const checkEmergency = useCallback((code, value) => {
    const messages = {
      SD3_VOM: t('quest_emergency_blood_vomit') || 'Blood in vomit detected — please seek immediate veterinary care!',
      SD3_COU: t('quest_emergency_breathing') || 'Breathing difficulty detected — seek immediate veterinary care!',
      SD4_INJ: t('quest_emergency_bleeding') || 'Heavy bleeding or visible bone — seek emergency care immediately!',
    };
    if (EMERGENCY_RULES[code] && value === EMERGENCY_RULES[code]) {
      setShowEmergency(true);
      setEmergencyMsg(messages[code] || 'Emergency detected — contact a veterinarian immediately.');
    }
  }, [t]);

  /* ── Answer handler ── */
  const handleAnswer = (code, value) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
    checkEmergency(code, value);
  };

  /* ── Validate current step ── */
  const isStepValid = () => {
    const qs = getStepQuestions(currentStep);
    if (currentStep === 1) {
      if (!answers.P1) return false;
      if (!answers.P2) return false;
      if (!answers.P3) return false;
      if (!answers.P4) return false;
      if (!answers.P5) return false;
      return true;
    }
    return qs.every((q) => {
      const val = answers[q.code];
      if (q.question_type === 'text') return true; // text is optional
      return val !== undefined && val !== '';
    });
  };

  /* ── Navigation ── */
  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      let next = currentStep + 1;
      // Auto-skip step 3 if no visible branch questions
      if (next === 3 && getStepQuestions(3).length === 0) next = 4;
      setCurrentStep(next);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      let prev = currentStep - 1;
      // Auto-skip step 3 back if no visible branch questions
      if (prev === 3 && getStepQuestions(3).length === 0) prev = 2;
      setCurrentStep(prev);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      /* Build structured payload */
      const payload = {
        pet: {
          type: answers.P1,
          breed: petBreedName || 'Unknown',
          age: answers.P2,
          gender: answers.P3,
          neutered: answers.P4,
          vaccinated: answers.P5,
        },
        main_symptom: answers.SD1,
        symptom_details: {},
        general: {
          duration: answers.SD5,
          severity: answers.SD6,
          behaviour_change: answers.SD7,
        },
        emergency_flags: [],
      };

      /* Collect branch answers */
      Object.keys(answers).forEach((code) => {
        if (/^SD[234]_/.test(code)) {
          payload.symptom_details[code] = answers[code];
        }
      });

      /* Emergency flags */
      Object.entries(EMERGENCY_RULES).forEach(([code, triggerVal]) => {
        if (answers[code] === triggerVal) payload.emergency_flags.push(code);
      });

      /* 1. Submit formal response if API questions */
      if (!usingMock && questionnaireId) {
        const formattedAnswers = Object.entries(answers)
          .map(([code, value]) => {
            const qObj = allQuestions.find((q) => q.code === code);
            if (!qObj) return null;
            return {
              question_id: qObj.id,
              selected_option_value_key: qObj.question_type === 'single' ? String(value) : undefined,
              free_text: qObj.question_type === 'text' ? value : undefined,
              answer_number: qObj.question_type === 'number' ? parseFloat(value) : undefined,
            };
          })
          .filter(Boolean);

        try {
          await submitResponse({
            questionnaire_id: questionnaireId,
            consultation_id: consultationId,
            answers: formattedAnswers,
          });
        } catch {
          /* Non-critical — we still save context below */
        }
      }

      /* 2. Save to llm_context */
      if (consultationId) {
        try {
          await saveContext({ consultation_id: consultationId, answers: payload });
        } catch {
          console.warn('Failed to save questionnaire context');
        }
      }

      /* 3. Save pet info to context for right sidebar */
      savePetInfo(payload.pet);

      /* Navigate to optional image upload step */
      navigate('/image-upload');
    } catch (err) {
      setError(err?.message || 'Failed to submit questionnaire.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Progress ── */
  const progress = Math.round((currentStep / TOTAL_STEPS) * 100);
  const stepTitle = STEP_TITLES[currentStep]?.[lang] || STEP_TITLES[currentStep]?.en || '';

  /* ── Render helpers ── */
  const renderOptionButton = (q, opt, isSelected) => (
    <button
      key={opt.value}
      type="button"
      onClick={() => handleAnswer(q.code, opt.value)}
      className={`rounded-xl border-2 p-4 flex items-center gap-3 text-left cursor-pointer transition-all duration-200
        ${opt.color || 'bg-gray-50 border-gray-200'}
        ${isSelected
          ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.02] shadow-sm'
          : 'border-transparent hover:border-gray-300 hover:shadow-sm'
        }`}
    >
      {opt.icon && <span className="text-xl flex-shrink-0">{opt.icon}</span>}
      <span className="text-sm font-medium text-gray-700">{opt.label}</span>
    </button>
  );

  const renderQuestion = (q) => {
    const val = answers[q.code];
    return (
      <div key={q.code} className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">{q.text}</label>

        {(q.question_type === 'single' || q.question_type === 'boolean') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt) => renderOptionButton(q, opt, val === opt.value))}
          </div>
        )}

        {q.question_type === 'number' && (
          <input
            type="number"
            min="0"
            max="30"
            value={val || ''}
            onChange={(e) => handleAnswer(q.code, e.target.value)}
            placeholder={t('quest_enter_number') || 'Enter a number...'}
            className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors"
          />
        )}

        {q.question_type === 'text' && (
          <textarea
            value={val || ''}
            onChange={(e) => handleAnswer(q.code, e.target.value)}
            placeholder={t('quest_type_answer') || 'Type your answer...'}
            rows={3}
            className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors resize-none"
          />
        )}
      </div>
    );
  };

  /* ── Render Step 1: Pet Details ── */
  const renderStep1 = () => {
    const p1 = allQuestions.find((q) => q.code === 'P1');
    const p2 = allQuestions.find((q) => q.code === 'P2');
    const p3 = allQuestions.find((q) => q.code === 'P3');
    const p4 = allQuestions.find((q) => q.code === 'P4');
    const p5 = allQuestions.find((q) => q.code === 'P5');

    return (
      <div className="space-y-5">
        {/* P1: Pet Type — special icon buttons */}
        {p1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{p1.text}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAnswer('P1', 'dog')}
                className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200
                  bg-orange-50 border-orange-200
                  ${answers.P1 === 'dog'
                    ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.02] shadow-sm'
                    : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Dog className="w-8 h-8 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">{t('quest_pet_type_dog') || 'Dog'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAnswer('P1', 'cat')}
                className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200
                  bg-purple-50 border-purple-200
                  ${answers.P1 === 'cat'
                    ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.02] shadow-sm'
                    : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Cat className="w-8 h-8 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">{t('quest_pet_type_cat') || 'Cat'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Breed dropdown (shown when pet type selected) */}
        {petType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('quest_pet_breed') || 'Breed'}
            </label>
            <select
              value={petBreedId}
              onChange={(e) => {
                const id = e.target.value;
                setPetBreedId(id);
                if (id === 'mixed') {
                  setPetBreedName('Mixed / Unknown');
                } else {
                  const breed = breedList.find((b) => String(b.id) === id);
                  setPetBreedName(breed?.name || '');
                }
              }}
              disabled={loadingBreeds}
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors bg-white"
            >
              <option value="">
                {loadingBreeds ? '...' : t('quest_pet_breed_placeholder') || 'Select breed'}
              </option>
              {breedList.map((breed) => (
                <option key={breed.id} value={breed.id}>{breed.name}</option>
              ))}
              <option value="mixed">{t('quest_pet_breed_mixed') || 'Mixed / Unknown'}</option>
            </select>
          </div>
        )}

        {/* P2: Age */}
        {p2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{p2.text}</label>
            <input
              type="number"
              min="0"
              max="30"
              value={answers.P2 || ''}
              onChange={(e) => handleAnswer('P2', e.target.value)}
              placeholder={t('quest_pet_age_placeholder') || 'Enter age'}
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>
        )}

        {/* P3: Gender */}
        {p3 && renderQuestion(p3)}

        {/* P4: Neutered/Spayed */}
        {p4 && renderQuestion(p4)}

        {/* P5: Vaccinated */}
        {p5 && renderQuestion(p5)}
      </div>
    );
  };

  /* ── Render Step 2: Main Symptom ── */
  const renderStep2 = () => {
    const sd1 = allQuestions.find((q) => q.code === 'SD1');
    if (!sd1) return null;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">{sd1.text}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sd1.options.map((opt) => {
            const icon = SD1_ICONS[opt.value] || opt.icon || '❓';
            const isSelected = answers.SD1 === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleAnswer('SD1', opt.value)}
                className={`rounded-xl border-2 p-4 flex items-center gap-3 text-left cursor-pointer transition-all duration-200
                  ${opt.color || 'bg-gray-50 border-gray-200'}
                  ${isSelected
                    ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.02] shadow-sm'
                    : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Render Step 3: Branch Questions ── */
  const renderStep3 = () => {
    const qs = getStepQuestions(3);
    if (qs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400 text-sm">
          {t('quest_no_branch') || 'No specific follow-up questions for this symptom.'}
        </div>
      );
    }
    return <div className="space-y-1">{qs.map(renderQuestion)}</div>;
  };

  /* ── Render Step 4: Global Questions ── */
  const renderStep4 = () => {
    const qs = getStepQuestions(4);
    return <div className="space-y-1">{qs.map(renderQuestion)}</div>;
  };

  const stepRenderers = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4 };

  /* ════════════  JSX  ════════════ */
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />

      {/* Emergency Banner */}
      {showEmergency && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                {t('emergency_title') || 'Emergency Detected'}
              </p>
              <p className="text-xs text-red-600 mt-1">{emergencyMsg}</p>
            </div>
            <button
              onClick={() => setShowEmergency(false)}
              className="text-red-400 hover:text-red-600 text-lg font-bold leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-[#F5F3FF] flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {t('quest_title') || 'Pet Health Questionnaire'}
            </h1>
            <p className="text-xs text-gray-400">
              {t('quest_subtitle') || "Answer a few questions to help us understand your pet's condition."}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {/* Error */}
        {!loading && error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* No questions */}
        {!loading && !error && allQuestions.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {t('quest_no_questions') || 'No questionnaire available at this time.'}
            </p>
          </div>
        )}

        {/* Wizard Card */}
        {!loading && !error && allQuestions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Progress Bar */}
            <div className="px-6 pt-5 pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 tracking-wide">
                  {t('quest_step') || 'STEP'} {currentStep} {t('quest_of') || 'OF'} {TOTAL_STEPS}
                </span>
                <span className="text-xs font-semibold text-[#7C3AED]">
                  {progress}% {t('quest_complete') || 'Complete'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step Title */}
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-base font-semibold text-gray-900 leading-relaxed">{stepTitle}</h2>
              {currentStep === 1 && (
                <p className="text-xs text-gray-400 mt-1">
                  {t('quest_pet_info_subtitle') || 'This helps us provide a more accurate diagnosis.'}
                </p>
              )}
            </div>

            {/* Step Content */}
            <div className="px-6 pb-4">
              {stepRenderers[currentStep]?.()}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep <= 1}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('quest_back') || 'Back'}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid() || submitting}
                  className="flex items-center gap-1 px-6 py-2.5 rounded-full bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting
                    ? t('quest_submitting') || 'Submitting...'
                    : currentStep >= TOTAL_STEPS
                      ? t('quest_finish') || 'Finish'
                      : t('quest_next') || 'Next Step'}
                  {!submitting && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnairePage;
