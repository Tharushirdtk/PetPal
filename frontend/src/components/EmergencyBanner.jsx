import { AlertTriangle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const EmergencyBanner = () => {
  const { t } = useLang();
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 animate-pulse" />
        <div>
          <p className="font-bold font-display text-sm sm:text-base">{t('emergency_alert')}</p>
          <p className="text-xs sm:text-sm opacity-90">{t('emergency_desc')}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="bg-white dark:bg-gray-800 text-red-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-50 transition-colors cursor-pointer">
          {t('emergency_call')}
        </button>
        <button className="border border-white text-white px-4 py-2 rounded-full text-sm hover:bg-white/10 transition-colors cursor-pointer hidden sm:block">
          {t('emergency_nearest')}
        </button>
      </div>
    </div>
  );
};

export default EmergencyBanner;
