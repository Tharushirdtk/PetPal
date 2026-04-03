import { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  X,
  GitBranch,
  Pencil,
  Maximize2,
} from 'lucide-react';
import { useLang } from '../../i18n/LanguageContext';
import { conditionToText } from '../../utils/conditionToText';
import ConditionPills from './ConditionPills';

/**
 * Parse which question code(s) a condition references as its source.
 * Looks for {"var": "answers.<code>"} patterns.
 */
function extractSourceCodes(conditionJson) {
  const codes = new Set();
  const condition =
    typeof conditionJson === 'string'
      ? (() => { try { return JSON.parse(conditionJson); } catch { return null; } })()
      : conditionJson;

  if (!condition) return codes;

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if ('var' in node) {
      const v = node.var;
      if (typeof v === 'string' && v.startsWith('answers.')) {
        codes.add(v.slice('answers.'.length));
      }
    }
    Object.values(node).forEach(walk);
  }

  walk(condition);
  return codes;
}

const RuleFlowMap = ({ questions, allRules, onEditRule }) => {
  const { t } = useLang();
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Build question lookup
  const questionMap = useMemo(() => {
    const map = {};
    questions.forEach((q) => {
      map[q.id] = q;
      map[q.code] = q;
    });
    return map;
  }, [questions]);

  // Build rules-by-question
  const rulesByQuestion = useMemo(() => {
    const map = {};
    allRules.forEach((r) => {
      const qId = r.target_id || r.questionId;
      if (!map[qId]) map[qId] = [];
      map[qId].push(r);
    });
    return map;
  }, [allRules]);

  // Build nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    const questionIds = questions.map((q) => q.id);
    const questionsPerRow = Math.ceil(Math.sqrt(questions.length));

    questions.forEach((q, idx) => {
      const hasRules = (rulesByQuestion[q.id] || []).length > 0;
      const hasActiveRules = (rulesByQuestion[q.id] || []).some((r) => r.active);
      const col = idx % questionsPerRow;
      const row = Math.floor(idx / questionsPerRow);

      nodes.push({
        id: `q-${q.id}`,
        type: 'default',
        position: { x: col * 280, y: row * 160 },
        data: {
          label: `${q.code}\n${q.text?.substring(0, 30)}${(q.text?.length || 0) > 30 ? '...' : ''}`,
        },
        style: {
          background: hasActiveRules ? '#F0FDF4' : hasRules ? '#FFF7ED' : '#F9FAFB',
          border: hasActiveRules
            ? '2px solid #22C55E'
            : hasRules
            ? '2px solid #F59E0B'
            : '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#374151',
          width: 220,
          whiteSpace: 'pre-wrap',
          textAlign: 'center',
          cursor: 'pointer',
        },
      });

      // Create edges from source questions to this question
      const rules = rulesByQuestion[q.id] || [];
      rules.forEach((rule) => {
        const sourceCodes = extractSourceCodes(rule.condition_json);
        sourceCodes.forEach((code) => {
          const sourceQ = questionMap[code];
          if (sourceQ && questionIds.includes(sourceQ.id)) {
            edges.push({
              id: `e-${rule.id}-${sourceQ.id}`,
              source: `q-${sourceQ.id}`,
              target: `q-${q.id}`,
              label: conditionToText(rule.condition_json),
              type: 'smoothstep',
              animated: !!rule.active,
              style: {
                stroke: rule.active ? '#7C3AED' : '#9CA3AF',
                strokeWidth: 2,
              },
              labelStyle: {
                fontSize: 10,
                fontWeight: 500,
                fill: '#6B7280',
              },
              labelBgStyle: {
                fill: '#FFFFFF',
                fillOpacity: 0.9,
              },
              labelBgPadding: [4, 4],
              labelBgBorderRadius: 4,
            });
          }
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [questions, rulesByQuestion, questionMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_event, node) => {
      const qId = parseInt(node.id.replace('q-', ''));
      const q = questionMap[qId];
      if (q) setSelectedQuestion(q);
    },
    [questionMap]
  );

  const selectedRules = selectedQuestion
    ? rulesByQuestion[selectedQuestion.id] || []
    : [];

  if (allRules.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 p-12 text-center">
        <GitBranch className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('admin_rule_flow_no_rules')}
        </p>
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden" style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E5E7EB" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-white !border-[#E5E7EB] !rounded-xl !shadow-sm"
        />
        <MiniMap
          nodeColor={(node) => {
            const qId = parseInt(node.id.replace('q-', ''));
            const rules = rulesByQuestion[qId] || [];
            if (rules.some((r) => r.active)) return '#22C55E';
            if (rules.length > 0) return '#F59E0B';
            return '#D1D5DB';
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="!bg-white !border-[#E5E7EB] !rounded-xl"
        />
        <Panel position="top-left">
          <div className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {t('admin_rule_flow_title')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {t('admin_rule_flow_click_hint')}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Active rules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Inactive rules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">No rules</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Side panel — appears when a node is clicked */}
      {selectedQuestion && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white dark:bg-gray-800 border-l border-[#E5E7EB] dark:border-gray-700 shadow-xl overflow-y-auto z-10">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-[#E5E7EB] dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs text-[#7C3AED]">{selectedQuestion.code}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedQuestion.text}
              </p>
            </div>
            <button
              onClick={() => setSelectedQuestion(null)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
              {t('admin_visibility_rules')} ({selectedRules.length})
            </h4>

            {selectedRules.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                {t('admin_rule_always_visible')}
              </p>
            ) : (
              selectedRules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                        P: {rule.priority}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rule.active
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                        }`}
                      >
                        {rule.active ? t('admin_active') : t('admin_inactive')}
                      </span>
                    </div>
                    <button
                      onClick={() => onEditRule(rule)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <ConditionPills conditionJson={rule.condition_json} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleFlowMap;
