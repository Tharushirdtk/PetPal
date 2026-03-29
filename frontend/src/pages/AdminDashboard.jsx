import { useState } from 'react';
import {
  LayoutDashboard,
  FileQuestion,
  GitBranch,
  Mail,
  BarChart3,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import OverviewTab from './admin/OverviewTab';
import QuestionsTab from './admin/QuestionsTab';
import RulesTab from './admin/RulesTab';
import ContactsTab from './admin/ContactsTab';
import AnalyticsTab from './admin/AnalyticsTab';

const TABS = [
  { key: 'overview', icon: LayoutDashboard, labelKey: 'admin_tab_overview' },
  { key: 'questions', icon: FileQuestion, labelKey: 'admin_tab_questions' },
  { key: 'rules', icon: GitBranch, labelKey: 'admin_tab_rules' },
  { key: 'contacts', icon: Mail, labelKey: 'admin_tab_contacts' },
  { key: 'analytics', icon: BarChart3, labelKey: 'admin_tab_analytics' },
];

const TAB_COMPONENTS = {
  overview: OverviewTab,
  questions: QuestionsTab,
  rules: RulesTab,
  contacts: ContactsTab,
  analytics: AnalyticsTab,
};

const AdminDashboard = () => {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('overview');

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar variant="admin" />

      {/* Tab Navigation */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, icon: Icon, labelKey }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === key
                    ? 'border-[#7C3AED] text-[#7C3AED]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminDashboard;
