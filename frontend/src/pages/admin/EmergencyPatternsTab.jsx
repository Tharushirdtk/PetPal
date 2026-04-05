import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertTriangle,
  TestTube,
  Save,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const EmergencyPatternsTab = () => {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPattern, setEditingPattern] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testText, setTestText] = useState('');
  const [testResults, setTestResults] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pattern_regex: '',
    warning_message: '',
    severity_level: 'HIGH',
    priority: 10,
  });

  const severityColors = {
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  // Load patterns
  const loadPatterns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        severity: severityFilter,
      });

      const response = await fetch(`/api/admin/emergency-patterns?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatterns(data.data.patterns || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/emergency-patterns/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Create or update pattern
  const savePattern = async () => {
    try {
      const url = editingPattern
        ? `/api/admin/emergency-patterns/${editingPattern.id}`
        : '/api/admin/emergency-patterns';

      const response = await fetch(url, {
        method: editingPattern ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingPattern(null);
        resetForm();
        loadPatterns();
        loadStats();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save pattern');
      }
    } catch (error) {
      console.error('Error saving pattern:', error);
      alert('Failed to save pattern');
    }
  };

  // Delete pattern
  const deletePattern = async (id) => {
    if (!confirm('Are you sure you want to delete this emergency pattern?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/emergency-patterns/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        loadPatterns();
        loadStats();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete pattern');
      }
    } catch (error) {
      console.error('Error deleting pattern:', error);
      alert('Failed to delete pattern');
    }
  };

  // Toggle pattern active status
  const togglePattern = async (id) => {
    try {
      const response = await fetch(`/api/admin/emergency-patterns/${id}/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        loadPatterns();
        loadStats();
      }
    } catch (error) {
      console.error('Error toggling pattern:', error);
    }
  };

  // Test pattern
  const testPattern = async () => {
    if (!formData.pattern_regex || !testText) {
      return;
    }

    try {
      const response = await fetch('/api/admin/emergency-patterns/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          pattern_regex: formData.pattern_regex,
          test_text: testText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.data);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to test pattern');
      }
    } catch (error) {
      console.error('Error testing pattern:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pattern_regex: '',
      warning_message: '',
      severity_level: 'HIGH',
      priority: 10,
    });
    setTestResults(null);
    setTestText('');
  };

  const openEditModal = (pattern) => {
    setEditingPattern(pattern);
    setFormData({
      name: pattern.name || '',
      description: pattern.description || '',
      pattern_regex: pattern.pattern_regex || '',
      warning_message: pattern.warning_message || '',
      severity_level: pattern.severity_level || 'HIGH',
      priority: pattern.priority || 10,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingPattern(null);
    resetForm();
    setShowModal(true);
  };

  useEffect(() => {
    loadPatterns();
  }, [page, search, severityFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Emergency Patterns
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage configurable emergency detection patterns
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Pattern
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total || 0}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400">Active</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {stats.active || 0}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-sm text-red-600 dark:text-red-400">Critical</div>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {stats.critical || 0}
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="text-sm text-orange-600 dark:text-orange-400">High</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {stats.high || 0}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Inactive</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.inactive || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patterns List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading patterns...</p>
          </div>
        ) : patterns.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No emergency patterns found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {pattern.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${severityColors[pattern.severity_level]}`}>
                        {pattern.severity_level}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                        Priority {pattern.priority}
                      </span>
                      {pattern.is_active ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Eye className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <EyeOff className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>

                    {pattern.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {pattern.description}
                      </p>
                    )}

                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pattern:</span>
                      <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-800 dark:text-gray-200 font-mono">
                        {pattern.pattern_regex}
                      </code>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium text-red-600 dark:text-red-400">Warning:</span>
                      <span className="ml-2">{pattern.warning_message}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => togglePattern(pattern.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={pattern.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {pattern.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(pattern)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePattern(pattern.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPattern ? 'Edit Emergency Pattern' : 'Create Emergency Pattern'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pattern Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Blood in Vomit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe what this pattern detects..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Regex Pattern *
                </label>
                <input
                  type="text"
                  value={formData.pattern_regex}
                  onChange={(e) => setFormData({ ...formData, pattern_regex: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="blood\\s*in\\s*vomit"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Regular expression pattern (case-insensitive by default)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warning Message *
                </label>
                <textarea
                  value={formData.warning_message}
                  onChange={(e) => setFormData({ ...formData, warning_message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Message to display when this pattern matches..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={formData.severity_level}
                    onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Lower numbers = higher priority
                  </p>
                </div>
              </div>

              {/* Test Pattern */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setTestMode(!testMode)}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <TestTube className="w-4 h-4" />
                  Test Pattern
                  {testMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {testMode && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Test Text
                      </label>
                      <textarea
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter text to test against the pattern..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={testPattern}
                        disabled={!formData.pattern_regex || !testText}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Test
                      </button>
                    </div>
                    {testResults && (
                      <div className={`p-3 rounded-lg ${testResults.matches ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {testResults.matches ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                Pattern Matches!
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                No Match
                              </span>
                            </>
                          )}
                        </div>
                        {testResults.match_details && (
                          <div className="text-xs">
                            <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                              "{testResults.match_details.full_match}" at position {testResults.match_details.index}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={savePattern}
                disabled={!formData.name || !formData.pattern_regex || !formData.warning_message}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {editingPattern ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyPatternsTab;