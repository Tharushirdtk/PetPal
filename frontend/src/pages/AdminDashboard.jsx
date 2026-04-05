import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileQuestion,
  GitBranch,
  Mail,
  BarChart3,
  Users,
  ChevronDown,
  Settings,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import Navbar from '../components/Navbar';
import OverviewTab from './admin/OverviewTab';
import QuestionsTab from './admin/QuestionsTab';
import RulesTab from './admin/RulesTab';
import ContactsTab from './admin/ContactsTab';
import AnalyticsTab from './admin/AnalyticsTab';
import UsersTab from './admin/UsersTab';

const TAB_CATEGORIES = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    labelKey: 'admin_category_dashboard',
    tabs: [
      { key: 'overview', icon: LayoutDashboard, labelKey: 'admin_tab_overview' }
    ]
  },
  {
    key: 'content',
    icon: Settings,
    labelKey: 'admin_category_content',
    tabs: [
      { key: 'questions', icon: FileQuestion, labelKey: 'admin_tab_questions' },
      { key: 'rules', icon: GitBranch, labelKey: 'admin_tab_rules' }
    ]
  },
  {
    key: 'user-management',
    icon: MessageSquare,
    labelKey: 'admin_category_user_management',
    tabs: [
      { key: 'contacts', icon: Mail, labelKey: 'admin_tab_contacts' },
      { key: 'users', icon: Users, labelKey: 'admin_tab_users' }
    ]
  },
  {
    key: 'analytics',
    icon: TrendingUp,
    labelKey: 'admin_category_analytics',
    tabs: [
      { key: 'analytics', icon: BarChart3, labelKey: 'admin_tab_analytics' }
    ]
  }
];

// Flattened tabs for backward compatibility
const TABS = TAB_CATEGORIES.flatMap(category => category.tabs);

const TAB_COMPONENTS = {
  overview: OverviewTab,
  questions: QuestionsTab,
  rules: RulesTab,
  contacts: ContactsTab,
  users: UsersTab,
  analytics: AnalyticsTab,
};

const AdminDashboard = () => {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('overview');
  const [openCategory, setOpenCategory] = useState('dashboard');

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  // Find which category contains the active tab
  const findActiveCategory = () => {
    for (const category of TAB_CATEGORIES) {
      if (category.tabs.some(tab => tab.key === activeTab)) {
        return category.key;
      }
    }
    return 'dashboard';
  };

  // Initialize the open category based on active tab
  useEffect(() => {
    setOpenCategory(findActiveCategory());
  }, [activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setOpenCategory(null); // Close dropdown after selection
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900">
      <Navbar variant="admin" />

      {/* Categorized Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-6 py-2">
            {TAB_CATEGORIES.map((category) => (
              <div key={category.key} className="relative">
                {category.tabs.length === 1 ? (
                  /* Single-tab category: Direct button */
                  <button
                    onClick={() => handleTabChange(category.tabs[0].key)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === category.tabs[0].key
                        ? 'bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <category.icon className="w-4 h-4" />
                    {t(category.labelKey)}
                  </button>
                ) : (
                  /* Multi-tab category: Dropdown */
                  <>
                    <button
                      onClick={() => setOpenCategory(openCategory === category.key ? null : category.key)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        category.tabs.some(tab => tab.key === activeTab)
                          ? 'bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <category.icon className="w-4 h-4" />
                      {t(category.labelKey)}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openCategory === category.key ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {openCategory === category.key && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[200px]">
                        {category.tabs.map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              activeTab === tab.key
                                ? 'bg-[#7C3AED]/5 text-[#7C3AED] border-r-2 border-[#7C3AED]'
                                : 'text-gray-700 dark:text-gray-200'
                            } ${
                              category.tabs.indexOf(tab) === 0 ? 'rounded-t-md' : ''
                            } ${
                              category.tabs.indexOf(tab) === category.tabs.length - 1 ? 'rounded-b-md' : ''
                            }`}
                          >
                            <tab.icon className="w-4 h-4" />
                            {t(tab.labelKey)}
                            {activeTab === tab.key && (
                              <div className="ml-auto w-2 h-2 bg-[#7C3AED] rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ActiveComponent onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default AdminDashboard;
