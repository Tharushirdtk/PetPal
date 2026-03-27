const { ChromaClient } = require('chromadb');

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost';
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT, 10) || 8000;
const PYTHON_SIDECAR_URL = process.env.PYTHON_SIDECAR_URL || 'http://localhost:5001';
const COLLECTION_NAME = 'petpal_diagnoses';

let client = null;
let collection = null;

/**
 * Initialize ChromaDB client and ensure collection exists.
 */
async function initVectorDB() {
  client = new ChromaClient({ path: `http://${CHROMA_HOST}:${CHROMA_PORT}` });
  collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { description: 'PetPal diagnosis embeddings for RAG' },
  });
  console.log(`ChromaDB collection "${COLLECTION_NAME}" ready`);
}

/**
 * Get embeddings from the Python sidecar.
 */
async function getEmbeddings(texts) {
  const response = await fetch(`${PYTHON_SIDECAR_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });

  if (!response.ok) {
    throw new Error(`Embedding sidecar error: ${response.status}`);
  }

  const data = await response.json();
  return data.embeddings;
}

/**
 * Add a diagnosis to the vector store.
 */
async function addDiagnosisToVectorDB(diagnosisId, text, metadata = {}) {
  if (!collection) {
    console.warn('ChromaDB not initialized, skipping vector insert');
    return;
  }

  try {
    const embeddings = await getEmbeddings([text]);

    await collection.add({
      ids: [`diagnosis_${diagnosisId}`],
      embeddings,
      documents: [text],
      metadatas: [{ diagnosis_id: diagnosisId, ...metadata }],
    });
  } catch (err) {
    console.error('Failed to add diagnosis to vector DB:', err.message);
  }
}

/**
 * Query similar diagnoses from vector store.
 */
async function querySimilar(queryText, topK = 3) {
  if (!collection) {
    console.warn('ChromaDB not initialized, returning empty results');
    return [];
  }

  try {
    const embeddings = await getEmbeddings([queryText]);

    const results = await collection.query({
      queryEmbeddings: embeddings,
      nResults: topK,
    });

    if (!results.documents || results.documents.length === 0) {
      return [];
    }

    return results.documents[0].map((doc, i) => {
      const meta = results.metadatas?.[0]?.[i] || {};
      return `[Past case – ${meta.primary_label || 'unknown'}] ${doc}`;
    });
  } catch (err) {
    console.error('ChromaDB query failed:', err.message);
    return [];
  }
}

module.exports = { initVectorDB, addDiagnosisToVectorDB, querySimilar };
