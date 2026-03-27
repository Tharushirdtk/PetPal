const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
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

  if (pet) {
    prompt += `Pet: ${pet.species_name || 'Unknown'} | Age: ${pet.birth_year ? new Date().getFullYear() - pet.birth_year + ' years' : 'Unknown'} | Gender: ${pet.gender || 'Unknown'}\n`;
  }

  if (jsonAnswers && Object.keys(jsonAnswers).length > 0) {
    prompt += `Symptom answers: ${JSON.stringify(jsonAnswers)}\n`;
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

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
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
