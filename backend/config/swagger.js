const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PetPal API',
      version: '1.0.0',
      description: 'AI-powered pet health diagnosis system API. Use the Authorize button to add your JWT token for protected endpoints.',
      contact: { name: 'PetPal Team' },
    },
    servers: [
      { url: '/api', description: 'API base path' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token from /auth/login response',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            preferred_language: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Pet: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            gender: { type: 'string', enum: ['Male', 'Female', 'Unknown'] },
            weight: { type: 'number' },
            species: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
            breed: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
          },
        },
        Diagnosis: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            primary_label: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            secondary_labels: { type: 'array', items: { type: 'string' } },
            explanation: { type: 'string' },
            recommended_actions: { type: 'array', items: { type: 'string' } },
            severity_flags: { type: 'object' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            sender_type: { type: 'string', enum: ['user', 'ai', 'system'] },
            content: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        ImageAnalysis: {
          type: 'object',
          properties: {
            top_label: { type: 'string' },
            top_confidence: { type: 'number' },
            raw_confidence_percent: { type: 'number' },
            prediction_text: { type: 'string' },
            ml_model: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Register, login, logout, profile' },
      { name: 'Pets', description: 'Pet CRUD and breed/species reference data' },
      { name: 'Consultations', description: 'Start and manage consultations' },
      { name: 'Questionnaire', description: 'Dynamic symptom questionnaire' },
      { name: 'Chat', description: 'AI chat conversation for diagnosis' },
      { name: 'Images', description: 'Image upload and ML analysis' },
      { name: 'Diagnosis', description: 'Fetch diagnosis results' },
      { name: 'Contact', description: 'Contact form' },
      { name: 'Admin', description: 'Admin-only question and rule management' },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
