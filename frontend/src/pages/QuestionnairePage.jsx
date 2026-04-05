import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import jsonLogic from 'json-logic-js';
import { useLang } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useConsultation } from '../context/ConsultationContext';
import { useStartConsultation } from '../hooks/useConsultation';
import { getActiveQuestionnaire, submitResponse, saveContext } from '../api/questionnaire';
import { getActiveConsultation } from '../api/consultation';
import { getSpecies, getBreeds, getMyPets } from '../api/pets';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ProgressBar from '../components/questionnaire/ProgressBar';
import GreetingHeader from '../components/questionnaire/GreetingHeader';
import QuestionCard from '../components/questionnaire/QuestionCard';

/* ── Option colours by index (for API questions) ── */
const OPTION_COLORS = [
  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
  'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
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

/* ── Evaluate visibility ── */
const isVisible = (question, answers) => {
  if (!question.visibility_rules || question.visibility_rules.length === 0) return true;
  return question.visibility_rules.every((rule) => {
    try {
      const cond = typeof rule.condition_json === 'string'
        ? JSON.parse(rule.condition_json) : rule.condition_json;
      return jsonLogic.apply(cond, { answers });
    } catch { return true; }
  });
};

/* ── Determine step from question code ── */
const getStepForCode = (code) => {
  if (/^P\d+$/.test(code)) return 1;
  if (code === 'SD1') return 2;
  if (/^SD[234]/.test(code)) return 3;
  if (/^SD[567]$/.test(code)) return 4;
  if (code === 'q_pet_type') return 1;
  if (code === 'q_c') return 2;
  if (/^q_[bdfg]$/.test(code)) return 3;
  return 0;
};

/* ── Species emoji for selected pet banner ── */
const speciesEmoji = (name) => {
  const map = { dog: '\uD83D\uDC15', cat: '\uD83D\uDC08' };
  return map[name] || '\uD83D\uDC3E';
};

/* ── Build flat question sequence ── */
const buildSequence = (allQuestions, selectedPet) => {
  const seq = [];

  // Step 1: Pet details (skip for registered pets)
  if (!selectedPet) {
    const p1 = allQuestions.find((q) => q.code === 'P1');
    if (p1) seq.push({ type: 'question', question: p1 });

    // Breed pseudo-question after P1
    seq.push({ type: 'breed', id: 'BREED' });

    ['P2', 'P3', 'P4', 'P5'].forEach((code) => {
      const q = allQuestions.find((q2) => q2.code === code);
      if (q) seq.push({ type: 'question', question: q });
    });
  }

  // Step 2: Main symptom
  const sd1 = allQuestions.find((q) => q.step === 2);
  if (sd1) seq.push({ type: 'question', question: sd1 });

  // Step 3: Branch questions (preserve order from allQuestions)
  allQuestions
    .filter((q) => q.step === 3)
    .forEach((q) => seq.push({ type: 'question', question: q }));

  // Step 4: General assessment
  allQuestions
    .filter((q) => q.step === 4)
    .forEach((q) => seq.push({ type: 'question', question: q }));

  return seq;
};

/* ── Check if a sequence item is visible ── */
const isItemVisible = (item, answers) => {
  if (item.type === 'breed') return !!answers.P1;
  if (item.type !== 'question') return false;
  return isVisible(item.question, answers);
};

/* ── Check if a question requires manual Next (not auto-advance) ── */
const needsManualNext = (item) => {
  if (item.type === 'breed') return true;
  if (item.type !== 'question') return true;
  const qt = item.question.question_type;
  return qt === 'number' || qt === 'text' || qt === 'multi';
};

/* ════════════════════════════════════════════════════════════════ */
const QuestionnairePage = () => {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { consultationId, savePetInfo, clearSession, startSession } = useConsultation();
  const { isAuthenticated } = useAuth(); // eslint-disable-line no-unused-vars
  const { start: startNewConsultation } = useStartConsultation();

  const petIdFromUrl = searchParams.get('pet_id');

  /* ── Core state ── */
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionnaireId, setQuestionnaireId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [answers, setAnswers] = useState({});
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState('');

  /* Ref to track latest answers for auto-advance */
  const answersRef = useRef(answers);
  answersRef.current = answers;

  /* Ref to guard auto-advance race conditions */
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  /* ── Pet breed state ── */
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  const [petBreedId, setPetBreedId] = useState('');
  const [petBreedName, setPetBreedName] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);

  /* ── Resume prompt state ── */
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [activeConsultationData, setActiveConsultationData] = useState(null);

  /* ── Auto-create consultation if needed ── */
  useEffect(() => {
    if (!petIdFromUrl) {
      if (!consultationId) {
        startNewConsultation({ guest_handle: `guest_${Date.now()}` }).catch(() => {});
      }
      return;
    }

    let cancelled = false;
    const checkActive = async () => {
      try {
        const res = await getActiveConsultation(petIdFromUrl);
        if (cancelled) return;
        const active = res.data?.active;
        if (active?.consultation_id) {
          setActiveConsultationData(active);
          setShowResumePrompt(true);
          return;
        }
      } catch {
        // No active consultation or endpoint error — proceed with new
      }
      if (!cancelled) {
        clearSession();
        startNewConsultation({ pet_id: Number(petIdFromUrl) }).catch(() => {});
      }
    };
    checkActive();
    return () => { cancelled = true; };
  }, [petIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResumePrevious = () => {
    if (activeConsultationData) {
      startSession({
        consultation_id: activeConsultationData.consultation_id,
        conversation_id: activeConsultationData.conversation_id,
        pet_id: Number(petIdFromUrl),
      });
      navigate('/chat');
    }
  };

  const handleStartNew = () => {
    setShowResumePrompt(false);
    setActiveConsultationData(null);
    clearSession();
    startNewConsultation({ pet_id: Number(petIdFromUrl) }).catch(() => {});
  };

  /* ── Fetch selected pet data and pre-fill answers ── */
  useEffect(() => {
    if (!petIdFromUrl) return;
    let cancelled = false;
    getMyPets()
      .then((res) => {
        if (cancelled) return;
        const pets = res.data?.pets || [];
        const pet = pets.find((p) => String(p.id) === petIdFromUrl);
        if (!pet) return;
        setSelectedPet(pet);

        const prefilled = {};
        const speciesName = (pet.species?.name || '').toLowerCase();
        if (speciesName === 'dog' || speciesName === 'cat') {
          prefilled.P1 = speciesName;
        }
        if (pet.birth_year) {
          prefilled.P2 = { years: String(new Date().getFullYear() - pet.birth_year), months: '', days: '' };
        }
        if (pet.gender && pet.gender !== 'Unknown') {
          prefilled.P3 = pet.gender.toLowerCase();
        }
        if (pet.is_neutered !== undefined && pet.is_neutered !== null) {
          prefilled.P4 = pet.is_neutered ? 'yes' : 'no';
        }
        if (pet.is_vaccinated !== undefined && pet.is_vaccinated !== null) {
          prefilled.P5 = pet.is_vaccinated ? 'yes' : 'no';
        }

        setAnswers((prev) => ({ ...prefilled, ...prev }));

        if (pet.breed) {
          setPetBreedId(String(pet.breed.id || ''));
          setPetBreedName(pet.breed.description || pet.breed.name || '');
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [petIdFromUrl]);

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

        if (apiQs.length > 0) {
          apiQs.forEach((q) => { q.step = getStepForCode(q.code); });
          setQuestionnaireId(data.questionnaire?.id);
          setAllQuestions(apiQs);
        } else {
          setError('No questions found in the questionnaire. Please check the database.');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load questionnaire from the server.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [lang]);

  /* ── Load species ── */
  useEffect(() => {
    getSpecies()
      .then((res) => {
        const list = res.data?.species || (Array.isArray(res.data) ? res.data : []);
        setSpeciesList(list.length > 0 ? list : []);
      })
      .catch(() => setSpeciesList([]));
  }, []);

  /* ── Load breeds when pet type changes ── */
  const petType = answers.P1 || '';
  useEffect(() => {
    if (!petType) { setBreedList([]); return; }
    const species = speciesList.find((s) => s.name.toLowerCase() === petType.toLowerCase());
    if (!species) return;
    setLoadingBreeds(true);
    if (!petIdFromUrl || !petBreedId) {
      setPetBreedId('');
      setPetBreedName('');
    }
    getBreeds(species.id)
      .then((res) => {
        const breeds = res.data?.breeds || (Array.isArray(res.data) ? res.data : []);
        setBreedList(breeds);
      })
      .catch(() => setBreedList([]))
      .finally(() => setLoadingBreeds(false));
  }, [petType, speciesList]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Build question sequence ── */
  const questionSequence = useMemo(
    () => buildSequence(allQuestions, selectedPet),
    [allQuestions, selectedPet]
  );

  /* ── Navigation helpers ── */
  const findNextVisible = useCallback((fromIndex) => {
    for (let i = fromIndex + 1; i < questionSequence.length; i++) {
      if (isItemVisible(questionSequence[i], answers)) return i;
    }
    return -1;
  }, [questionSequence, answers]);

  const findPrevVisible = useCallback((fromIndex) => {
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (isItemVisible(questionSequence[i], answers)) return i;
    }
    return -1;
  }, [questionSequence, answers]);

  const isLastVisibleQuestion = useCallback(() => {
    return findNextVisible(currentIndex) === -1;
  }, [findNextVisible, currentIndex]);

  /* ── Emergency check removed - was hardcoded fallback ── */
  const checkEmergency = useCallback((code, value) => {
    // Emergency checking logic removed (was hardcoded fallback data)
    // Emergency detection should be handled server-side if needed
  }, []);

  /* ── Submit ── */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      /* Format P2 age from { years, months, days } */
      const ageObj = (typeof answers.P2 === 'object' && answers.P2) || {};
      const ageParts = [];
      if (ageObj.years && ageObj.years !== '') ageParts.push(`${ageObj.years} year${ageObj.years === '1' ? '' : 's'}`);
      if (ageObj.months && ageObj.months !== '' && ageObj.months !== 'not_sure') ageParts.push(`${ageObj.months} month${ageObj.months === '1' ? '' : 's'}`);
      if (ageObj.days && ageObj.days !== '' && ageObj.days !== 'not_sure') ageParts.push(`${ageObj.days} day${ageObj.days === '1' ? '' : 's'}`);

      const payload = {
        pet: {
          type: answers.P1,
          breed: petBreedName || 'Unknown',
          age: ageParts.length > 0 ? ageParts.join(', ') : 'Unknown',
          age_details: ageObj,
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

      Object.keys(answers).forEach((code) => {
        if (/^SD[234]_/.test(code)) {
          payload.symptom_details[code] = answers[code];
        }
      });

      // Emergency flags handling removed (was hardcoded fallback data)
      // Emergency detection should be handled server-side if needed

      if (questionnaireId) {
        const formattedAnswers = Object.entries(answers)
          .map(([code, value]) => {
            const qObj = allQuestions.find((q) => q.code === code);
            if (!qObj) return null;
            // P2 age: send years as the number
            if (code === 'P2' && typeof value === 'object') {
              return {
                question_id: qObj.id,
                answer_number: value.years ? parseFloat(value.years) : undefined,
                free_text: ageParts.join(', ') || undefined,
              };
            }
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

      if (consultationId) {
        try {
          await saveContext({ consultation_id: consultationId, answers: payload });
        } catch {
          console.warn('Failed to save questionnaire context');
        }
      }

      savePetInfo(payload.pet);
      navigate('/image-upload');
    } catch (err) {
      setError(err?.message || 'Failed to submit questionnaire.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Navigate forward ── */
  const handleNext = async () => {
    const next = findNextVisible(currentIndex);
    if (next === -1) {
      // Last question — submit
      await handleSubmit();
    } else {
      setDirection('forward');
      setCurrentIndex(next);
    }
  };

  /* ── Navigate backward ── */
  const handleBack = () => {
    const prev = findPrevVisible(currentIndex);
    if (prev === -1) {
      // At first question
      if (selectedPet) {
        navigate('/dashboard');
      }
      return;
    }
    setDirection('backward');
    setCurrentIndex(prev);
  };

  /* ── Answer handler with auto-advance ── */
  const handleAnswer = useCallback((code, value) => {
    setAnswers((prev) => {
      const updated = { ...prev, [code]: value };

      // When SD1 changes, clear old branch answers
      if (code === 'SD1' && prev.SD1 && prev.SD1 !== value) {
        Object.keys(updated).forEach((key) => {
          if (/^SD[234]_/.test(key)) delete updated[key];
        });
      }

      return updated;
    });
    checkEmergency(code, value);

    // Auto-advance for single-select / boolean (not for number/text/breed)
    const currentItem = questionSequence[currentIndexRef.current];
    if (
      currentItem?.type === 'question' &&
      (currentItem.question.question_type === 'single' || currentItem.question.question_type === 'boolean')
    ) {
      const savedIndex = currentIndexRef.current;
      setTimeout(() => {
        // Guard: only advance if user hasn't already navigated
        if (currentIndexRef.current !== savedIndex) return;

        // Use latest answers (via ref) so visibility is computed with the new answer
        const latestAnswers = { ...answersRef.current, [code]: value };
        let next = -1;
        for (let i = savedIndex + 1; i < questionSequence.length; i++) {
          if (isItemVisible(questionSequence[i], latestAnswers)) {
            next = i;
            break;
          }
        }
        if (next === -1) {
          // Last question — don't auto-submit, let user click the button
          return;
        }
        setDirection('forward');
        setCurrentIndex(next);
      }, 350);
    }
  }, [questionSequence, checkEmergency]);

  /* ── Breed change handler ── */
  const handleBreedChange = useCallback((id) => {
    setPetBreedId(id);
    if (id === 'mixed') {
      setPetBreedName('Mixed / Unknown');
    } else {
      const breed = breedList.find((b) => String(b.id) === id);
      setPetBreedName(breed?.description || breed?.name || '');
    }
  }, [breedList]);

  /* ── Check if current item has a valid answer (for Next button) ── */
  const isCurrentValid = () => {
    const item = questionSequence[currentIndex];
    if (!item) return false;
    if (item.type === 'breed') return true; // breed is optional
    if (item.type !== 'question') return false;
    const q = item.question;
    if (q.question_type === 'text') return true; // text is optional
    const val = answers[q.code];
    // P2 age: valid if years is filled
    if (q.code === 'P2') {
      return typeof val === 'object' && val && val.years !== '' && val.years !== undefined;
    }
    if (q.question_type === 'multi') return Array.isArray(val) && val.length > 0;
    return val !== undefined && val !== '';
  };

  /* ── Progress calculation ── */
  const visibleQuestions = useMemo(() => {
    return questionSequence.filter((item) =>
      item.type === 'question' && isItemVisible(item, answers)
    );
  }, [questionSequence, answers]);

  const answeredCount = useMemo(() => {
    return visibleQuestions.filter((item) => {
      const val = answers[item.question.code];
      // P2 age object: answered if years is filled
      if (item.question.code === 'P2') {
        return typeof val === 'object' && val && val.years !== '' && val.years !== undefined;
      }
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== '';
    }).length;
  }, [visibleQuestions, answers]);

  const totalVisible = visibleQuestions.length;
  const progress = totalVisible > 0 ? Math.round((answeredCount / totalVisible) * 100) : 0;

  /* ── Current visible question number (for "Question X of Y") ── */
  const currentVisibleIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < questionSequence.length; i++) {
      if (isItemVisible(questionSequence[i], answers)) {
        count++;
        if (i === currentIndex) return count;
      }
    }
    return count;
  }, [questionSequence, answers, currentIndex]);

  const totalVisibleItems = useMemo(() => {
    return questionSequence.filter((item) => isItemVisible(item, answers)).length;
  }, [questionSequence, answers]);

  /* ── Current item ── */
  const currentItem = questionSequence[currentIndex];
  const showManualNext = currentItem ? needsManualNext(currentItem) : true;
  const isLast = isLastVisibleQuestion();
  const canGoBack = findPrevVisible(currentIndex) !== -1;

  /* ════════════  JSX  ════════════ */
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Navbar />

      {/* Emergency Banner */}
      {showEmergency && (
        <div className="max-w-xl mx-auto mt-4 px-4">
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
              className="text-red-400 hover:text-red-600 text-lg font-bold leading-none cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Resume Previous Diagnosis Prompt */}
      {showResumePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-[#F5F3FF] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('quest_resume_title') || 'Continue Previous Diagnosis?'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('quest_resume_desc') || 'You have an active diagnosis in progress for this pet. Would you like to continue where you left off or start a new diagnosis?'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResumePrevious}
                className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] text-white rounded-xl px-4 py-3 font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                {t('quest_resume_continue') || 'Continue Previous Diagnosis'}
              </button>
              <button
                onClick={handleStartNew}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                {t('quest_resume_new') || 'Start New Diagnosis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-xl mx-auto px-4 py-8">

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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('quest_no_questions') || 'No questionnaire available at this time.'}
            </p>
          </div>
        )}

        {/* Conversational Questionnaire */}
        {!loading && !error && allQuestions.length > 0 && currentItem && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Progress Bar */}
            <div className="px-6 pt-5">
              <ProgressBar
                progress={progress}
                currentQuestion={currentVisibleIndex}
                totalQuestions={totalVisibleItems}
              />
            </div>

            {/* Selected Pet Banner */}
            {selectedPet && (
              <div className="mx-6 mb-2 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg">
                  {speciesEmoji((selectedPet.species?.name || '').toLowerCase())}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('quest_diagnosing') || 'Diagnosing'}: {selectedPet.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedPet.species?.name}{selectedPet.breed ? ` \u2022 ${selectedPet.breed.description || selectedPet.breed.name}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Greeting */}
            <div className="px-6 pt-4">
              <GreetingHeader
                currentItem={currentItem}
                petName={selectedPet?.name}
              />
            </div>

            {/* Question Card with animation */}
            <div className="px-6 pb-6 min-h-[280px] flex items-center">
              <div
                key={currentIndex}
                className={`w-full ${direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
              >
                <QuestionCard
                  item={currentItem}
                  answers={answers}
                  onAnswer={handleAnswer}
                  breedList={breedList}
                  petBreedId={petBreedId}
                  loadingBreeds={loadingBreeds}
                  onBreedChange={handleBreedChange}
                />
              </div>
            </div>

            {/* Footer: Back / Next */}
            <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={!canGoBack && !selectedPet}
                  className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('quest_back') || 'Back'}
                </button>

                {/* Show Next/Submit button for manual-next items, or when it's the last question */}
                {(showManualNext || isLast) && (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!isCurrentValid() || submitting}
                    className="flex items-center gap-1 px-6 py-2.5 rounded-full bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting
                      ? t('quest_submitting') || 'Submitting...'
                      : isLast
                        ? t('quest_finish') || 'Finish'
                        : t('quest_next') || 'Next'}
                    {!submitting && <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnairePage;
