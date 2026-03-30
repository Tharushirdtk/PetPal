import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { getQuestions, deleteQuestion } from '../../api/admin';
import QuestionModal from './QuestionModal';

const TYPE_STYLES = {
  single: 'bg-blue-50 text-blue-700',
  multi: 'bg-purple-50 text-purple-700',
  text: 'bg-green-50 text-green-700',
  number: 'bg-orange-50 text-orange-700',
  date: 'bg-pink-50 text-pink-700',
  boolean: 'bg-cyan-50 text-cyan-700',
  image: 'bg-yellow-50 text-yellow-700',
};

const QuestionsTab = () => {
  const { t } = useLang();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const TYPE_LABELS = {
    single: t('question_type_single'),
    multi: t('question_type_multiple'),
    text: t('question_type_text'),
    number: t('question_type_number'),
    date: t('question_type_date'),
    boolean: t('question_type_boolean'),
    image: t('question_type_image'),
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await getQuestions();
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.error || t('admin_error_load_questions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id) => {
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, is_active: 0 } : q));
      showToast(t('admin_question_deleted'));
      setDeleteConfirm(null);
    } catch (err) {
      showToast(err.error || 'Delete failed', 'error');
    }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditingQuestion(null);
    fetchQuestions();
    showToast(editingQuestion ? t('admin_question_updated') : t('admin_question_created'));
  };

  const types = [...new Set(questions.map((q) => q.question_type))];

  const filtered = questions.filter((q) => {
    if (typeFilter !== 'all' && q.question_type !== typeFilter) return false;
    if (statusFilter === 'active' && !q.is_active) return false;
    if (statusFilter === 'inactive' && q.is_active) return false;
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      return (q.code?.toLowerCase().includes(s) || q.text?.toLowerCase().includes(s));
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-6 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
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

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('admin_questions')}</h2>
          <p className="text-sm text-gray-500">
            {filtered.length} {t('admin_of')} {questions.length} {t('admin_questions').toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => { setEditingQuestion(null); setModalOpen(true); }}
          className="bg-[#7C3AED] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#6D28D9] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('admin_create_question')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin_search_questions')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 pl-10 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] transition-colors cursor-pointer bg-white"
          >
            <option value="all">{t('admin_all_types')}</option>
            {types.map((tp) => (
              <option key={tp} value={tp}>{TYPE_LABELS[tp] || tp}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] transition-colors cursor-pointer bg-white"
          >
            <option value="all">{t('admin_all_status')}</option>
            <option value="active">{t('admin_active')}</option>
            <option value="inactive">{t('admin_inactive')}</option>
          </select>
        </div>
      </div>

      {/* Question List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <Filter className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('admin_no_questions')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => {
            const isExpanded = expandedId === q.id;
            return (
              <div key={q.id} className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                {/* Row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  <button className="text-gray-400 flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-xs text-gray-400 w-20 flex-shrink-0 truncate">{q.code}</span>
                  <p className="flex-1 text-sm text-gray-900 font-medium truncate">{q.text}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${TYPE_STYLES[q.question_type] || 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[q.question_type] || q.question_type}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                    #{q.display_order}
                  </span>
                  <span className={`flex-shrink-0 ${q.is_active ? 'text-green-500' : 'text-gray-300'}`}>
                    {q.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingQuestion(q); setModalOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(q)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Options */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('admin_options')} ({q.options?.length || 0})</h4>
                        {q.options?.length > 0 ? (
                          <div className="space-y-1">
                            {q.options.map((opt) => (
                              <div key={opt.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-[#E5E7EB] text-sm">
                                <span className="font-mono text-xs text-purple-600">{opt.value_key}</span>
                                <span className="text-gray-400">-</span>
                                <span className="text-gray-700">{opt.label}</span>
                                {!opt.is_active && (
                                  <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded ml-auto">{t('admin_inactive')}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">{t('admin_no_options')}</p>
                        )}
                      </div>

                      {/* Visibility Rules */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t('admin_visibility_rules')} ({q.visibility_rules?.length || 0})</h4>
                        {q.visibility_rules?.length > 0 ? (
                          <div className="space-y-1">
                            {q.visibility_rules.map((rule) => (
                              <div key={rule.id} className="bg-white rounded-lg px-3 py-2 border border-[#E5E7EB] text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-gray-600">{t('admin_rule_priority')}: {rule.priority}</span>
                                  <span className={`px-1.5 py-0.5 rounded ${rule.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {rule.active ? t('admin_active') : t('admin_inactive')}
                                  </span>
                                </div>
                                <pre className="text-xs text-gray-500 bg-gray-50 rounded p-2 overflow-x-auto">
                                  {typeof rule.condition_json === 'string' ? rule.condition_json : JSON.stringify(rule.condition_json, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">{t('admin_no_rules')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Question Modal */}
      {modalOpen && (
        <QuestionModal
          question={editingQuestion}
          onClose={() => { setModalOpen(false); setEditingQuestion(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin_confirm_delete')}</h3>
            <p className="text-sm text-gray-500 mb-1">{t('admin_confirm_delete_msg')}</p>
            <p className="text-sm font-medium text-gray-700 mb-5">
              <span className="font-mono text-purple-600">{deleteConfirm.code}</span> - {deleteConfirm.text}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer rounded-xl border border-[#E5E7EB] hover:bg-gray-50"
              >
                {t('admin_cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer rounded-xl shadow-sm"
              >
                {t('admin_delete_question')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsTab;
