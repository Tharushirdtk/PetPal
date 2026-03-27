import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useConsultation } from '../context/ConsultationContext';
import { getActiveQuestionnaire, submitResponse, saveContext } from '../api/questionnaire';
import { questionFlow, EMERGENCY_TRIGGERS } from '../data/mockData';
import Navbar from '../components/Navbar';
import EmergencyBanner from '../components/EmergencyBanner';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── Map the questionFlow mock data into the rendering format ── */
const mapFlowQuestion = (flowQ, lang) => ({
  id: flowQ.id,
  text: lang === 'si' ? flowQ.text_si : flowQ.text_en,
  question_type: flowQ.type === 'yesno' ? 'single' : 'single',
  options: (flowQ.options || []).map((opt) => ({
    value: opt.value,
    label: lang === 'si' ? opt.label_si : opt.label_en,
    icon: opt.icon || '',
    color: opt.color || 'bg-gray-50 border-gray-200',
    emergencyTrigger: opt.emergencyTrigger || false,
  })),
  conditionalNext: flowQ.conditionalNext || {},
  defaultNext: flowQ.defaultNext || null,
});

/* ── Map API question format to rendering format ── */
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

const mapApiQuestion = (apiQ) => ({
  id: apiQ.id,
  code: apiQ.code,
  text: apiQ.text,
  question_type: apiQ.question_type,
  options: (apiQ.options || []).map((opt, oi) => ({
    value: opt.value_key,
    label: opt.label,
    icon: '',
    color: OPTION_COLORS[oi % OPTION_COLORS.length],
    optionId: opt.id,
  })),
  visibility_rules: apiQ.visibility_rules || [],
});

