export const mockPets = [
  {
    id: 1,
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: 3,
    status: 'healthy',
    lastDiagnosis: 'Oct 12, 2023',
    nextCheckup: 'Nov 20, 2023',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=200&fit=crop',
  },
  {
    id: 2,
    name: 'Luna',
    breed: 'Domestic Shorthair',
    age: 5,
    status: 'pending',
    lastDiagnosis: 'Yesterday',
    actionRequired: 'Check Report',
    image: null,
  },
];

export const mockHistory = [
  {
    id: 1,
    petName: 'Buddy',
    petAvatar: 'B',
    date: 'Oct 24, 2023',
    diagnosis: 'Seasonal Allergy',
    diagnosisSub: 'Mild respiratory symptoms',
    clinician: 'Dr. Sarah Jenkins',
    status: 'completed',
    action: 'view',
  },
  {
    id: 2,
    petName: 'Luna',
    petAvatar: 'L',
    date: 'Oct 12, 2023',
    diagnosis: 'Vaccination',
    diagnosisSub: 'Annual core boosters',
    clinician: 'Dr. Michael Chen',
    status: 'scheduled',
    action: 'edit',
  },
  {
    id: 3,
    petName: 'Max',
    petAvatar: 'M',
    date: 'Sep 28, 2023',
    diagnosis: 'Gastrointestinal Check',
    diagnosisSub: 'Follow-up exam',
    clinician: 'Dr. Sarah Jenkins',
    status: 'completed',
    action: 'view',
  },
];

export const mockQuestions = [
  { id: 'q_eating', category: 'behavior', text_en: 'Is your pet eating normally?', text_si: 'ඔබේ සතා සාමාන්‍ය පරිදි ආහාර ගනීද?', rules: 3, type: 'yesno' },
  { id: 'q_vomit', category: 'diet', text_en: 'Frequency of vomiting?', text_si: 'වමනය කිරීමේ වාර ගණන?', rules: 2, type: 'choice' },
  { id: 'q_stool', category: 'diet', text_en: 'Describe stool consistency.', text_si: 'මල මෘදුත්වය විස්තර කරන්න.', rules: 4, type: 'multiple' },
  { id: 'q_lethargy', category: 'behavior', text_en: 'Lethargy duration?', text_si: 'මැලිකම කාලය?', rules: 1, type: 'numeric' },
  { id: 'q_appetite', category: 'diet', text_en: 'Appetite changes?', text_si: 'ආහාර රුචිය වෙනස්කම්?', rules: 2, type: 'choice' },
  { id: 'q_water', category: 'diet', text_en: 'Water intake level?', text_si: 'ජල පරිභෝජන මට්ටම?', rules: 1, type: 'choice' },
  { id: 'q_breathing', category: 'medical', text_en: 'Any breathing difficulty?', text_si: 'හුස්ම ගැනීමේ අපහසුතාවක්?', rules: 3, type: 'yesno' },
  { id: 'q_skin', category: 'medical', text_en: 'Skin abnormalities?', text_si: 'සමේ අසාමාන්‍යතා?', rules: 2, type: 'multiple' },
  { id: 'q_mobility', category: 'behavior', text_en: 'Mobility issues?', text_si: 'චලන ගැටලු?', rules: 2, type: 'yesno' },
  { id: 'q_eyes', category: 'medical', text_en: 'Eye discharge or redness?', text_si: 'ඇස් මගින් ස්‍රාවය හෝ රතු පැහැය?', rules: 1, type: 'yesno' },
  { id: 'q_energy', category: 'behavior', text_en: 'Energy level today?', text_si: 'අද ශක්ති මට්ටම?', rules: 2, type: 'choice' },
  { id: 'q_weight', category: 'medical', text_en: 'Recent weight changes?', text_si: 'මෑත බර වෙනස්කම්?', rules: 3, type: 'numeric' },
];

