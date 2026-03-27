import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { getConsultationHistory } from '../api/consultation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const avatarColors = {
  B: 'bg-purple-500',
  L: 'bg-pink-500',
  M: 'bg-blue-500',
};

const MedicalHistory = () => {
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getConsultationHistory();
        const data = res.data;
        // Normalize: API may return array directly or inside a property
        const list = Array.isArray(data) ? data : (data.consultations || data.history || []);
        setRecords(list);
      } catch (err) {
        setError(err.error || 'Failed to load consultation history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Client-side search/filter
  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const petName = (record.pet_name || record.petName || '').toLowerCase();
    const diagnosis = (record.diagnosis || record.primary_label || '').toLowerCase();
    const clinician = (record.clinician || record.vet_name || '').toLowerCase();
    return petName.includes(q) || diagnosis.includes(q) || clinician.includes(q);
  });

  const handleViewReport = (consultationId) => {
    navigate(`/report?consultation_id=${consultationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="default" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link to="/dashboard" className="hover:text-[#7C3AED] transition-colors no-underline text-gray-500">
            {t('history_breadcrumb_dashboard')}
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900">{t('history_breadcrumb_medical')}</span>
        </nav>

        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">
              {t('history_title')}
            </h1>
            <p className="text-gray-500 mt-1">{t('history_subtitle')}</p>
          </div>
          <button className="flex items-center gap-2 bg-[#7C3AED] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-[#6D28D9] transition-all shadow-md hover:shadow-lg cursor-pointer">
            <Plus className="w-4 h-4" />
            {t('history_new_record')}
          </button>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-3 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('history_search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 pl-10 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            <SlidersHorizontal className="w-4 h-4" />
            {t('history_filter')}
          </button>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            <Download className="w-4 h-4" />
            {t('history_export')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* Table */}
        {!loading && !error && (
          <div className="mt-6 bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('history_col_pet')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('history_col_date')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('history_col_diagnosis')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('history_col_clinician')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('history_col_status')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('history_col_action')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        {searchQuery ? 'No records match your search.' : 'No consultation history found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const petName = record.pet_name || record.petName || 'Pet';
                      const petAvatar = petName.charAt(0).toUpperCase();
                      const date = record.date || record.created_at || record.consultation_date || '';
                      const diagnosis = record.diagnosis || record.primary_label || 'Pending';
                      const diagnosisSub = record.diagnosis_sub || record.diagnosisSub || record.secondary_label || '';
                      const clinician = record.clinician || record.vet_name || 'AI Diagnosis';
                      const status = record.status || 'completed';
                      const consultationId = record.consultation_id || record.id;

                      return (
                        <tr
                          key={consultationId}
                          className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          {/* PET */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full ${avatarColors[petAvatar] || 'bg-gray-400'} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}
                              >
                                {petAvatar}
                              </div>
                              <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                {petName}
                              </span>
                            </div>
                          </td>

                          {/* DATE */}
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 whitespace-nowrap">
                              {date}
                            </span>
                          </td>

                          {/* DIAGNOSIS */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {diagnosis}
                              </p>
                              {diagnosisSub && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {diagnosisSub}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* CLINICIAN */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              >
                                {clinician.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-700 whitespace-nowrap">
                                {clinician}
                              </span>
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-4">
                            <StatusBadge status={status} />
                          </td>

                          {/* ACTION */}
                          <td className="px-6 py-4">
                            <button
                              className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer whitespace-nowrap bg-transparent border-none"
                              onClick={() => handleViewReport(consultationId)}
                            >
                              {t('history_view_report')}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredRecords.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              {t('history_showing')} 1-{filteredRecords.length} {t('history_of')} {records.length} {t('history_records')}
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg border border-[#E5E7EB] bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
