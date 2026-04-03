import { useState, useEffect, lazy, Suspense } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Pencil,
  Search,
  AlertTriangle,
  Workflow,
  List,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import {
  getQuestions,
  createVisibilityRule,
  updateVisibilityRule,
  deleteVisibilityRule,
} from '../../api/admin';
import RuleBuilder from '../../components/admin/RuleBuilder';
import ConditionPills from '../../components/admin/ConditionPills';

const RuleFlowMap = lazy(() => import('../../components/admin/RuleFlowMap'));

const RulesTab = () => {
  const { t } = useLang();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Sub-tabs: 'builder' | 'flow'
  const [activeSubTab, setActiveSubTab] = useState('builder');

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

  useEffect(() => {
    fetchData();
  }, []);

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
      target_type: 'question',
      target_id: q.id,
    }))
  );

  const filteredRules = allRules.filter((r) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    return (
      r.questionCode?.toLowerCase().includes(s) ||
      r.questionText?.toLowerCase().includes(s)
    );
  });

  const handleCreate = () => {
    setEditingRule(null);
    setShowBuilder(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleSave = async (data) => {
    try {
      setSaving(true);
      if (editingRule) {
        await updateVisibilityRule(editingRule.id, {
          condition_json: data.condition_json,
          priority: data.priority,
          active: data.active,
        });
        showToast(t('admin_rule_updated') || 'Rule updated successfully!');
      } else {
        await createVisibilityRule(data);
        showToast(t('admin_rule_created'));
      }
      setShowBuilder(false);
      setEditingRule(null);
      fetchData();
    } catch (err) {
      showToast(err.error || t('admin_error_create_rule'), 'error');
    } finally {
      setSaving(false);
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

  const handleCancelBuilder = () => {
    setShowBuilder(false);
    setEditingRule(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('admin_visibility_rules')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {allRules.length} {t('admin_rules_total')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sub-tab toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveSubTab('builder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'builder'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              {t('admin_rule_tab_builder') || 'Builder'}
            </button>
            <button
              onClick={() => setActiveSubTab('flow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'flow'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Workflow className="w-4 h-4" />
              {t('admin_rule_tab_flow') || 'Flow Map'}
            </button>
          </div>
          {activeSubTab === 'builder' && (
            <button
              onClick={handleCreate}
              className="bg-[#7C3AED] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#6D28D9] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t('admin_create_rule')}
            </button>
          )}
        </div>
      </div>

      {/* Builder sub-tab */}
      {activeSubTab === 'builder' && (
        <>
          {/* RuleBuilder panel */}
          {showBuilder && (
            <RuleBuilder
              questions={questions}
              rule={editingRule}
              onSave={handleSave}
              onCancel={handleCancelBuilder}
              saving={saving}
            />
          )}

          {/* Search */}
          {!showBuilder && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t('admin_search_rules')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-3 py-2.5 pl-10 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {/* Rules List */}
          {!showBuilder && (
            <>
              {filteredRules.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-12 text-center">
                  <GitBranch className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {t('admin_no_rules')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Question info */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <GitBranch className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                            <span className="font-mono text-xs text-purple-600 dark:text-purple-400">
                              {rule.questionCode}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              —
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {rule.questionText}
                            </span>
                          </div>

                          {/* Status badges */}
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                              {t('admin_rule_priority')}: {rule.priority}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                rule.active
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                  : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                              }`}
                            >
                              {rule.active
                                ? t('admin_active')
                                : t('admin_inactive')}
                            </span>
                          </div>

                          {/* Human-readable condition pills */}
                          <ConditionPills conditionJson={rule.condition_json} />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(rule)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Flow Map sub-tab */}
      {activeSubTab === 'flow' && (
        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('common_loading') || 'Loading...'}
              </p>
            </div>
          }
        >
          <RuleFlowMap
            questions={questions}
            allRules={allRules}
            onEditRule={handleEdit}
            onRefresh={fetchData}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('admin_delete_rule')}
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {t('admin_delete_rule_msg')}
            </p>
            <div className="mb-5">
              <ConditionPills conditionJson={deleteConfirm.condition_json} />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 rounded-xl border border-[#E5E7EB] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                {t('admin_cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl cursor-pointer transition-colors"
              >
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
