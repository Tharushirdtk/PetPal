import { useState, useEffect } from 'react';
import {
  FileQuestion,
  GitBranch,
  Mail,
  Users,
  Stethoscope,
  Activity,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { getStats, getContacts } from '../../api/admin';

const StatCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">{label}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </div>
);

const OverviewTab = ({ onTabChange }) => {
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [recentContacts, setRecentContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, contactsRes] = await Promise.all([
          getStats(),
          getContacts({ page: 1, limit: 5, status: 'new' }),
        ]);
        setStats(statsRes.data.stats);
        setRecentContacts(contactsRes.data.contacts || []);
      } catch (err) {
        setError(err.error || t('admin_error_load_dashboard'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-5 shadow-sm animate-pulse">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="w-12 h-8 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-red-500 hover:text-red-700 underline cursor-pointer"
        >
          {t('admin_retry') || 'Retry'}
        </button>
      </div>
    );
  }

  const cards = [
    { icon: FileQuestion, label: t('admin_total_questions'), value: stats?.questions?.total || 0, accent: 'bg-purple-100 text-[#7C3AED]', sub: `${stats?.questions?.active || 0} ${t('admin_active')}` },
    { icon: GitBranch, label: t('admin_total_rules'), value: stats?.rules?.total || 0, accent: 'bg-blue-100 text-blue-600' },
    { icon: Mail, label: t('admin_new_contacts'), value: stats?.contacts?.new || 0, accent: 'bg-orange-100 text-orange-600', sub: `${stats?.contacts?.total || 0} ${t('admin_total')}` },
    { icon: Users, label: t('admin_total_users'), value: stats?.users?.total || 0, accent: 'bg-green-100 text-green-600' },
    { icon: Stethoscope, label: t('admin_total_consultations'), value: stats?.consultations?.total || 0, accent: 'bg-indigo-100 text-indigo-600' },
    { icon: Activity, label: t('admin_total_diagnoses'), value: stats?.diagnoses?.total || 0, accent: 'bg-pink-100 text-pink-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('admin_welcome')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('admin_welcome_sub')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Recent Contacts */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('admin_recent_contacts')}</h3>
          </div>
          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {stats?.contacts?.new || 0} {t('admin_status_new')}
          </span>
        </div>
        {recentContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
            {t('admin_no_new_contacts')}
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {recentContacts.map((c) => (
              <div key={c.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.heading}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{c.message}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <h3 className="font-semibold text-sm">{t('admin_system_health')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{stats?.questions?.active || 0}</p>
              <p className="text-xs opacity-80">{t('admin_active_questions')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.contacts?.resolved || 0}</p>
              <p className="text-xs opacity-80">{t('admin_resolved_contacts')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('admin_quick_actions')}</h3>
          </div>
          <div className="space-y-2">
            <QuickAction label={t('admin_manage_questions')} onClick={() => onTabChange?.('questions')} />
            <QuickAction label={t('admin_review_contacts')} onClick={() => onTabChange?.('contacts')} />
            <QuickAction label={t('admin_view_analytics')} onClick={() => onTabChange?.('analytics')} />
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ label, onClick }) => (
  <div onClick={onClick} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
    <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-[#7C3AED] transition-colors">{label}</span>
    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#7C3AED] transition-colors" />
  </div>
);

export default OverviewTab;
