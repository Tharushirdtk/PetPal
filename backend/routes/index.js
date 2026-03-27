const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/pets', require('./pet.routes'));
router.use('/species', require('./pet.routes'));
router.use('/breeds', require('./pet.routes'));
router.use('/consultations', require('./consultation.routes'));
router.use('/questionnaire', require('./questionnaire.routes'));
router.use('/diagnosis', require('./diagnosis.routes'));
router.use('/images', require('./image.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/chat', require('./chat.routes'));
router.use('/admin', require('./admin.routes'));

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

module.exports = router;
