require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const corsOptions = require('./config/cors');
const { specs, swaggerUi } = require('./config/swagger');
const routes = require('./routes/index');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initVectorDB } = require('./services/vectordb.service');

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Security & Parsing ---------------
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --------------- Static Files ---------------
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// --------------- Swagger Docs ---------------
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'PetPal API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));

// --------------- API Routes ---------------
app.use('/api', apiLimiter, routes);

// --------------- Error Handling ---------------
app.use(notFoundHandler);
app.use(globalErrorHandler);

// --------------- Start ---------------
async function start() {
  try {
    await initVectorDB();
    console.log('ChromaDB initialized');
  } catch (err) {
    console.warn('ChromaDB init warning (non-fatal):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`PetPal API running on http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api/docs`);
  });
}

start();
