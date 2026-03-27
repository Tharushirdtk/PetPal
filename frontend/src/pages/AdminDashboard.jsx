import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Settings,
  Plus,
  Undo,
  Redo,
  ChevronDown,
  ArrowDown,
  Play,
  RotateCcw,
  GitBranch,
  Menu,
  X,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import { mockQuestions } from '../data/mockData';

const TYPE_BADGE_STYLES = {
  yesno: 'bg-blue-50 text-blue-600',
  choice: 'bg-purple-50 text-purple-600',
  multiple: 'bg-green-50 text-green-600',
  numeric: 'bg-orange-50 text-orange-600',
};

const FILTER_KEYS = ['all', 'diet', 'behavior', 'medical'];
const FILTER_TRANSLATION_MAP = {
  all: 'admin_all',
  diet: 'admin_diet',
  behavior: 'admin_behavior',
  medical: 'admin_medical',
};

const AdminDashboard = () => {
  const { t, lang } = useLang();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeQuestion, setActiveQuestion] = useState(mockQuestions[0]);
  const [selectedSimOption, setSelectedSimOption] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const filteredQuestions = mockQuestions.filter((q) => {
    const matchesFilter = activeFilter === 'all' || q.category === activeFilter;
    const text = lang === 'si' ? q.text_si : q.text_en;
    const matchesSearch =
      !searchQuery ||
      text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getQuestionText = (q) => (lang === 'si' ? q.text_si : q.text_en);

  const simOptions = [
    { value: 'yes', label: 'Yes, everything\'s fine' },
    { value: 'no', label: 'No, eating less/nothing' },
    { value: 'more', label: 'Eating more than usual' },
    { value: 'picky', label: 'Being very picky' },
  ];

  const nextQuestionPreview = {
    text: 'How often is your pet vomiting?',
    options: ['Not at all', 'Once or twice', 'Multiple times daily'],
  };

  const activeVars = [
    { key: 'eating_normal', value: '"false"', color: 'text-red-500' },
    { key: 'vomiting_freq', value: '"none"', color: 'text-green-500' },
    { key: 'energy_level', value: '"--"', color: 'text-gray-400' },
  ];

  /* ------- Left Column ------- */
  const renderLeftColumn = () => (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] p-4 overflow-y-auto flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-gray-900 text-base">
          {t('admin_questions')}
        </h2>
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
          {mockQuestions.length} {t('admin_total')}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('admin_search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl border border-[#E5E7EB] px-3 py-2 pl-9 text-sm w-full outline-none focus:border-[#7C3AED] transition-colors"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
              activeFilter === key
                ? 'bg-[#7C3AED] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(FILTER_TRANSLATION_MAP[key])}
          </button>
        ))}
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto">
        {filteredQuestions.map((q) => {
          const isActive = activeQuestion?.id === q.id;
          return (
            <div
              key={q.id}
              onClick={() => setActiveQuestion(q)}
              className={`p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors mb-2 border ${
                isActive
                  ? 'border-r-2 border-[#7C3AED] bg-[#F5F3FF]'
                  : 'border-transparent'
              }`}
            >
              <span className="font-mono text-xs text-gray-400">{q.id}</span>
              <p className="text-sm font-medium text-gray-900 mt-1 mb-2 leading-snug">
                {getQuestionText(q)}
              </p>
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                  {q.rules} rules
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    TYPE_BADGE_STYLES[q.type] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {q.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Question button */}
      <button className="bg-gray-900 text-white rounded-full px-4 py-2 text-sm w-full mt-4 hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" />
        {t('admin_new_question')}
      </button>
    </aside>
  );

  /* ------- Center Column ------- */
  const renderCenterColumn = () => (
    <main className="flex-1 bg-[#F9FAFB] p-6 overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile hamburger toggles */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-[#7C3AED] cursor-pointer"
            aria-label="Toggle questions panel"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className="font-display font-semibold text-gray-900 text-base">
            {t('admin_flow_editor')}
          </h2>
          <span className="font-mono text-sm text-gray-500">
            {activeQuestion?.id || 'q_eating_habits'}
          </span>
          <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {t('admin_draft')}
          </span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors">
              <Undo className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors">
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-[#7C3AED] cursor-pointer"
            aria-label="Toggle simulation panel"
          >
            <Play className="w-5 h-5" />
          </button>
          <button className="bg-[#7C3AED] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#6D28D9] transition-colors cursor-pointer">
            {t('admin_save_logic')}
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className="mt-6 bg-white rounded-2xl border border-[#E5E7EB] p-8 min-h-[400px]"
        style={{
          backgroundImage: 'radial-gradient(circle, #E5E7EB 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Entry node */}
        <div className="flex flex-col items-center">
          <div className="bg-gray-900 text-white rounded-full px-4 py-2 text-sm inline-flex items-center gap-2">
            <Play className="w-4 h-4" />
            {t('admin_entry')} {activeQuestion?.id || 'q_eating_habits'}
          </div>

          {/* Vertical line */}
          <div className="w-0.5 h-8 bg-gray-300 mx-auto" />

          {/* Conditional branch card */}
          <div className="bg-white rounded-2xl border-2 border-[#E5E7EB] p-4 max-w-md w-full shadow-sm">
            {/* Card header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-display font-semibold text-gray-900 text-sm">
                  {t('admin_conditional')} 01
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table header */}
            <div className="flex items-center gap-3 mb-2 text-xs text-gray-400 font-semibold">
              <span className="flex-1">{t('admin_if_answer')}</span>
              <span className="w-6 text-center">&rarr;</span>
              <span className="flex-1">{t('admin_then_action')}</span>
            </div>

            {/* Logic row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm border border-[#E5E7EB] cursor-pointer">
                <span className="text-gray-700">FALSE (No)</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="w-6 text-center text-gray-400">&rarr;</span>
              <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm border border-[#E5E7EB] cursor-pointer">
                <span className="text-gray-700">{t('admin_go_to')} Q2</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            {/* Add logic rule */}
            <button className="w-full border-2 border-dashed border-[#7C3AED]/40 text-[#7C3AED] rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#F5F3FF] transition-colors cursor-pointer mb-4">
              {t('admin_add_logic')}
            </button>

            {/* Separator */}
            <div className="border-t border-[#E5E7EB] my-3" />

            {/* Default route */}
            <div className="mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                {t('admin_default_route')}
              </span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm border border-[#E5E7EB] cursor-pointer">
              <span className="text-gray-700">
                {t('admin_skip_to')} Q4 (Lethargy)
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  /* ------- Right Column ------- */
  const renderRightColumn = () => (
    <aside className="w-72 bg-white border-l border-[#E5E7EB] p-4 overflow-y-auto flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-gray-900 text-base">
            {t('admin_simulation')}
          </h2>
          <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
            {t('admin_testing')}
          </span>
        </div>
        <button className="text-xs text-gray-500 hover:text-[#7C3AED] font-medium cursor-pointer flex items-center gap-1 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
          {t('admin_restart')}
        </button>
      </div>

      {/* Step label */}
      <span className="text-xs text-gray-400 font-semibold tracking-wide">
        {t('admin_step')} 01
      </span>

      {/* Current question */}
      <p className="font-medium text-sm text-gray-900 mt-2 mb-4">
        {activeQuestion ? getQuestionText(activeQuestion) : 'Is your pet eating normally?'}
      </p>

      {/* Answer options */}
      <div className="mb-4">
        {simOptions.map((opt) => {
          const isSelected = selectedSimOption === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => setSelectedSimOption(opt.value)}
              className={`rounded-xl border p-3 mb-2 text-sm cursor-pointer transition-colors flex items-center gap-3 ${
                isSelected
                  ? 'border-[#7C3AED] bg-[#F5F3FF]'
                  : 'border-[#E5E7EB] hover:border-[#7C3AED]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  isSelected ? 'border-[#7C3AED]' : 'border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                )}
              </div>
              <span className={isSelected ? 'text-[#7C3AED] font-medium' : 'text-gray-700'}>
                {opt.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Arrow down separator */}
      <div className="flex justify-center my-3">
        <ArrowDown className="w-5 h-5 text-gray-300" />
      </div>

      {/* Predicted next */}
      <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">
        {t('admin_predicted')}
      </span>
      <div className="mt-2 bg-gray-50 rounded-xl border border-[#E5E7EB] p-3 opacity-60">
        <p className="text-sm font-medium text-gray-600 mb-2">
          {nextQuestionPreview.text}
        </p>
        {nextQuestionPreview.options.map((optLabel, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 px-3 py-2 mb-1.5 text-xs text-gray-500 bg-white"
          >
            {optLabel}
          </div>
        ))}
      </div>

      {/* Active variables */}
      <div className="mt-5">
        <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">
          {t('admin_active_vars')}
        </span>
        <div className="mt-2 space-y-2">
          {activeVars.map((v) => (
            <div key={v.key} className="flex items-center justify-between font-mono text-sm">
              <span className="text-gray-600">{v.key}</span>
              <span className={v.color}>= {v.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar variant="admin" />

      {/* Mobile overlay for left sidebar */}
      {leftSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setLeftSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl z-10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
              <span className="font-display font-bold text-gray-900">
                {t('admin_questions')}
              </span>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-1 cursor-pointer text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('admin_search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-[#E5E7EB] px-3 py-2 pl-9 text-sm w-full outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
              {/* Filter pills */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {FILTER_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      activeFilter === key
                        ? 'bg-[#7C3AED] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t(FILTER_TRANSLATION_MAP[key])}
                  </button>
                ))}
              </div>
              {/* Question list */}
              {filteredQuestions.map((q) => {
                const isActive = activeQuestion?.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setActiveQuestion(q);
                      setLeftSidebarOpen(false);
                    }}
                    className={`p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors mb-2 border ${
                      isActive
                        ? 'border-r-2 border-[#7C3AED] bg-[#F5F3FF]'
                        : 'border-transparent'
                    }`}
                  >
                    <span className="font-mono text-xs text-gray-400">{q.id}</span>
                    <p className="text-sm font-medium text-gray-900 mt-1 mb-2 leading-snug">
                      {getQuestionText(q)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                        {q.rules} rules
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          TYPE_BADGE_STYLES[q.type] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {q.type}
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* New Question button */}
              <button className="bg-gray-900 text-white rounded-full px-4 py-2 text-sm w-full mt-4 hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                {t('admin_new_question')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay for right sidebar */}
      {rightSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setRightSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl z-10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
              <span className="font-display font-bold text-gray-900">
                {t('admin_simulation')}
              </span>
              <button
                onClick={() => setRightSidebarOpen(false)}
                className="p-1 cursor-pointer text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Reuse right column content */}
              <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-3">
                {t('admin_testing')}
              </span>
              <button className="text-xs text-gray-500 hover:text-[#7C3AED] font-medium cursor-pointer flex items-center gap-1 transition-colors mb-4">
                <RotateCcw className="w-3.5 h-3.5" />
                {t('admin_restart')}
              </button>
              <span className="text-xs text-gray-400 font-semibold tracking-wide">
                {t('admin_step')} 01
              </span>
              <p className="font-medium text-sm text-gray-900 mt-2 mb-4">
                {activeQuestion ? getQuestionText(activeQuestion) : 'Is your pet eating normally?'}
              </p>
              {simOptions.map((opt) => {
                const isSelected = selectedSimOption === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setSelectedSimOption(opt.value)}
                    className={`rounded-xl border p-3 mb-2 text-sm cursor-pointer transition-colors flex items-center gap-3 ${
                      isSelected
                        ? 'border-[#7C3AED] bg-[#F5F3FF]'
                        : 'border-[#E5E7EB] hover:border-[#7C3AED]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-[#7C3AED]' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                      )}
                    </div>
                    <span className={isSelected ? 'text-[#7C3AED] font-medium' : 'text-gray-700'}>
                      {opt.label}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-center my-3">
                <ArrowDown className="w-5 h-5 text-gray-300" />
              </div>
              <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">
                {t('admin_predicted')}
              </span>
              <div className="mt-2 bg-gray-50 rounded-xl border border-[#E5E7EB] p-3 opacity-60">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {nextQuestionPreview.text}
                </p>
                {nextQuestionPreview.options.map((optLabel, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 px-3 py-2 mb-1.5 text-xs text-gray-500 bg-white"
                  >
                    {optLabel}
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">
                  {t('admin_active_vars')}
                </span>
                <div className="mt-2 space-y-2">
                  {activeVars.map((v) => (
                    <div key={v.key} className="flex items-center justify-between font-mono text-sm">
                      <span className="text-gray-600">{v.key}</span>
                      <span className={v.color}>= {v.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three-column layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Column - hidden on mobile */}
        <div className="hidden lg:flex">
          {renderLeftColumn()}
        </div>

        {/* Center Column - always visible */}
        {renderCenterColumn()}

        {/* Right Column - hidden on mobile */}
        <div className="hidden lg:flex">
          {renderRightColumn()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
