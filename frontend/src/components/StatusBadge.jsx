import { useLang } from '../i18n/LanguageContext';

const StatusBadge = ({ status }) => {
  const { t } = useLang();

  const config = {
    healthy: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: t('common_healthy') },
    completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: t('common_completed') },
    pending: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: t('common_pending') },
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: t('common_scheduled') },
    emergency: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Emergency' },
  };

  const c = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

export default StatusBadge;
