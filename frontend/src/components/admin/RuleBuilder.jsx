import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Code,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import {
  conditionToText,
  parseConditionToRows,
  buildConditionFromRows,
} from '../../utils/conditionToText';

const OPERATORS = [
  { value: '==', label: 'equals' },
  { value: '!=', label: 'does not equal' },
  { value: '>', label: 'is greater than' },
  { value: '<', label: 'is less than' },
  { value: '>=', label: 'is at least' },
  { value: '<=', label: 'is at most' },
  { value: 'in', label: 'is in' },
];

const SOURCES = [
  { value: 'answers', label: 'Previous answer' },
  { value: 'pet', label: 'Pet property' },
  { value: 'image_analysis', label: 'Image analysis' },
];

const PET_FIELDS = [
  { value: 'species', label: 'Species' },
  { value: 'breed', label: 'Breed' },
  { value: 'age', label: 'Age' },
  { value: 'weight', label: 'Weight' },
  { value: 'gender', label: 'Gender' },
  { value: 'name', label: 'Name' },
];

const EMPTY_CONDITION = { source: 'answers', field: '', operator: '==', value: '' };

const RuleBuilder = ({ questions, rule, onSave, onCancel, saving }) => {
  const { t } = useLang();

  // Step state: 0 = Target, 1 = Conditions, 2 = Review
  const [step, setStep] = useState(0);

  // Target state
  const [targetType, setTargetType] = useState('question');
  const [targetId, setTargetId] = useState('');
  const [priority, setPriority] = useState(100);
  const [active, setActive] = useState(true);

  // Conditions state
  const [logic, setLogic] = useState('and');
  const [conditions, setConditions] = useState([{ ...EMPTY_CONDITION }]);

  // Advanced mode (for unparseable rules)
  const [advancedMode, setAdvancedMode] = useState(false);
  const [advancedJson, setAdvancedJson] = useState('');

  // JSON preview toggle
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Initialize form when editing an existing rule
  useEffect(() => {
    if (rule) {
      setTargetType(rule.target_type || 'question');
      setTargetId(String(rule.target_id || rule.questionId || ''));
      setPriority(rule.priority ?? 100);
      setActive(rule.active !== undefined ? !!rule.active : true);

      const parsed = parseConditionToRows(rule.condition_json);
      if (parsed) {
        setLogic(parsed.logic);
        setConditions(parsed.conditions);
        setAdvancedMode(false);
      } else {
        // Unparseable — open in advanced mode
        setAdvancedMode(true);
        const cj =
          typeof rule.condition_json === 'string'
            ? rule.condition_json
            : JSON.stringify(rule.condition_json, null, 2);
        setAdvancedJson(cj);
      }
    }
  }, [rule]);

  // Question codes for the "Previous answer" field dropdown
  const questionOptions = useMemo(
    () => questions.map((q) => ({ value: q.code, label: `${q.code} — ${q.text?.substring(0, 40)}` })),
    [questions]
  );

  // Get option values for a selected question code (for the value dropdown)
  const getOptionsForCode = (code) => {
    const q = questions.find((q) => q.code === code);
    return q?.options || [];
  };

  const updateCondition = (index, key, value) => {
    setConditions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      // Reset downstream fields when source changes
      if (key === 'source') {
        next[index].field = '';
        next[index].value = '';
      }
      if (key === 'field') {
        next[index].value = '';
      }
      return next;
    });
  };

  const addCondition = () => {
    setConditions((prev) => [...prev, { ...EMPTY_CONDITION }]);
  };

  const removeCondition = (index) => {
    if (conditions.length <= 1) return;
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  // Build the final JSON Logic
  const builtCondition = useMemo(() => {
    if (advancedMode) {
      try {
        return JSON.parse(advancedJson);
      } catch {
        return null;
      }
    }
    return buildConditionFromRows(logic, conditions);
  }, [advancedMode, advancedJson, logic, conditions]);

  const summaryText = useMemo(() => {
    if (!builtCondition) return 'No valid condition defined';
    return conditionToText(builtCondition);
  }, [builtCondition]);

  const canProceedStep0 = targetId !== '';
  const canProceedStep1 = builtCondition !== null;

  const handleSave = () => {
    if (!builtCondition || !targetId) return;
    onSave({
      target_type: targetType,
      target_id: parseInt(targetId),
      condition_json: builtCondition,
      priority: parseInt(priority) || 100,
      active,
    });
  };

  // Step indicators
  const steps = [
    { label: t('admin_rule_step_target') || 'Select Target', num: 1 },
    { label: t('admin_rule_step_conditions') || 'Set Conditions', num: 2 },
    { label: t('admin_rule_step_review') || 'Review & Save', num: 3 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-[#7C3AED]/20 shadow-sm overflow-hidden">
      {/* Step Indicator */}
      <div className="flex items-center border-b border-[#E5E7EB] dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-800/50">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-2" />}
            <button
              onClick={() => {
                if (i < step) setStep(i);
                else if (i === 1 && canProceedStep0) setStep(i);
                else if (i === 2 && canProceedStep0 && canProceedStep1) setStep(i);
              }}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                step === i
                  ? 'bg-[#7C3AED] text-white'
                  : step > i
                  ? 'text-[#7C3AED] bg-purple-50 dark:bg-purple-900/20'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i ? 'bg-[#7C3AED] text-white' : step === i ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {step > i ? <Check className="w-3 h-3" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="p-5">
        {/* STEP 0: Target */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {t('admin_rule_step_target_desc') || 'What should this rule control?'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('admin_target_type')}
                </label>
                <select
                  value={targetType}
                  onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="question">{t('admin_target_type_question')}</option>
                  <option value="option">{t('admin_target_type_option')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('admin_target_question')}
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">{t('admin_select_target')}</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.code} — {q.text?.substring(0, 50)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('admin_rule_priority')}
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-600 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] bg-white dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setActive((a) => !a)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      active ? 'bg-[#7C3AED]' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      active ? 'translate-x-[18px]' : 'translate-x-0.5'
                    }`} />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {active ? (t('admin_active') || 'Active') : (t('admin_inactive') || 'Inactive')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Conditions */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('admin_rule_step_conditions_desc') || 'When should this rule apply?'}
              </h3>
              <button
                onClick={() => setAdvancedMode((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#7C3AED] transition-colors cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                {advancedMode
                  ? (t('admin_rule_visual_mode') || 'Visual mode')
                  : (t('admin_rule_advanced_mode') || 'Advanced mode')}
              </button>
            </div>

            {advancedMode ? (
              /* Advanced mode: raw JSON editor */
              <div className="space-y-2">
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  {t('admin_rule_advanced_warning') || 'Advanced mode: Edit the JSON Logic condition directly. Use with caution.'}
                </p>
                <textarea
                  value={advancedJson}
                  onChange={(e) => setAdvancedJson(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-600 px-3 py-2 text-sm font-mono outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all resize-none bg-white dark:bg-gray-700 dark:text-white"
                  placeholder='{"==": [{"var": "answers.q_code"}, "value"]}'
                />
                {advancedJson && (() => {
                  try { JSON.parse(advancedJson); return null; } catch {
                    return <p className="text-xs text-red-500">{t('admin_invalid_json')}</p>;
                  }
                })()}
              </div>
            ) : (
              /* Visual mode: condition rows */
              <div className="space-y-3">
                {/* Logic toggle */}
                {conditions.length > 1 && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t('admin_rule_logic_label') || 'Match'}:
                    </span>
                    <div className="flex bg-white dark:bg-gray-700 rounded-lg border border-[#E5E7EB] dark:border-gray-600 overflow-hidden">
                      <button
                        onClick={() => setLogic('and')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          logic === 'and'
                            ? 'bg-[#7C3AED] text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        ALL conditions (AND)
                      </button>
                      <button
                        onClick={() => setLogic('or')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          logic === 'or'
                            ? 'bg-[#7C3AED] text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        ANY condition (OR)
                      </button>
                    </div>
                  </div>
                )}

                {/* Condition rows */}
                {conditions.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                      {/* Source */}
                      <select
                        value={cond.source}
                        onChange={(e) => updateCondition(i, 'source', e.target.value)}
                        className="rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        {SOURCES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>

                      {/* Field */}
                      {cond.source === 'answers' ? (
                        <select
                          value={cond.field}
                          onChange={(e) => updateCondition(i, 'field', e.target.value)}
                          className="rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          <option value="">Select question...</option>
                          {questionOptions.map((q) => (
                            <option key={q.value} value={q.value}>{q.label}</option>
                          ))}
                        </select>
                      ) : cond.source === 'pet' ? (
                        <select
                          value={cond.field}
                          onChange={(e) => updateCondition(i, 'field', e.target.value)}
                          className="rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          <option value="">Select field...</option>
                          {PET_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={cond.field}
                          onChange={(e) => updateCondition(i, 'field', e.target.value)}
                          placeholder="Field name..."
                          className="rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] bg-white dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      )}

                      {/* Operator */}
                      <select
                        value={cond.operator}
                        onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                        className="rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      {/* Value — dropdown if source is answers and the field has predefined options */}
                      {cond.source === 'answers' && cond.field && getOptionsForCode(cond.field).length > 0 ? (
                        <select
                          value={cond.value}
                          onChange={(e) => updateCondition(i, 'value', e.target.value)}
                          className="rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] cursor-pointer bg-white dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          <option value="">Select value...</option>
                          {getOptionsForCode(cond.field).map((opt) => (
                            <option key={opt.value_key} value={opt.value_key}>
                              {opt.label} ({opt.value_key})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={cond.value}
                          onChange={(e) => updateCondition(i, 'value', e.target.value)}
                          placeholder="Value..."
                          className="rounded-lg border border-[#E5E7EB] dark:border-gray-600 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] bg-white dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeCondition(i)}
                      disabled={conditions.length <= 1}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addCondition}
                  className="flex items-center gap-1.5 text-sm text-[#7C3AED] hover:text-[#6D28D9] font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {t('admin_rule_add_condition') || 'Add condition'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {t('admin_rule_step_review_desc') || 'Review your rule before saving'}
            </h3>

            {/* Summary card */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-[#7C3AED]/20 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-[#7C3AED] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium">
                    {targetType === 'question' ? 'Show' : 'Show option on'}{' '}
                  </span>
                  <span className="font-mono text-[#7C3AED] text-xs bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {questions.find((q) => String(q.id) === String(targetId))?.code || targetId}
                  </span>
                  <span className="font-medium"> when </span>
                  <span className="text-gray-600 dark:text-gray-300">{summaryText}</span>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {t('admin_rule_priority')}: {priority}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  active
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                }`}>
                  {active ? (t('admin_active') || 'Active') : (t('admin_inactive') || 'Inactive')}
                </span>
              </div>
            </div>

            {/* JSON Preview (collapsible) */}
            <div className="border border-[#E5E7EB] dark:border-gray-600 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowJsonPreview((v) => !v)}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  {t('admin_rule_json_preview') || 'JSON Logic Preview'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showJsonPreview ? 'rotate-180' : ''}`} />
              </button>
              {showJsonPreview && (
                <pre className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-[#E5E7EB] dark:border-gray-600 overflow-x-auto font-mono">
                  {builtCondition ? JSON.stringify(builtCondition, null, 2) : 'Invalid condition'}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5E7EB] dark:border-gray-700">
          <div>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 rounded-xl border border-[#E5E7EB] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('common_back') || 'Back'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 rounded-xl border border-[#E5E7EB] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              {t('admin_cancel')}
            </button>
            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common_next') || 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || !builtCondition}
                className="flex items-center gap-1.5 px-5 py-2 text-sm text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {saving ? (t('admin_saving') || 'Saving...') : (rule ? (t('admin_rule_update') || 'Update Rule') : (t('admin_create_rule') || 'Create Rule'))}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleBuilder;
