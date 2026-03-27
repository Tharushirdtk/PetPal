const jsonLogic = require('json-logic-js');
const { query } = require('../config/db');

/**
 * Evaluate a single visibility rule condition against a context object.
 */
function evaluateRule(conditionJson, context) {
  try {
    const condition = typeof conditionJson === 'string' ? JSON.parse(conditionJson) : conditionJson;
    return !!jsonLogic.apply(condition, context);
  } catch (err) {
    console.error('Rule evaluation error:', err.message);
    return false;
  }
}

/**
 * Log rule evaluation result to rule_audit_summary.
 */
async function logRuleAudit(ruleId, result, context, notes) {
  try {
    await query(
      `INSERT INTO rule_audit_summary (rule_id, evaluation_result, evaluator_context_json, notes, created_by)
       VALUES (?, ?, ?, ?, NULL)`,
      [ruleId, result ? 1 : 0, JSON.stringify(context), notes || null]
    );
  } catch (err) {
    console.error('Failed to log rule audit:', err.message);
  }
}

/**
 * Given all questions (with their visibility_rules array) and a context,
 * return only the questions whose rules all evaluate to true.
 * Questions with no rules are always visible.
 */
async function getVisibleQuestions(questionsWithRules, context) {
  const visible = [];

  for (const question of questionsWithRules) {
    const rules = question.visibility_rules || [];

    if (rules.length === 0) {
      visible.push(question);
      continue;
    }

    let allPassed = true;
    for (const rule of rules) {
      const condition = typeof rule.condition_json === 'string'
        ? JSON.parse(rule.condition_json)
        : rule.condition_json;

      const result = evaluateRule(condition, context);

      await logRuleAudit(rule.id, result, context, `Evaluated for question ${question.code}`);

      if (!result) {
        allPassed = false;
        break;
      }
    }

    if (allPassed) {
      visible.push(question);
    }
  }

  return visible;
}

module.exports = { evaluateRule, getVisibleQuestions, logRuleAudit };
