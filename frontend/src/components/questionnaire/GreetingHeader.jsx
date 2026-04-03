import { useLang } from '../../i18n/LanguageContext';

const PawIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#7C3AED" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="8" cy="7" rx="2.5" ry="3" />
    <ellipse cx="16" cy="7" rx="2.5" ry="3" />
    <ellipse cx="4.5" cy="13" rx="2" ry="2.5" />
    <ellipse cx="19.5" cy="13" rx="2" ry="2.5" />
    <path d="M12 22c-4 0-7-3.5-7-6 0-2 1.5-3.5 3-4.5 1-.7 2.5-1 4-1s3 .3 4 1c1.5 1 3 2.5 3 4.5 0 2.5-3 6-7 6z" />
  </svg>
);

const getGreetingMessage = (item, t, petName) => {
  if (!item) return '';

  if (item.type === 'breed') {
    return t('quest_greeting_pet_details') || "Let's get to know your pet!";
  }

  if (item.type !== 'question') return '';

  const code = item.question.code;

  // Pet details (P1-P5)
  if (/^P\d$/.test(code)) {
    if (petName) {
      return (t('quest_greeting_pet_details_named') || `Tell us about ${petName}!`).replace('{{petName}}', petName);
    }
    return t('quest_greeting_pet_details') || "Let's get to know your pet!";
  }

  // Main symptom (SD1)
  if (code === 'SD1') {
    return t('quest_greeting_symptoms') || "Now let's understand the symptoms";
  }

  // Branch questions (SD2-SD4 with suffixes)
  if (/^SD[234]_/.test(code)) {
    return t('quest_greeting_symptom_details') || 'A few more details about this symptom...';
  }

  // General assessment (SD5-SD7)
  if (/^SD[567]$/.test(code)) {
    return t('quest_greeting_general') || 'Almost done! Just a few general questions';
  }

  // API question codes
  if (code === 'q_pet_type') {
    return t('quest_greeting_pet_details') || "Let's get to know your pet!";
  }
  if (code === 'q_c') {
    return t('quest_greeting_symptoms') || "Now let's understand the symptoms";
  }
  if (/^q_[bdfg]$/.test(code)) {
    return t('quest_greeting_symptom_details') || 'A few more details about this symptom...';
  }

  return t('quest_greeting_pet_details') || "Let's get to know your pet!";
};

const GreetingHeader = ({ currentItem, petName }) => {
  const { t } = useLang();
  const message = getGreetingMessage(currentItem, t, petName);

  return (
    <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
      <div className="h-10 w-10 rounded-full bg-[#F5F3FF] flex items-center justify-center flex-shrink-0">
        <PawIcon />
      </div>
      <div className="bg-[#F5F3FF] rounded-2xl rounded-bl-sm px-4 py-2.5">
        <p className="text-sm font-medium text-[#7C3AED]">{message}</p>
      </div>
    </div>
  );
};

export default GreetingHeader;
