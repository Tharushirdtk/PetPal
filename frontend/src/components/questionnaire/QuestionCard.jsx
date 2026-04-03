import { Dog, Cat } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';

/* ── SD1 symptom icons ── */
const SD1_ICONS = {
  skin: '\uD83D\uDC3E', vomiting: '\uD83E\uDD2E', diarrhea: '\uD83D\uDCA9', coughing: '\uD83E\uDEC1',
  injury: '\uD83E\uDE79', appetite_loss: '\uD83C\uDF7D\uFE0F', other: '\u2753',
};

const getOptionBg = (color) => {
  if (!color) return 'bg-gray-50';
  return color.split(' ').filter((c) => c.startsWith('bg-')).join(' ') || 'bg-gray-50';
};

/* ── P1 pet type: special lucide icon buttons ── */
const PetTypeCard = ({ answers, onAnswer }) => {
  const { t } = useLang();

  return (
    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
      <button
        type="button"
        onClick={() => onAnswer('P1', 'dog')}
        className={`rounded-2xl border-2 p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200
          bg-orange-50
          ${answers.P1 === 'dog'
            ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.03] shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
      >
        <Dog className="w-12 h-12 text-orange-500" />
        <span className="text-base font-semibold text-gray-700">{t('quest_pet_type_dog') || 'Dog'}</span>
      </button>
      <button
        type="button"
        onClick={() => onAnswer('P1', 'cat')}
        className={`rounded-2xl border-2 p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200
          bg-purple-50
          ${answers.P1 === 'cat'
            ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.03] shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
      >
        <Cat className="w-12 h-12 text-purple-500" />
        <span className="text-base font-semibold text-gray-700">{t('quest_pet_type_cat') || 'Cat'}</span>
      </button>
    </div>
  );
};

/* ── Single-select option grid ── */
const SingleSelectGrid = ({ question, answers, onAnswer }) => {
  const isSD1 = question.code === 'SD1';
  const val = answers[question.code];

  return (
    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
      {question.options.map((opt) => {
        const icon = isSD1 ? (SD1_ICONS[opt.value] || opt.icon || '') : (opt.icon || '');
        const isSelected = val === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAnswer(question.code, opt.value)}
            className={`rounded-2xl border-2 p-4 flex items-center gap-3 text-left cursor-pointer transition-all duration-200
              ${getOptionBg(opt.color)}
              ${isSelected
                ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.03] shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
          >
            {icon && <span className={isSD1 ? 'text-3xl flex-shrink-0' : 'text-xl flex-shrink-0'}>{icon}</span>}
            <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ── Multi-select option grid (toggle multiple) ── */
const MultiSelectGrid = ({ question, answers, onAnswer }) => {
  const selected = Array.isArray(answers[question.code]) ? answers[question.code] : [];

  const toggle = (value) => {
    const updated = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onAnswer(question.code, updated);
  };

  return (
    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
      {question.options.map((opt) => {
        const icon = opt.icon || '';
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-2xl border-2 p-4 flex items-center gap-3 text-left cursor-pointer transition-all duration-200
              ${getOptionBg(opt.color)}
              ${isSelected
                ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.03] shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
          >
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              isSelected ? 'bg-[#7C3AED] border-[#7C3AED]' : 'border-gray-300'
            }`}>
              {isSelected && <span className="text-white text-xs font-bold">&#10003;</span>}
            </span>
            {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
            <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ── Age input (P2): Years (typable) + Months (dropdown) + Days (dropdown) ── */
const AgeInput = ({ answers, onAnswer, t }) => {
  const val = (typeof answers.P2 === 'object' && answers.P2) || { years: '', months: '', days: '' };

  const update = (field, fieldVal) => {
    onAnswer('P2', { ...val, [field]: fieldVal });
  };

  const selectClass =
    'w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors bg-white cursor-pointer';

  return (
    <div className="max-w-sm mx-auto space-y-4">
      {/* Years */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 text-left">
          {t('quest_age_years') || 'Years'}
        </label>
        <input
          type="number"
          min="0"
          max="30"
          value={val.years}
          onChange={(e) => update('years', e.target.value)}
          placeholder="0"
          autoFocus
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-[#7C3AED] transition-colors bg-white"
        />
      </div>

      {/* Months */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 text-left">
          {t('quest_age_months') || 'Months'}
        </label>
        <select
          value={val.months}
          onChange={(e) => update('months', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('quest_age_select') || 'Select...'}</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={String(i)}>{i}</option>
          ))}
          <option value="not_sure">{t('quest_not_sure') || 'Not sure'}</option>
        </select>
      </div>

      {/* Days */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 text-left">
          {t('quest_age_days') || 'Days'}
        </label>
        <select
          value={val.days}
          onChange={(e) => update('days', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('quest_age_select') || 'Select...'}</option>
          {Array.from({ length: 30 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
          ))}
          <option value="not_sure">{t('quest_not_sure') || 'Not sure'}</option>
        </select>
      </div>

      <p className="text-xs text-gray-400 text-center pt-1">
        {t('quest_age_hint') || 'Only years is required — months and days are optional'}
      </p>
    </div>
  );
};

/* ── Number input (generic, non-P2) ── */
const NumberInput = ({ question, answers, onAnswer, t }) => (
  <div className="max-w-xs mx-auto">
    <input
      type="number"
      min="0"
      max="30"
      value={answers[question.code] || ''}
      onChange={(e) => onAnswer(question.code, e.target.value)}
      placeholder={t('quest_enter_number') || 'Enter a number...'}
      autoFocus
      className="w-full border-2 border-gray-200 rounded-2xl p-4 text-center text-2xl font-bold text-gray-900 outline-none focus:border-[#7C3AED] transition-colors"
    />
  </div>
);

/* ── Text input ── */
const TextInput = ({ question, answers, onAnswer, t }) => (
  <div className="max-w-md mx-auto">
    <textarea
      value={answers[question.code] || ''}
      onChange={(e) => onAnswer(question.code, e.target.value)}
      placeholder={t('quest_type_answer') || 'Type your answer...'}
      rows={4}
      autoFocus
      className="w-full border-2 border-gray-200 rounded-2xl p-4 text-base text-gray-700 outline-none focus:border-[#7C3AED] transition-colors resize-none"
    />
  </div>
);

/* ── Breed dropdown ── */
const BreedSelect = ({ breedList, petBreedId, loadingBreeds, onBreedChange, t }) => (
  <div className="max-w-sm mx-auto">
    <select
      value={petBreedId}
      onChange={(e) => onBreedChange(e.target.value)}
      disabled={loadingBreeds}
      className="w-full border-2 border-gray-200 rounded-2xl p-4 text-base text-gray-700 outline-none focus:border-[#7C3AED] transition-colors bg-white cursor-pointer"
    >
      <option value="">
        {loadingBreeds ? '...' : t('quest_pet_breed_placeholder') || 'Select breed'}
      </option>
      {breedList.map((breed) => (
        <option key={breed.id} value={breed.id}>{breed.description || breed.name}</option>
      ))}
      <option value="mixed">{t('quest_pet_breed_mixed') || 'Mixed / Unknown'}</option>
    </select>
    <p className="text-xs text-gray-400 text-center mt-3">
      {t('quest_breed_optional') || 'This is optional but helps us be more accurate'}
    </p>
  </div>
);

/* ════════════ Main QuestionCard ════════════ */
const QuestionCard = ({
  item,
  answers,
  onAnswer,
  breedList,
  petBreedId,
  loadingBreeds,
  onBreedChange,
}) => {
  const { t } = useLang();

  if (!item) return null;

  /* Breed pseudo-question */
  if (item.type === 'breed') {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">
          {t('quest_breed_question') || 'What breed is your pet?'}
        </h2>
        <BreedSelect
          breedList={breedList}
          petBreedId={petBreedId}
          loadingBreeds={loadingBreeds}
          onBreedChange={onBreedChange}
          t={t}
        />
      </div>
    );
  }

  if (item.type !== 'question' || !item.question) return null;

  const q = item.question;

  return (
    <div className="text-center">
      {/* Question text */}
      <h2 className="text-2xl font-bold text-gray-900 mb-8 font-display leading-relaxed">
        {q.code === 'P2' ? (t('quest_age_question') || 'How old is your pet?') : q.text}
      </h2>

      {/* P1: Pet Type — special icons */}
      {q.code === 'P1' && (
        <PetTypeCard answers={answers} onAnswer={onAnswer} />
      )}

      {/* Standard single/boolean select */}
      {q.code !== 'P1' && (q.question_type === 'single' || q.question_type === 'boolean') && (
        <SingleSelectGrid question={q} answers={answers} onAnswer={onAnswer} />
      )}

      {/* Multi-select */}
      {q.question_type === 'multi' && (
        <MultiSelectGrid question={q} answers={answers} onAnswer={onAnswer} />
      )}

      {/* P2: Age — special years/months/days input */}
      {q.code === 'P2' && (
        <AgeInput answers={answers} onAnswer={onAnswer} t={t} />
      )}

      {/* Number (generic, non-P2) */}
      {q.code !== 'P2' && q.question_type === 'number' && (
        <NumberInput question={q} answers={answers} onAnswer={onAnswer} t={t} />
      )}

      {/* Text */}
      {q.question_type === 'text' && (
        <TextInput question={q} answers={answers} onAnswer={onAnswer} t={t} />
      )}
    </div>
  );
};

export default QuestionCard;
