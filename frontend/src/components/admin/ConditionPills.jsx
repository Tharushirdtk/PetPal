import { conditionToText } from '../../utils/conditionToText';

/**
 * Renders a JSON Logic condition as human-readable colored pills.
 * Splits on AND / OR and renders each sub-condition as a separate badge.
 */
const ConditionPills = ({ conditionJson }) => {
  const fullText = conditionToText(conditionJson);

  // If it's the fallback string, render as a single muted pill
  if (fullText === 'Complex condition (view JSON)') {
    return (
      <span className="inline-flex text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium">
        {fullText}
      </span>
    );
  }

  // Split by AND / OR to render each condition as its own pill
  const andParts = fullText.split(' AND ');
  const orParts = fullText.split(' OR ');

  let parts, joiner;
  if (andParts.length > 1) {
    parts = andParts;
    joiner = 'AND';
  } else if (orParts.length > 1) {
    parts = orParts;
    joiner = 'OR';
  } else {
    parts = [fullText];
    joiner = null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 px-1">
              {joiner}
            </span>
          )}
          <span className="inline-flex text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
            {part.trim()}
          </span>
        </span>
      ))}
    </div>
  );
};

export default ConditionPills;
