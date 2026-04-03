import { useLang } from '../i18n/LanguageContext';

const LangToggle = () => {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:border-[#7C3AED] dark:hover:border-[#A78BFA] text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-all cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      title="Toggle Language"
    >
      <span className="text-base">{lang === 'en' ? '\u{1F1F1}\u{1F1F0}' : '\u{1F1EC}\u{1F1E7}'}</span>
      <span>{lang === 'en' ? '\u0DC3\u0DD2\u0D82' : 'EN'}</span>
    </button>
  );
};

export default LangToggle;
