// Test script to verify all services
// Run: node test_services.js

require('dotenv').config(); // Load .env file
const fetch = require('node-fetch') || globalThis.fetch;
const mysql = require('mysql2/promise');

async function testAll() {
  console.log('🔧 Testing PetPal services...\n');

  // 1. MySQL
  try {
    const conn = await mysql.createConnection({
      host: 'localhost', port: 3306, user: 'root',
      password: '1234@root', database: 'petpal'
    });
    const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM question WHERE is_active=TRUE');
    await conn.end();
    console.log(`✅ MySQL: ${rows[0].cnt} questions in DB`);
  } catch (e) {
    console.log(`❌ MySQL: ${e.message}`);
  }

  // 2. Gemini API
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_NEW_API_KEY_HERE') {
      console.log('❌ Gemini: No API key set in .env');
    } else {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] })
      });
      const d = await r.json();
      if (d.candidates) {
        console.log('✅ Gemini: Working');
      } else if (d.error?.code === 429) {
        console.log('❌ Gemini: Quota exceeded - need new API key');
      } else {
        console.log(`❌ Gemini: ${d.error?.message || 'Unknown error'}`);
      }
    }
  } catch (e) {
    console.log(`❌ Gemini: ${e.message}`);
  }

  // 3. ChromaDB
  try {
    const r = await fetch('http://localhost:8000/api/v2/heartbeat');
    if (r.ok) console.log('✅ ChromaDB: Running (RAG enabled)');
    else console.log(`❌ ChromaDB: Unhealthy (${r.status})`);
  } catch (e) {
    console.log('❌ ChromaDB: Not running - install with: pip install chromadb && chroma run --host localhost --port 8000');
  }

  // 4. Python sidecar
  try {
    const r = await fetch('http://localhost:5001/health');
    if (r.ok) console.log('✅ Python Sidecar: Running (image ML enabled)');
    else console.log(`❌ Python Sidecar: Unhealthy (${r.status})`);
  } catch (e) {
    console.log('❌ Python Sidecar: Not running');
  }

  console.log('\n🎯 Next steps:');
  console.log('1. Fix any ❌ services above');
  console.log('2. Go to http://localhost:5173 (frontend)');
  console.log('3. Start consultation → Fill questionnaire → Chat with AI');
}

testAll();