export const mockChatMessages = [
  {
    id: 1,
    role: 'ai',
    text: "Hi there! I'm your PetPal health assistant. How is your adorable furry friend doing today?",
    time: '10:23 AM',
  },
  {
    id: 2,
    role: 'user',
    text: "My cat seems a bit lethargic and isn't eating much. I'm worried.",
    time: '10:26 AM',
  },
  {
    id: 3,
    role: 'ai',
    text: "I'm sorry to hear that. Lethargy and loss of appetite can be serious in cats. Let's look into this carefully. Based on your description, I've prepared a preliminary assessment below.",
    time: '10:26 AM',
    hasDiagnosisCard: true,
  },
];

export const mockChatHistory = [
  { id: 1, title: 'Whiskers — Lethargy', date: 'Today', active: true },
  { id: 2, title: 'Buddy — Ear Infection', date: 'Oct 18', active: false },
  { id: 3, title: 'Luna — Skin Rash', date: 'Oct 12', active: false },
];

/* ── Symptom-driven question flow (fallback when API is unavailable) ── */
export const questionFlow = [
  /* Step 1: Pet Details */
  { code: 'P1', text_en: 'What type of pet do you have?', text_si: 'ඔබට ඇති සතා වර්ගය කුමක්ද?', type: 'single', step: 1,
    options: [
      { value: 'dog', label_en: 'Dog', label_si: 'බල්ලා', icon: 'dog', color: 'bg-orange-50 border-orange-200' },
      { value: 'cat', label_en: 'Cat', label_si: 'පූසා', icon: 'cat', color: 'bg-purple-50 border-purple-200' },
    ] },
  { code: 'P2', text_en: 'How old is your pet (in years)?', text_si: 'ඔබේ සතාගේ වයස කීයද (අවුරුදු)?', type: 'number', step: 1, options: [] },
  { code: 'P3', text_en: "What is your pet's gender?", text_si: 'ඔබේ සතාගේ ස්ත්‍රී පුරුෂ භාවය කුමක්ද?', type: 'single', step: 1,
    options: [
      { value: 'male', label_en: 'Male', label_si: 'පිරිමි', icon: '♂️', color: 'bg-blue-50 border-blue-200' },
      { value: 'female', label_en: 'Female', label_si: 'ගැහැණු', icon: '♀️', color: 'bg-pink-50 border-pink-200' },
    ] },
  { code: 'P4', text_en: 'Is your pet neutered/spayed?', text_si: 'ඔබේ සතා වඳ කර තිබේද?', type: 'single', step: 1,
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '✅', color: 'bg-green-50 border-green-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '❌', color: 'bg-red-50 border-red-200' },
      { value: 'not_sure', label_en: 'Not Sure', label_si: 'විශ්වාස නැත', icon: '🤷', color: 'bg-gray-50 border-gray-200' },
    ] },
  { code: 'P5', text_en: 'Is your pet vaccinated?', text_si: 'ඔබේ සතාට එන්නත් දී තිබේද?', type: 'single', step: 1,
    options: [
      { value: 'fully', label_en: 'Fully Vaccinated', label_si: 'සම්පූර්ණයෙන් එන්නත්', icon: '💉', color: 'bg-green-50 border-green-200' },
      { value: 'partially', label_en: 'Partially', label_si: 'අර්ධ වශයෙන්', icon: '⚠️', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'not_vaccinated', label_en: 'Not Vaccinated', label_si: 'එන්නත් නැත', icon: '❌', color: 'bg-red-50 border-red-200' },
      { value: 'not_sure', label_en: 'Not Sure', label_si: 'විශ්වාස නැත', icon: '🤷', color: 'bg-gray-50 border-gray-200' },
    ] },

  /* Step 2: Main Symptom */
  { code: 'SD1', text_en: 'What is the main symptom you have noticed?', text_si: 'ඔබ දුටු ප්‍රධාන රෝග ලක්ෂණය කුමක්ද?', type: 'single', step: 2,
    options: [
      { value: 'skin', label_en: 'Skin Problem', label_si: 'සම ගැටලුවක්', icon: '🐾', color: 'bg-orange-50 border-orange-200' },
      { value: 'vomiting', label_en: 'Vomiting', label_si: 'වමනය', icon: '🤮', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'diarrhea', label_en: 'Diarrhea', label_si: 'පාචනය', icon: '💩', color: 'bg-amber-50 border-amber-200' },
      { value: 'coughing', label_en: 'Coughing', label_si: 'කැස්ස', icon: '🫁', color: 'bg-blue-50 border-blue-200' },
      { value: 'injury', label_en: 'Injury', label_si: 'තුවාලයක්', icon: '🩹', color: 'bg-red-50 border-red-200' },
      { value: 'appetite_loss', label_en: 'Loss of Appetite', label_si: 'ආහාර රුචිය නැතිවීම', icon: '🍽️', color: 'bg-purple-50 border-purple-200' },
      { value: 'other', label_en: 'Other', label_si: 'වෙනත්', icon: '❓', color: 'bg-gray-50 border-gray-200' },
    ] },

  /* Step 3 branches — each has visibleWhen */
  /* Skin */
  { code: 'SD2_SKIN', text_en: 'Is there any hair loss?', text_si: 'කෙස් වැටීමක් තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'skin' },
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '✅', color: 'bg-green-50 border-green-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '❌', color: 'bg-red-50 border-red-200' },
      { value: 'not_sure', label_en: 'Not Sure', label_si: 'විශ්වාස නැත', icon: '🤷', color: 'bg-gray-50 border-gray-200' },
    ] },
  { code: 'SD3_SKIN', text_en: 'Is there itching or scratching?', text_si: 'කැසීමක් හෝ긁ීමක් තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'skin' },
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '✅', color: 'bg-green-50 border-green-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '❌', color: 'bg-red-50 border-red-200' },
      { value: 'not_sure', label_en: 'Not Sure', label_si: 'විශ්වාස නැත', icon: '🤷', color: 'bg-gray-50 border-gray-200' },
    ] },
  { code: 'SD4_SKIN', text_en: 'Is there redness or wounds?', text_si: 'රතු පැහැයක් හෝ තුවාල තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'skin' },
    options: [
      { value: 'yes', label_en: 'Yes, redness', label_si: 'ඔව්, රතු පැහැය', icon: '🔴', color: 'bg-red-50 border-red-200' },
      { value: 'wounds', label_en: 'Yes, open wounds', label_si: 'ඔව්, විවෘත තුවාල', icon: '🩹', color: 'bg-red-50 border-red-200' },
      { value: 'both', label_en: 'Both redness and wounds', label_si: 'රතු පැහැය සහ තුවාල දෙකම', icon: '⚠️', color: 'bg-orange-50 border-orange-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '❌', color: 'bg-green-50 border-green-200' },
    ] },

  /* Vomiting */
  { code: 'SD2_VOM', text_en: 'How many times has your pet vomited?', text_si: 'ඔබේ සතා කී වතාවක් වමනය කළේද?', type: 'single', step: 3, visibleWhen: { SD1: 'vomiting' },
    options: [
      { value: 'once', label_en: 'Once', label_si: 'එක් වරක්', icon: '1️⃣', color: 'bg-green-50 border-green-200' },
      { value: 'two_three', label_en: '2-3 times', label_si: 'වාර 2-3ක්', icon: '⚠️', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'more', label_en: 'More than 3 times', label_si: 'වාර 3ට වඩා', icon: '🔴', color: 'bg-orange-50 border-orange-200' },
      { value: 'continuous', label_en: 'Continuously', label_si: 'නොනවත්වා', icon: '🚨', color: 'bg-red-50 border-red-200' },
    ] },
  { code: 'SD3_VOM', text_en: 'Is there blood in the vomit?', text_si: 'වමනයේ ලේ තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'vomiting' }, emergency: true,
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '🚨', color: 'bg-red-50 border-red-200', emergencyTrigger: true },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
    ] },
  { code: 'SD4_VOM', text_en: 'Is your pet eating normally?', text_si: 'ඔබේ සතා සාමාන්‍යයෙන් ආහාර ගනීද?', type: 'single', step: 3, visibleWhen: { SD1: 'vomiting' },
    options: [
      { value: 'yes', label_en: 'Yes, eating normally', label_si: 'ඔව්, සාමාන්‍යයෙන් කයි', icon: '✅', color: 'bg-green-50 border-green-200' },
      { value: 'less', label_en: 'Eating less', label_si: 'අඩුවෙන් කයි', icon: '⚠️', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'nothing', label_en: 'Not eating at all', label_si: 'කිසිවක් නොකයි', icon: '🚫', color: 'bg-red-50 border-red-200' },
    ] },

  /* Diarrhea */
  { code: 'SD2_DIA', text_en: 'Is the stool watery?', text_si: 'මලය ජලමය ද?', type: 'single', step: 3, visibleWhen: { SD1: 'diarrhea' },
    options: [
      { value: 'yes', label_en: 'Yes, very watery', label_si: 'ඔව්, ඉතා ජලමය', icon: '💧', color: 'bg-blue-50 border-blue-200' },
      { value: 'soft', label_en: 'Soft but not watery', label_si: 'මෘදු නමුත් ජලමය නැත', icon: '⚠️', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'mucus', label_en: 'Has mucus', label_si: 'ශ්ලේෂ්මය ඇත', icon: '🔴', color: 'bg-orange-50 border-orange-200' },
    ] },
  { code: 'SD3_DIA', text_en: 'Is there blood in the stool?', text_si: 'මලයේ ලේ තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'diarrhea' },
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '🚨', color: 'bg-red-50 border-red-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
    ] },
  { code: 'SD4_DIA', text_en: 'Does your pet seem weak or dehydrated?', text_si: 'ඔබේ සතා දුර්වල හෝ විජලනය වී පෙනේද?', type: 'single', step: 3, visibleWhen: { SD1: 'diarrhea' },
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '⚠️', color: 'bg-red-50 border-red-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
      { value: 'not_sure', label_en: 'Not Sure', label_si: 'විශ්වාස නැත', icon: '🤷', color: 'bg-gray-50 border-gray-200' },
    ] },

  /* Coughing */
  { code: 'SD2_COU', text_en: 'Is the cough dry or wet?', text_si: 'කැස්ස වියළි ද තෙත් ද?', type: 'single', step: 3, visibleWhen: { SD1: 'coughing' },
    options: [
      { value: 'dry', label_en: 'Dry cough', label_si: 'වියළි කැස්ස', icon: '🌵', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'wet', label_en: 'Wet / productive cough', label_si: 'තෙත් කැස්ස', icon: '💧', color: 'bg-blue-50 border-blue-200' },
      { value: 'not_sure', label_en: 'Not Sure', label_si: 'විශ්වාස නැත', icon: '🤷', color: 'bg-gray-50 border-gray-200' },
    ] },
  { code: 'SD3_COU', text_en: 'Is there difficulty breathing?', text_si: 'හුස්ම ගැනීමේ අපහසුතාවක් තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'coughing' }, emergency: true,
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '🚨', color: 'bg-red-50 border-red-200', emergencyTrigger: true },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
    ] },

  /* Injury */
  { code: 'SD2_INJ', text_en: 'Where is the injury located?', text_si: 'තුවාලය පිහිටා ඇත්තේ කොතැනද?', type: 'text', step: 3, visibleWhen: { SD1: 'injury' }, options: [] },
  { code: 'SD3_INJ', text_en: 'Is your pet limping?', text_si: 'ඔබේ සතා කොරගැසෙනවාද?', type: 'single', step: 3, visibleWhen: { SD1: 'injury' },
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '🦿', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
    ] },
  { code: 'SD4_INJ', text_en: 'Is there heavy bleeding or visible bone?', text_si: 'අධික ලේ ගැලීමක් හෝ පෙනෙන ඇටයක් තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'injury' }, emergency: true,
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '🚨', color: 'bg-red-50 border-red-200', emergencyTrigger: true },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
    ] },

  /* Loss of Appetite */
  { code: 'SD2_APP', text_en: 'How long has the appetite loss lasted?', text_si: 'ආහාර රුචිය නැතිවීම කොපමණ කාලයක් ද?', type: 'single', step: 3, visibleWhen: { SD1: 'appetite_loss' },
    options: [
      { value: 'today', label_en: 'Just today', label_si: 'අද පමණි', icon: '📅', color: 'bg-blue-50 border-blue-200' },
      { value: 'few_days', label_en: 'A few days', label_si: 'දින කිහිපයක්', icon: '📆', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'week', label_en: 'About a week', label_si: 'සතියක් පමණ', icon: '🗓️', color: 'bg-orange-50 border-orange-200' },
      { value: 'longer', label_en: 'More than a week', label_si: 'සතියකට වඩා', icon: '⏳', color: 'bg-red-50 border-red-200' },
    ] },
  { code: 'SD3_APP', text_en: 'Is there also vomiting or diarrhea?', text_si: 'වමනය හෝ පාචනය ද තිබේද?', type: 'single', step: 3, visibleWhen: { SD1: 'appetite_loss' },
    options: [
      { value: 'vomiting', label_en: 'Yes, vomiting', label_si: 'ඔව්, වමනය', icon: '🤮', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'diarrhea', label_en: 'Yes, diarrhea', label_si: 'ඔව්, පාචනය', icon: '💩', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'both', label_en: 'Both', label_si: 'දෙකම', icon: '⚠️', color: 'bg-orange-50 border-orange-200' },
      { value: 'neither', label_en: 'Neither', label_si: 'එකක්වත් නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
    ] },

  /* Other */
  { code: 'SD2_OTHER', text_en: 'Please describe the symptoms you have noticed.', text_si: 'ඔබ දුටු රෝග ලක්ෂණ විස්තර කරන්න.', type: 'text', step: 3, visibleWhen: { SD1: 'other' }, options: [] },

  /* Step 4: Global */
  { code: 'SD5', text_en: 'How long has this problem been happening?', text_si: 'මෙම ගැටලුව කොපමණ කාලයක් තිස්සේ පවතීද?', type: 'single', step: 4,
    options: [
      { value: 'today', label_en: 'Just today', label_si: 'අද පමණි', icon: '📅', color: 'bg-blue-50 border-blue-200' },
      { value: 'few_days', label_en: '2-3 days', label_si: 'දින 2-3ක්', icon: '📆', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'week', label_en: 'About a week', label_si: 'සතියක් පමණ', icon: '🗓️', color: 'bg-orange-50 border-orange-200' },
      { value: 'longer', label_en: 'More than a week', label_si: 'සතියකට වඩා', icon: '⏳', color: 'bg-red-50 border-red-200' },
    ] },
  { code: 'SD6', text_en: 'How severe would you say the symptoms are?', text_si: 'රෝග ලක්ෂණ කෙතරම් දරුණු ද?', type: 'single', step: 4,
    options: [
      { value: 'mild', label_en: 'Mild', label_si: 'සැහැල්ලු', icon: '🟢', color: 'bg-green-50 border-green-200' },
      { value: 'moderate', label_en: 'Moderate', label_si: 'මධ්‍යම', icon: '🟡', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'severe', label_en: 'Severe', label_si: 'දරුණු', icon: '🔴', color: 'bg-red-50 border-red-200' },
    ] },
  { code: 'SD7', text_en: "Has your pet's behaviour changed?", text_si: 'ඔබේ සතාගේ හැසිරීම වෙනස් වී තිබේද?', type: 'single', step: 4,
    options: [
      { value: 'yes', label_en: 'Yes', label_si: 'ඔව්', icon: '⚠️', color: 'bg-yellow-50 border-yellow-200' },
      { value: 'no', label_en: 'No', label_si: 'නැත', icon: '✅', color: 'bg-green-50 border-green-200' },
      { value: 'not_sure', label_en: 'Not Sure', label_si: 'විශ්වාස නැත', icon: '🤷', color: 'bg-gray-50 border-gray-200' },
    ] },
];

/* Emergency trigger rules: { questionCode: triggerValue } */
export const EMERGENCY_RULES = {
  SD3_VOM: 'yes',  // blood in vomit
  SD3_COU: 'yes',  // difficulty breathing
  SD4_INJ: 'yes',  // heavy bleeding / visible bone
};

export const recentActivity = [
  { icon: '📋', title: 'New Health Report Available', subtitle: 'Diagnosis report for Luna is ready to view.', time: '2h ago' },
  { icon: '📅', title: 'Check-up Scheduled', subtitle: 'Appointment with Dr. Smith confirmed for Buddy.', time: '5h ago' },
  { icon: '💊', title: 'Medication Reminder', subtitle: 'Time for Luna\'s evening medication.', time: '1d ago' },
];
