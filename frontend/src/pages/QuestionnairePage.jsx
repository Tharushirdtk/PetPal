import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { useConsultation } from '../context/ConsultationContext';
import { getActiveQuestionnaire, submitResponse } from '../api/questionnaire';
import EmergencyBanner from '../components/EmergencyBanner';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── Color palette for option cards ── */
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

/* ── Map API question format to rendering format ── */
const mapApiQuestion = (apiQ, index) => ({
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

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showEmergency, setShowEmergency] = useState(false);

  /* History stack so "Back" can retrace the exact path taken */
  const [stepHistory, setStepHistory] = useState([0]);

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
        setQuestionnaireId(data.questionnaire?.id);
        const mapped = (data.questions || []).map(mapApiQuestion);
        setQuestions(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err?.error || err?.message || JSON.stringify(err) || 'Failed to load questionnaire.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchQuestionnaire();
    return () => { cancelled = true; };
  }, []);

  /* ── Evaluate visibility rules to determine next visible question ── */
  const isQuestionVisible = (question) => {
    if (!question.visibility_rules || question.visibility_rules.length === 0) return true;
    return question.visibility_rules.every((rule) => {
      const answerVal = answers[rule.depends_on_question_id];
      if (rule.operator === 'equals') return answerVal === rule.value;
      if (rule.operator === 'not_equals') return answerVal !== rule.value;
      if (rule.operator === 'in') return Array.isArray(rule.value) ? rule.value.includes(answerVal) : false;
      return true;
    });
  };

  const q = questions[currentStep];
  const totalSteps = questions.length;
  const progress = totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

  /* ── Select an option (single/boolean) ── */
  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [q.id]: option.value }));
  };

  /* ── Handle multi-select toggle ── */
  const handleMultiToggle = (option) => {
    setAnswers((prev) => {
      const current = prev[q.id] || [];
      const idx = current.indexOf(option.value);
      const next = idx === -1 ? [...current, option.value] : current.filter((v) => v !== option.value);
      return { ...prev, [q.id]: next };
    });
  };

  /* ── Handle text / number / date input ── */
  const handleInputChange = (value) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  /* ── Next step ── */
  const handleNext = async () => {
    const selectedValue = answers[q.id];
    if (selectedValue === undefined || selectedValue === '' || (Array.isArray(selectedValue) && selectedValue.length === 0)) return;

    /* Check if this is the last question */
    let nextIndex = currentStep + 1;
    /* Skip questions that are not visible */
    while (nextIndex < questions.length && !isQuestionVisible(questions[nextIndex])) {
      nextIndex++;
    }

    if (nextIndex >= questions.length) {
      /* All questions answered — submit */
      await handleSubmit();
      return;
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
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        question_id: questionId,
        value: Array.isArray(value) ? value : String(value),
      }));
      await submitResponse({
        questionnaire_id: questionnaireId,
        consultation_id: consultationId,
        answers: formattedAnswers,
      });
      navigate('/chat');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit questionnaire.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedValue = q ? answers[q.id] : undefined;

  return (
    <div className="min-h-screen bg-gray-900/95 flex items-center justify-center px-4 py-8">
      {/* Emergency Banner */}
      {showEmergency && <EmergencyBanner />}

      {/* Loading state */}
      {loading && <LoadingSpinner />}

      {/* Error state */}
      {!loading && error && (
        <div className="w-full max-w-lg mx-auto">
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* No questions loaded */}
      {!loading && !error && questions.length === 0 && (
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center">
          <p className="text-gray-500">{t('quest_no_questions') || 'No questionnaire available at this time.'}</p>
        </div>
      )}

      {/* Card */}
      {!loading && !error && q && (
      <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-0 overflow-hidden">
        {/* ─── 1. Question Header ─── */}
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] py-8 px-6 text-center">
          <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
            {q.text}
          </p>
        </div>

        {/* ─── 2. Question Body ─── */}
        <div className="p-6">
          {/* Single / Boolean / Image — option grid */}
          {['single', 'boolean', 'image'].includes(q.question_type) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {q.options.map((opt) => {
              const isSelected = selectedValue === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`
                    rounded-2xl border-2 p-4 flex flex-col items-center gap-2
                    cursor-pointer transition-all ${opt.color}
                    ${
                      isSelected
                        ? 'border-[#7C3AED] ring-2 ring-[#7C3AED] scale-105'
                        : 'border-transparent hover:scale-102'
                    }
                  `}
                >
                  {opt.icon && <span className="text-2xl">{opt.icon}</span>}
                  <span className="text-sm font-medium text-center">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          )}

          {/* Multi-select — option grid with checkboxes */}
          {q.question_type === 'multi' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {q.options.map((opt) => {
              const currentArr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
              const isSelected = currentArr.includes(opt.value);

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleMultiToggle(opt)}
                  className={`
                    rounded-2xl border-2 p-4 flex flex-col items-center gap-2
                    cursor-pointer transition-all ${opt.color}
                    ${
                      isSelected
                        ? 'border-[#7C3AED] ring-2 ring-[#7C3AED] scale-105'
                        : 'border-transparent hover:scale-102'
                    }
                  `}
                >
                  {opt.icon && <span className="text-2xl">{opt.icon}</span>}
                  <span className="text-sm font-medium text-center">
                    {opt.label}
                  </span>
                  {isSelected && <span className="text-[#7C3AED] text-xs font-semibold">&#10003; Selected</span>}
                </button>
              );
            })}
          </div>
          )}

          {/* Text input */}
          {q.question_type === 'text' && (
          <div>
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={t('quest_type_answer') || 'Type your answer...'}
              rows={4}
              className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors resize-none"
            />
          </div>
          )}

          {/* Number input */}
          {q.question_type === 'number' && (
          <div>
            <input
              type="number"
              value={answers[q.id] || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={t('quest_enter_number') || 'Enter a number...'}
              className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>
          )}

          {/* Date input */}
          {q.question_type === 'date' && (
          <div>
            <input
              type="date"
              value={answers[q.id] || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>
          )}

          {/* ─── 3. Save & Resume Link ─── */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <Bookmark className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{t('quest_save_resume')}</span>
          </div>
        </div>

        {/* ─── 4. Bottom Bar ─── */}
        <div className="border-t border-gray-200 p-4">
          {/* Top row — step counter + percentage */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 tracking-wide">
              {t('quest_step')} {currentStep + 1} {t('quest_of')} {totalSteps}
            </span>
            <span className="text-xs font-semibold text-[#7C3AED]">
              {progress}% {t('quest_complete')}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-gray-100 mb-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Bottom row — Back / Next buttons */}
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
              disabled={!selectedValue || (Array.isArray(selectedValue) && selectedValue.length === 0) || submitting}
              className="flex items-center gap-1 px-5 py-2 rounded-full bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (t('quest_submitting') || 'Submitting...') : t('quest_next')}
              {!submitting && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default QuestionnairePage;
