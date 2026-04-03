/**
 * Converts a JSON Logic condition object into a human-readable string.
 *
 * Handles: ==, !=, >, <, >=, <=, in, !, and, or
 * For any operator or structure it cannot parse, returns a safe fallback string.
 */

const OPERATOR_LABELS = {
  '==': 'equals',
  '!=': 'does not equal',
  '>': 'is greater than',
  '<': 'is less than',
  '>=': 'is at least',
  '<=': 'is at most',
  in: 'is in',
};

/**
 * Map a JSON Logic `var` path to a human-readable label.
 */
function varToLabel(varPath) {
  if (!varPath || typeof varPath !== 'string') return String(varPath);

  if (varPath.startsWith('answers.')) {
    const code = varPath.slice('answers.'.length);
    return `Answer to [${code}]`;
  }
  if (varPath.startsWith('pet.')) {
    const field = varPath.slice('pet.'.length);
    const labels = {
      species: 'Pet species',
      breed: 'Pet breed',
      age: 'Pet age',
      weight: 'Pet weight',
      gender: 'Pet gender',
      name: 'Pet name',
    };
    return labels[field] || `Pet ${field}`;
  }
  if (varPath.startsWith('image_analysis.')) {
    const field = varPath.slice('image_analysis.'.length);
    return `Image analysis ${field}`;
  }
  return varPath;
}

/**
 * Format a value for display.
 */
function formatValue(val) {
  if (val === null || val === undefined) return 'empty';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (Array.isArray(val)) return `[${val.map(formatValue).join(', ')}]`;
  return String(val);
}

/**
 * Extract the var path from a JSON Logic node, if it's a simple {"var": "..."}
 */
function extractVar(node) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    if ('var' in node) return node.var;
  }
  return null;
}

/**
 * Try to convert a single comparison operation to text.
 * Returns null if it cannot be parsed.
 */
function comparisonToText(operator, args) {
  const label = OPERATOR_LABELS[operator];
  if (!label || !Array.isArray(args) || args.length < 2) return null;

  const leftVar = extractVar(args[0]);
  const rightVar = extractVar(args[1]);

  if (leftVar !== null) {
    return `${varToLabel(leftVar)} ${label} "${formatValue(args[1])}"`;
  }
  if (rightVar !== null) {
    return `"${formatValue(args[0])}" ${label} ${varToLabel(rightVar)}`;
  }
  return null;
}

/**
 * Convert a negation (!) to text.
 */
function negationToText(args) {
  if (!Array.isArray(args) || args.length < 1) return null;
  const inner = conditionNodeToText(args[0]);
  if (!inner) return null;
  return `NOT (${inner})`;
}

/**
 * Recursively convert a JSON Logic node to human-readable text.
 * Returns null if it cannot be parsed cleanly.
 */
function conditionNodeToText(condition) {
  if (!condition || typeof condition !== 'object') return null;
  if (Array.isArray(condition)) return null;

  const keys = Object.keys(condition);
  if (keys.length !== 1) return null;

  const operator = keys[0];
  const args = condition[operator];

  // Handle AND / OR
  if (operator === 'and' || operator === 'or') {
    if (!Array.isArray(args) || args.length === 0) return null;
    const parts = args.map(conditionNodeToText);
    if (parts.some((p) => p === null)) return null;
    const joiner = operator === 'and' ? ' AND ' : ' OR ';
    return parts.join(joiner);
  }

  // Handle NOT
  if (operator === '!') {
    return negationToText(Array.isArray(args) ? args : [args]);
  }

  // Handle comparisons
  return comparisonToText(operator, args);
}

/**
 * Main export: Convert a JSON Logic condition to a human-readable string.
 * Never throws. Returns a fallback for anything it cannot parse.
 */
export function conditionToText(conditionJson) {
  try {
    const condition =
      typeof conditionJson === 'string'
        ? JSON.parse(conditionJson)
        : conditionJson;

    if (!condition || typeof condition !== 'object') {
      return 'Complex condition (view JSON)';
    }

    const text = conditionNodeToText(condition);
    return text || 'Complex condition (view JSON)';
  } catch {
    return 'Complex condition (view JSON)';
  }
}

/**
 * Parse a JSON Logic condition into an array of structured condition rows
 * suitable for the RuleBuilder form.
 *
 * Returns { logic: 'and'|'or', conditions: [...] } or null if unparseable.
 * Each condition: { source, field, operator, value }
 */
export function parseConditionToRows(conditionJson) {
  try {
    const condition =
      typeof conditionJson === 'string'
        ? JSON.parse(conditionJson)
        : conditionJson;

    if (!condition || typeof condition !== 'object' || Array.isArray(condition))
      return null;

    const keys = Object.keys(condition);
    if (keys.length !== 1) return null;

    const operator = keys[0];
    const args = condition[operator];

    // Single comparison — wrap as AND with one condition
    if (operator !== 'and' && operator !== 'or') {
      const row = parseSingleComparison(operator, args);
      if (!row) return null;
      return { logic: 'and', conditions: [row] };
    }

    // AND / OR wrapper
    if (!Array.isArray(args)) return null;
    const conditions = args.map((item) => {
      const itemKeys = Object.keys(item);
      if (itemKeys.length !== 1) return null;
      return parseSingleComparison(itemKeys[0], item[itemKeys[0]]);
    });

    if (conditions.some((c) => c === null)) return null;
    return { logic: operator, conditions };
  } catch {
    return null;
  }
}

function parseSingleComparison(operator, args) {
  if (!OPERATOR_LABELS[operator] || !Array.isArray(args) || args.length < 2)
    return null;

  const leftVar = extractVar(args[0]);
  const rightVar = extractVar(args[1]);

  let varPath, value;
  if (leftVar !== null) {
    varPath = leftVar;
    value = args[1];
  } else if (rightVar !== null) {
    varPath = rightVar;
    value = args[0];
  } else {
    return null;
  }

  let source = 'answers';
  let field = varPath;
  if (varPath.startsWith('answers.')) {
    source = 'answers';
    field = varPath.slice('answers.'.length);
  } else if (varPath.startsWith('pet.')) {
    source = 'pet';
    field = varPath.slice('pet.'.length);
  } else if (varPath.startsWith('image_analysis.')) {
    source = 'image_analysis';
    field = varPath.slice('image_analysis.'.length);
  }

  return { source, field, operator, value: typeof value === 'object' ? JSON.stringify(value) : String(value) };
}

/**
 * Build a JSON Logic object from structured condition rows.
 * Inverse of parseConditionToRows.
 */
export function buildConditionFromRows(logic, conditions) {
  const comparisons = conditions
    .filter((c) => c.field && c.value !== '')
    .map((c) => {
      let varPath;
      if (c.source === 'pet') varPath = `pet.${c.field}`;
      else if (c.source === 'image_analysis') varPath = `image_analysis.${c.field}`;
      else varPath = `answers.${c.field}`;

      let value = c.value;
      // Try to parse numbers
      if (value !== '' && !isNaN(Number(value)) && ['>', '<', '>=', '<='].includes(c.operator)) {
        value = Number(value);
      }

      return { [c.operator]: [{ var: varPath }, value] };
    });

  if (comparisons.length === 0) return null;
  if (comparisons.length === 1) return comparisons[0];
  return { [logic]: comparisons };
}
