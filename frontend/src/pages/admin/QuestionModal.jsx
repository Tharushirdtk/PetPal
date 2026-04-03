import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { createQuestion, updateQuestion } from '../../api/admin';

const QUESTION_TYPES = ['single', 'multi', 'text', 'number', 'date', 'boolean', 'image'];

const QuestionModal = ({ question, onClose, onSaved }) => {
  const { t } = useLang();
  const isEdit = !!question;

  const TYPE_LABELS = {
    single: t('question_type_single'),
    multi: t('question_type_multiple'),
    text: t('question_type_text'),
    number: t('question_type_number'),
    date: t('question_type_date'),
    boolean: t('question_type_boolean'),
    image: t('question_type_image'),
  };

  const [form, setForm] = useState({
    code: question?.code || '',
    text: question?.text || '',
    question_type: question?.question_type || 'single',
    display_order: question?.display_order ?? 0,
    is_active: question?.is_active ?? true,
  });
  const [options, setOptions] = useState(
    question?.options?.map((o) => ({ value_key: o.value_key, label: o.label })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { value_key: '', label: '' }]);
  };

  const updateOption = (idx, field, value) => {
    setOptions((prev) => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const removeOption = (idx) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.text.trim()) {
      setError(t('admin_code_text_required'));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEdit) {
        await updateQuestion(question.id, {
          text: form.text,
          question_type: form.question_type,
          display_order: parseInt(form.display_order),
          is_active: form.is_active ? 1 : 0,
        });
      } else {
        const validOptions = options.filter((o) => o.value_key.trim() && o.label.trim());
        await createQuestion({
          ...form,
          display_order: parseInt(form.display_order),
          options: validOptions,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.error || t('admin_error_save_question'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? t('admin_edit_question') : t('admin_create_question')}
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin_code')}</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., q_new_question"
              disabled={isEdit}
              className={`w-full rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all font-mono ${isEdit ? 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : ''}`}
            />
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin_question_text')}</label>
            <textarea
              value={form.text}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder={t('admin_question_text_placeholder')}
              rows={3}
              className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all resize-none"
            />
          </div>

          {/* Type & Order row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin_type')}</label>
              <select
                value={form.question_type}
                onChange={(e) => handleChange('question_type', e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] transition-colors cursor-pointer bg-white dark:bg-gray-800"
              >
                {QUESTION_TYPES.map((tp) => (
                  <option key={tp} value={tp}>{TYPE_LABELS[tp] || tp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin_order')}</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => handleChange('display_order', e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin_active')}</label>
            <button
              type="button"
              onClick={() => handleChange('is_active', !form.is_active)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                form.is_active ? 'bg-[#7C3AED]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form.is_active ? 'translate-x-5.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Options (only for create or non-text types) */}
          {!isEdit && ['single', 'multi', 'boolean'].includes(form.question_type) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin_options')}</label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('admin_add_option')}
                </button>
              </div>
              {options.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">{t('admin_no_options_yet')}</p>
              ) : (
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <input
                        type="text"
                        value={opt.value_key}
                        onChange={(e) => updateOption(idx, 'value_key', e.target.value)}
                        placeholder="Key (e.g. skin)"
                        className="flex-1 rounded-lg border border-[#E5E7EB] dark:border-gray-700 px-2.5 py-2 text-sm font-mono outline-none focus:border-[#7C3AED] transition-colors"
                      />
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => updateOption(idx, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 rounded-lg border border-[#E5E7EB] dark:border-gray-700 px-2.5 py-2 text-sm outline-none focus:border-[#7C3AED] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 transition-colors cursor-pointer rounded-xl border border-[#E5E7EB] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('admin_cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors cursor-pointer rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('admin_saving')}
                </>
              ) : (
                t('admin_save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionModal;
