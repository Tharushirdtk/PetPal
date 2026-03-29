import { useState, useEffect } from 'react';
import {
  BarChart3,
  Stethoscope,
  Activity,
  FileQuestion,
  Users,
  Mail,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { getStats, getQuestions } from '../../api/admin';

const AnalyticsTab = () => {
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, qRes] = await Promise.all([getStats(), getQuestions()]);
        setStats(statsRes.data.stats);
        setQuestions(qRes.data.questions || []);
      } catch (err) {
        setError(err.error || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
              <div className="w-12 h-8 bg-gray-200 rounded mb-2" />
              <div className="w-24 h-4 bg-gray-200 rounded" />
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
      </div>
    );
  }

  // Question type distribution
  const typeDistribution = {};
  questions.forEach((q) => {
    typeDistribution[q.question_type] = (typeDistribution[q.question_type] || 0) + 1;
  });
  const maxTypeCount = Math.max(...Object.values(typeDistribution), 1);

  // Contact status distribution
  const contactDist = {
    new: stats?.contacts?.new || 0,
    read: stats?.contacts?.read || 0,
    resolved: stats?.contacts?.resolved || 0,
  };
  const contactTotal = stats?.contacts?.total || 1;

  // Active vs inactive questions
  const activeQ = stats?.questions?.active || 0;
  const inactiveQ = stats?.questions?.inactive || 0;
  const totalQ = stats?.questions?.total || 1;

  const TYPE_COLORS = {
    single: 'bg-blue-500',
    multi: 'bg-purple-500',
    text: 'bg-green-500',
    number: 'bg-orange-500',
    date: 'bg-pink-500',
    boolean: 'bg-cyan-500',
    image: 'bg-yellow-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">{t('admin_analytics_title')}</h2>
        <p className="text-sm text-gray-500">{t('admin_analytics_sub')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Stethoscope} value={stats?.consultations?.total || 0} label={t('admin_total_consultations')} color="bg-indigo-100 text-indigo-600" />
        <SummaryCard icon={Activity} value={stats?.diagnoses?.total || 0} label={t('admin_total_diagnoses')} color="bg-pink-100 text-pink-600" />
        <SummaryCard icon={Users} value={stats?.users?.total || 0} label={t('admin_total_users')} color="bg-green-100 text-green-600" />
        <SummaryCard icon={FileQuestion} value={stats?.questions?.total || 0} label={t('admin_total_questions')} color="bg-purple-100 text-[#7C3AED]" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Question Type Distribution */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">{t('admin_question_types')}</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(typeDistribution).map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${TYPE_COLORS[type] || 'bg-gray-400'}`}
                    style={{ width: `${(count / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Status Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">{t('admin_contact_breakdown')}</h3>
          </div>
          <div className="space-y-4">
            <StatusBar label={t('admin_status_new')} count={contactDist.new} total={contactTotal} color="bg-orange-500" icon={AlertCircle} />
            <StatusBar label={t('admin_status_read')} count={contactDist.read} total={contactTotal} color="bg-blue-500" icon={Clock} />
            <StatusBar label={t('admin_status_resolved')} count={contactDist.resolved} total={contactTotal} color="bg-green-500" icon={CheckCircle} />
          </div>
          <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('admin_resolution_rate')}</span>
              <span className="text-lg font-bold text-green-600">
                {contactTotal > 0 ? Math.round((contactDist.resolved / contactTotal) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Health */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">{t('admin_question_health')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">{activeQ}</p>
            <p className="text-sm text-green-700 mt-1">{t('admin_active_questions')}</p>
            <div className="mt-2 h-1.5 bg-green-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(activeQ / totalQ) * 100}%` }} />
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-3xl font-bold text-red-500">{inactiveQ}</p>
            <p className="text-sm text-red-600 mt-1">{t('admin_inactive_questions')}</p>
            <div className="mt-2 h-1.5 bg-red-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${(inactiveQ / totalQ) * 100}%` }} />
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-3xl font-bold text-[#7C3AED]">{stats?.rules?.total || 0}</p>
            <p className="text-sm text-purple-700 mt-1">{t('admin_total_rules')}</p>
            <p className="text-xs text-purple-400 mt-2">
              {questions.length > 0 ? (stats?.rules?.total / questions.length).toFixed(1) : 0} {t('admin_per_question')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, value, label, color }) => (
  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </div>
);

const StatusBar = ({ label, count, total, color, icon: Icon }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{count}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
      />
    </div>
  </div>
);

export default AnalyticsTab;
