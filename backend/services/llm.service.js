const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are PetPal, an expert AI veterinary assistant. You help pet owners identify possible health conditions in dogs and cats. You are NOT a replacement for a vet. Always recommend professional veterinary care for serious conditions. Be empathetic, clear, and concise.

When you have enough information to make a confident diagnosis, end your response with a JSON block in this exact format:
<DIAGNOSIS>
{
  "primary_label": "string",
  "confidence": 0.0-1.0,
  "secondary_labels": ["string"],
  "explanation": "string",
  "recommended_actions": ["string"],
  "severity": "mild|moderate|severe"
}
</DIAGNOSIS>

If you need more information, just ask follow-up questions without the <DIAGNOSIS> block.`;

/**
 * Build the full user context prompt.
 */
function buildUserPrompt({ pet, jsonAnswers, imageSnapshot, vectorResults, conversationHistory, currentMessage }) {
  let prompt = '';

  // Use questionnaire answers as the primary source of pet info (most recent),
  // only fall back to database pet record when no questionnaire data exists.
  if (jsonAnswers && Object.keys(jsonAnswers).length > 0) {
    prompt += '\n--- QUESTIONNAIRE SUMMARY ---\n';
    if (jsonAnswers.pet) {
      const p = jsonAnswers.pet;
      prompt += `Pet Info: ${p.type || 'Unknown'} | Breed: ${p.breed || 'Unknown'} | Age: ${p.age || 'Unknown'} | Gender: ${p.gender || 'Unknown'} | Neutered: ${p.neutered || 'Unknown'} | Vaccinated: ${p.vaccinated || 'Unknown'}\n`;
    }
    if (jsonAnswers.main_symptom) {
      prompt += `Main Symptom: ${jsonAnswers.main_symptom}\n`;
    }
    if (jsonAnswers.symptom_details && Object.keys(jsonAnswers.symptom_details).length > 0) {
      prompt += `Symptom Details:\n`;
      for (const [key, val] of Object.entries(jsonAnswers.symptom_details)) {
        prompt += `  - ${key}: ${val}\n`;
      }
    }
    if (jsonAnswers.general) {
      const g = jsonAnswers.general;
      if (g.duration) prompt += `Duration: ${g.duration}\n`;
      if (g.severity) prompt += `Severity: ${g.severity}\n`;
      if (g.behaviour_change) prompt += `Behaviour Change: ${g.behaviour_change}\n`;
    }
    if (jsonAnswers.emergency_flags && jsonAnswers.emergency_flags.length > 0) {
      prompt += `Emergency Flags: ${jsonAnswers.emergency_flags.join(', ')}\n`;
    }
    prompt += '--- END QUESTIONNAIRE ---\n\n';
  } else if (pet) {
    // Fallback: no questionnaire data, use database pet record
    prompt += `Pet: ${pet.species_name || 'Unknown'} | Breed: ${pet.breed_name || 'Unknown'} | Age: ${pet.birth_year ? new Date().getFullYear() - pet.birth_year + ' years' : 'Unknown'} | Gender: ${pet.gender || 'Unknown'}\n`;
  }

  if (imageSnapshot && Object.keys(imageSnapshot).length > 0) {
    prompt += `Image analysis result: ${JSON.stringify(imageSnapshot)}\n`;
  }

  if (vectorResults && vectorResults.length > 0) {
    prompt += `\nRelevant past cases (from knowledge base):\n`;
    for (const r of vectorResults) {
      prompt += `- ${r}\n`;
    }
    prompt += '\n';
  }

  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `\nCONVERSATION HISTORY:\n`;
    for (const msg of conversationHistory) {
      const role = msg.sender_type === 'user' ? 'User' : 'AI';
      prompt += `${role}: ${msg.content}\n`;
    }
    prompt += '\n';
  }

  prompt += `USER MESSAGE:\n${currentMessage}`;

  return prompt;
}

/**
 * Call Gemini API.
 */
async function callGemini(userPrompt) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}` }
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const MAX_RETRIES = 2;
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    }

    const errBody = await response.text();

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const waitMs = (attempt + 1) * 5000;
      console.warn(`Gemini rate-limited (429), retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
      await new Promise((r) => setTimeout(r, waitMs));
      lastError = new Error('RATE_LIMITED');
      lastError.status = 429;
      continue;
    }

    const err = new Error(
      response.status === 429
        ? 'Our AI service is temporarily busy due to high demand. Please try again in a few moments.'
        : `Gemini API error ${response.status}`
    );
    err.status = response.status;
    throw err;
  }

  throw lastError;
}

/**
 * Parse the <DIAGNOSIS>...</DIAGNOSIS> block from the LLM response.
 * Returns { reply, diagnosis } where reply has the block stripped.
 */
function parseDiagnosisBlock(rawResponse) {
  const regex = /<DIAGNOSIS>\s*([\s\S]*?)\s*<\/DIAGNOSIS>/;
  const match = rawResponse.match(regex);

  if (!match) {
    return { reply: rawResponse.trim(), diagnosis: null };
  }

  try {
    const diagnosis = JSON.parse(match[1]);
    const reply = rawResponse.replace(regex, '').trim();
    return { reply, diagnosis };
  } catch {
    return { reply: rawResponse.trim(), diagnosis: null };
  }
}

/**
 * Full LLM service call: build prompt → call Gemini → parse.
 */
async function getLLMResponse(context) {
  const userPrompt = buildUserPrompt(context);
  const rawResponse = await callGemini(userPrompt);
  return parseDiagnosisBlock(rawResponse);
}

module.exports = { getLLMResponse, buildUserPrompt, callGemini, parseDiagnosisBlock };