const QuestionnairePage = () => {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { consultationId } = useConsultation();

  const [questions, setQuestions] = useState([]);
  const [questionnaireId, setQuestionnaireId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showEmergency, setShowEmergency] = useState(false);

  /* History stack so "Back" can retrace the exact path taken */
  const [stepHistory, setStepHistory] = useState([0]);

  /* ── Load mock question flow as fallback ── */
  const loadMockQuestions = () => {
    const mapped = questionFlow.map((q) => mapFlowQuestion(q, lang));
    setQuestions(mapped);
    setUsingMockData(true);
    setQuestionnaireId(null);
  };

  /* ── Fetch questionnaire on mount ── */
  useEffect(() => {
    let cancelled = false;
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getActiveQuestionnaire();
        if (cancelled) return;
        const data = res.data;

        const apiQuestions = (data.questions || []).map(mapApiQuestion);

        /* Check if API questions are usable (have options) */
        const usableQuestions = apiQuestions.filter(
          (q) => q.options && q.options.length > 0
        );

        if (usableQuestions.length > 0) {
          setQuestionnaireId(data.questionnaire?.id);
          setQuestions(usableQuestions);
          setUsingMockData(false);
        } else {
          /* API returned questions without options — use mock data */
          loadMockQuestions();
        }
      } catch {
        if (!cancelled) {
          /* API failed — use mock data so questionnaire still works */
          loadMockQuestions();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchQuestionnaire();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  /* ── Evaluate visibility rules (for API questions only) ── */
  const isQuestionVisible = (question) => {
    if (usingMockData) return true; // mock flow uses conditionalNext instead
    if (!question.visibility_rules || question.visibility_rules.length === 0)
      return true;
    return question.visibility_rules.every((rule) => {
      const answerVal = answers[rule.depends_on_question_id];
      if (rule.operator === 'equals') return answerVal === rule.value;
      if (rule.operator === 'not_equals') return answerVal !== rule.value;
      if (rule.operator === 'in')
        return Array.isArray(rule.value)
          ? rule.value.includes(answerVal)
          : false;
      return true;
    });
  };

  const q = questions[currentStep];
  const totalSteps = questions.length;
  const progress =
    totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

  /* ── Select an option (single/boolean) ── */
  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [q.id]: option.value }));

    /* Check emergency triggers */
    if (
      option.emergencyTrigger ||
      EMERGENCY_TRIGGERS.includes(option.value)
    ) {
      setShowEmergency(true);
    }
  };

  /* ── Handle multi-select toggle ── */
  const handleMultiToggle = (option) => {
    setAnswers((prev) => {
      const current = prev[q.id] || [];
      const idx = current.indexOf(option.value);
      const next =
        idx === -1
          ? [...current, option.value]
          : current.filter((v) => v !== option.value);
      return { ...prev, [q.id]: next };
    });
  };

  /* ── Handle text / number / date input ── */
  const handleInputChange = (value) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  /* ── Find next step for mock flow (using conditionalNext / defaultNext) ── */
  const getNextMockIndex = () => {
    const selectedValue = answers[q.id];
    const conditional = q.conditionalNext || {};
    const nextId = conditional[selectedValue] || q.defaultNext;

    if (!nextId || nextId === 'complete' || nextId === 'emergency') {
      return -1; // submit
    }

    const idx = questions.findIndex((qItem) => qItem.id === nextId);
    return idx >= 0 ? idx : currentStep + 1;
  };

  /* ── Next step ── */
  const handleNext = async () => {
    const selectedValue = answers[q.id];
    if (
      selectedValue === undefined ||
      selectedValue === '' ||
      (Array.isArray(selectedValue) && selectedValue.length === 0)
    )
      return;

    let nextIndex;

    if (usingMockData) {
      nextIndex = getNextMockIndex();
      if (nextIndex < 0 || nextIndex >= questions.length) {
        await handleSubmit();
        return;
      }
    } else {
      nextIndex = currentStep + 1;
      /* Skip questions that are not visible */
      while (
        nextIndex < questions.length &&
        !isQuestionVisible(questions[nextIndex])
      ) {
        nextIndex++;
      }
      if (nextIndex >= questions.length) {
        await handleSubmit();
        return;
      }
    }

    setStepHistory((prev) => [...prev, nextIndex]);
    setCurrentStep(nextIndex);
  };

  /* ── Back step ── */
  const handleBack = () => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      setStepHistory(newHistory);
      setCurrentStep(newHistory[newHistory.length - 1]);
    }
  };

  /* ── Submit questionnaire ── */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      /* Build structured answers keyed by question code/id */
      const structuredAnswers = {};
      for (const [qId, value] of Object.entries(answers)) {
        /* Use the question's code if available, otherwise use the id */
        const questionObj = questions.find((qi) => qi.id === qId);
        const key = questionObj?.code || qId;
        structuredAnswers[key] = value;
      }

      if (!usingMockData && questionnaireId) {
        /* API questions — submit to the formal response endpoint */
        const formattedAnswers = Object.entries(answers).map(
          ([questionId, value]) => ({
            question_id: questionId,
            selected_option_value_key: Array.isArray(value) ? undefined : String(value),
            selected_option_value_keys: Array.isArray(value) ? value : undefined,
            free_text: typeof value === 'string' && value.length > 50 ? value : undefined,
          })
        );
        await submitResponse({
          questionnaire_id: questionnaireId,
          consultation_id: consultationId,
          answers: formattedAnswers,
        });
      }

      /* Always save structured answers to llm_context so the chat/LLM can use them */
      if (consultationId) {
        try {
          await saveContext({
            consultation_id: consultationId,
            answers: structuredAnswers,
          });
        } catch {
          /* Non-critical — chat will still work, just without questionnaire context */
          console.warn('Failed to save questionnaire context');
        }
      }

      navigate('/chat');
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Failed to submit questionnaire.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedValue = q ? answers[q.id] : undefined;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Navbar — consistent with other pages */}
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
              <p className="text-xs text-red-600 mt-1">
                {t('emergency_desc') ||
                  'Please contact a veterinarian immediately. This situation may require urgent attention.'}
              </p>
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
              {t('quest_title') || 'Health Assessment'}
            </h1>
            <p className="text-xs text-gray-400">
              {t('quest_subtitle') ||
                'Answer a few questions about your pet\'s health'}
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <ErrorAlert message={error} onClose={() => setError(null)} />
        )}

        {/* No questions loaded */}
        {!loading && !error && questions.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {t('quest_no_questions') ||
                'No questionnaire available at this time.'}
            </p>
          </div>
        )}

        {/* Question Card */}
        {!loading && !error && q && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* ─── Progress Bar (top) ─── */}
            <div className="px-6 pt-5 pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 tracking-wide">
                  {t('quest_step')} {stepHistory.length} {t('quest_of')}{' '}
                  {totalSteps}
                </span>
                <span className="text-xs font-semibold text-[#7C3AED]">
                  {progress}% {t('quest_complete')}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7C3AED] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* ─── Question Text ─── */}
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-base font-semibold text-gray-900 leading-relaxed">
                {q.text}
              </h2>
            </div>

            {/* ─── Options / Inputs ─── */}
            <div className="px-6 pb-4">
              {/* Single / Boolean / Image — option grid */}
              {['single', 'boolean', 'image'].includes(q.question_type) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {q.options.map((opt) => {
                    const isSelected = selectedValue === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt)}
                        className={`
                          rounded-xl border-2 p-4 flex items-center gap-3 text-left
                          cursor-pointer transition-all duration-200
                          ${opt.color}
                          ${
                            isSelected
                              ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.02] shadow-sm'
                              : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                      >
                        {opt.icon && (
                          <span className="text-xl flex-shrink-0">
                            {opt.icon}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Multi-select — option grid with checkboxes */}
              {q.question_type === 'multi' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {q.options.map((opt) => {
                    const currentArr = Array.isArray(answers[q.id])
                      ? answers[q.id]
                      : [];
                    const isSelected = currentArr.includes(opt.value);

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleMultiToggle(opt)}
                        className={`
                          rounded-xl border-2 p-4 flex items-center gap-3 text-left
                          cursor-pointer transition-all duration-200
                          ${opt.color}
                          ${
                            isSelected
                              ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.02] shadow-sm'
                              : 'border-transparent hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                      >
                        {opt.icon && (
                          <span className="text-xl flex-shrink-0">
                            {opt.icon}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-700 flex-1">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="text-[#7C3AED] text-xs font-semibold">
                            &#10003;
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text input */}
              {q.question_type === 'text' && (
                <div className="mt-3">
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={
                      t('quest_type_answer') || 'Type your answer...'
                    }
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors resize-none"
                  />
                </div>
              )}

              {/* Number input */}
              {q.question_type === 'number' && (
                <div className="mt-3">
                  <input
                    type="number"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={
                      t('quest_enter_number') || 'Enter a number...'
                    }
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors"
                  />
                </div>
              )}

              {/* Date input */}
              {q.question_type === 'date' && (
                <div className="mt-3">
                  <input
                    type="date"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors"
                  />
                </div>
              )}
            </div>

            {/* ─── Footer: Save & Navigation ─── */}
            <div className="border-t border-gray-100 px-6 py-4">
              {/* Save & Resume */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <Bookmark className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {t('quest_save_resume')}
                </span>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={stepHistory.length <= 1}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('quest_back')}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    !selectedValue ||
                    (Array.isArray(selectedValue) &&
                      selectedValue.length === 0) ||
                    submitting
                  }
                  className="flex items-center gap-1 px-6 py-2.5 rounded-full bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting
                    ? t('quest_submitting') || 'Submitting...'
                    : currentStep >= totalSteps - 1 ||
                        (usingMockData && q.defaultNext === 'complete')
                      ? t('quest_finish') || 'Finish'
                      : t('quest_next')}
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
