import { useState, useEffect } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { getQuestions, createVisibilityRule, deleteVisibilityRule } from '../../api/admin';

const RulesTab = () => {
  const { t } = useLang();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  // Create form state
  const [newRule, setNewRule] = useState({
    target_type: 'question',
    target_id: '',
    condition_json: '{\n  "==": [{"var": "answers.q_code"}, "value"]\n}',
    priority: 100,
  });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getQuestions();
      setQuestions(res.data.questions || []);
    } catch (err) {
      setError(err.error || t('admin_error_load_rules'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Extract all rules from questions
  const allRules = questions.flatMap((q) =>
    (q.visibility_rules || []).map((r) => ({
      ...r,
      questionCode: q.code,
      questionText: q.text,
      questionId: q.id,
    }))
  );

  const filteredRules = allRules.filter((r) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return r.questionCode?.toLowerCase().includes(s) || r.questionText?.toLowerCase().includes(s);
  });

  const handleCreate = async () => {
    try {
      setCreating(true);
      let parsed;
      try {
        parsed = JSON.parse(newRule.condition_json);
      } catch {
        showToast(t('admin_invalid_json'), 'error');
        return;
      }
      await createVisibilityRule({
        target_type: newRule.target_type,
        target_id: parseInt(newRule.target_id),
        condition_json: parsed,
        priority: parseInt(newRule.priority),
      });
      showToast(t('admin_rule_created'));
      setShowCreate(false);
      setNewRule({ target_type: 'question', target_id: '', condition_json: '{\n  "==": [{"var": "answers.q_code"}, "value"]\n}', priority: 100 });
      fetchData();
    } catch (err) {
      showToast(err.error || t('admin_error_create_rule'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await deleteVisibilityRule(ruleId);
      showToast(t('admin_rule_deleted'));
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      showToast(err.error || t('admin_error_delete_rule'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-4 animate-pulse">
            <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-16 w-full bg-gray-200 rounded" />
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
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('admin_visibility_rules')}</h2>
          <p className="text-sm text-gray-500">{allRules.length} {t('admin_rules_total')}</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-[#7C3AED] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#6D28D9] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('admin_create_rule')}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border-2 border-[#7C3AED]/20 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">{t('admin_new_rule')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin_target_type')}</label>
              <select
                value={newRule.target_type}
                onChange={(e) => setNewRule((p) => ({ ...p, target_type: e.target.value }))}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white"
              >
                <option value="question">{t('admin_target_type_question')}</option>
                <option value="option">{t('admin_target_type_option')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin_target_question')}</label>
              <select
                value={newRule.target_id}
                onChange={(e) => setNewRule((p) => ({ ...p, target_id: e.target.value }))}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white"
              >
                <option value="">{t('admin_select_target')}</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>{q.code} - {q.text?.substring(0, 40)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin_rule_priority')}</label>
              <input
                type="number"
                value={newRule.priority}
                onChange={(e) => setNewRule((p) => ({ ...p, priority: e.target.value }))}
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin_condition_json')}</label>
            <textarea
              value={newRule.condition_json}
              onChange={(e) => setNewRule((p) => ({ ...p, condition_json: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-mono outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 rounded-xl border border-[#E5E7EB] hover:bg-gray-50 cursor-pointer transition-colors">
              {t('admin_cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !newRule.target_id}
              className="px-4 py-2 text-sm text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-sm cursor-pointer transition-colors disabled:opacity-50"
            >
              {creating ? t('admin_saving') : t('admin_create_rule')}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('admin_search_rules')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 rounded-xl border border-[#E5E7EB] px-3 py-2.5 pl-10 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all"
        />
      </div>

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
          <GitBranch className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('admin_no_rules')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <GitBranch className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                    <span className="font-mono text-xs text-purple-600">{rule.questionCode}</span>
                    <span className="text-xs text-gray-400">-</span>
                    <span className="text-sm text-gray-700 truncate">{rule.questionText}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {t('admin_rule_priority')}: {rule.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rule.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {rule.active ? t('admin_active') : t('admin_inactive')}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 overflow-x-auto border border-[#E5E7EB]">
                    {typeof rule.condition_json === 'string'
                      ? (() => { try { return JSON.stringify(JSON.parse(rule.condition_json), null, 2); } catch { return rule.condition_json; } })()
                      : JSON.stringify(rule.condition_json, null, 2)
                    }
                  </pre>
                </div>
                <button
                  onClick={() => setDeleteConfirm(rule)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">{t('admin_delete_rule')}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">{t('admin_delete_rule_msg')}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 rounded-xl border border-[#E5E7EB] hover:bg-gray-50 cursor-pointer transition-colors">
                {t('admin_cancel')}
              </button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl cursor-pointer transition-colors">
                {t('admin_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesTab;
