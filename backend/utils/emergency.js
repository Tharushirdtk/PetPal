const EMERGENCY_PATTERNS = [
  { pattern: /blood\s*in\s*vomit/i, warning: 'Blood detected in vomit — this could indicate internal bleeding or a serious gastrointestinal issue.' },
  { pattern: /blood\s*in\s*stool/i, warning: 'Blood in stool can indicate serious gastrointestinal problems requiring immediate attention.' },
  { pattern: /difficulty\s*breathing|can'?t\s*breathe|breathing\s*difficulty|severe\s*breathing/i, warning: 'Breathing difficulty is a life-threatening emergency.' },
  { pattern: /heavy\s*bleeding|uncontrolled\s*bleeding|severe\s*bleeding/i, warning: 'Uncontrolled bleeding requires immediate veterinary intervention.' },
  { pattern: /seizure|seizures|seizing/i, warning: 'Seizures require immediate emergency veterinary care.' },
  { pattern: /unconscious|collapsed|not\s*responsive|unresponsive/i, warning: 'Loss of consciousness or collapse is a critical emergency.' },
  { pattern: /suspected\s*poisoning|swallowed\s*something\s*toxic|poison|toxic|ate\s*chocolate|ate\s*rat\s*poison/i, warning: 'Suspected poisoning — time is critical. Bring the suspected substance to the vet.' },
  { pattern: /blue\s*gums?|purple\s*gums?|cyanotic/i, warning: 'Blue or purple gums indicate severe oxygen deprivation.' },
  { pattern: /unable\s*to\s*urinate|can'?t\s*(pee|urinate)|urinary\s*block/i, warning: 'Urinary blockage (especially in male cats) is a life-threatening emergency that can be fatal within hours.' },
];

/**
 * Check text for emergency triggers.
 * @param {string} text - User message or concatenated questionnaire answers
 * @returns {{ triggered: boolean, warning: string | null }}
 */
function checkEmergency(text) {
  if (!text) return { triggered: false, warning: null };

  for (const { pattern, warning } of EMERGENCY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        triggered: true,
        warning: `⚠️ EMERGENCY: ${warning} Please take your pet to an emergency vet immediately. Do not wait.`,
      };
    }
  }

  return { triggered: false, warning: null };
}

module.exports = { checkEmergency };
