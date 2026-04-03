import { useLang } from '../../i18n/LanguageContext';

const ProgressBar = ({ progress, currentQuestion, totalQuestions }) => {
  const { t } = useLang();

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">
          {t('quest_question_of', { current: currentQuestion, total: totalQuestions })}
        </span>
        <span className="text-xs font-semibold text-[#7C3AED]">
          {progress}% {t('quest_complete') || 'Complete'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#7C3AED] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
