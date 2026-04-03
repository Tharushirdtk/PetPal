import { useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { getContacts, updateContactStatus } from '../../api/admin';

const STATUS_STYLES = {
  new: 'bg-orange-100 text-orange-700',
  read: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

const ContactsTab = () => {
  const { t } = useLang();
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchContacts = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (status) params.status = status;
      const res = await getContacts(params);
      setContacts(res.data.contacts || []);
      setPagination(res.data.pagination || { page, limit: 10, total: 0 });
    } catch (err) {
      setError(err.error || t('admin_error_load_contacts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(1); }, [statusFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateContactStatus(id, newStatus);
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
      showToast(t('admin_status_updated'));
    } catch (err) {
      showToast(err.error || t('admin_error_update_contact'), 'error');
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
  const filters = [
    { key: '', label: t('admin_all') },
    { key: 'new', label: t('admin_status_new') },
    { key: 'read', label: t('admin_status_read') },
    { key: 'resolved', label: t('admin_status_resolved') },
  ];

  if (error && !loading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('admin_contact_messages')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} {t('admin_total').toLowerCase()} {t('admin_messages')}</p>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors ${
              statusFilter === f.key
                ? 'bg-[#7C3AED] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contact List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] p-4 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <Mail className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin_no_contacts')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{c.heading || t('admin_no_subject')}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                          {t(`admin_status_${c.status}`)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{c.email}</p>
                      <p className={`text-sm text-gray-600 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {c.message}
                      </p>
                      {c.message?.length > 150 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium mt-1 cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          {isExpanded ? t('admin_show_less') : t('admin_show_more')}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className="text-xs rounded-lg border border-[#E5E7EB] px-2 py-1 outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-800"
                      >
                        <option value="new">{t('admin_status_new')}</option>
                        <option value="read">{t('admin_status_read')}</option>
                        <option value="resolved">{t('admin_status_resolved')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => fetchContacts(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg border border-[#E5E7EB] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300 px-3">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => fetchContacts(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
            className="p-2 rounded-lg border border-[#E5E7EB] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactsTab;
