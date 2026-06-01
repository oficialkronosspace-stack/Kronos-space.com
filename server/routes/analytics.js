const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireFeature } = require('../middleware/requireTier');
const {
  getAttentionMetrics,
  createAttentionMetric,
  getInteractions,
  createInteraction
} = require('../controllers/analyticsController');

router.use(protect);

// Analytics avanzado requiere plan Business
router.get('/attention',    requireFeature('advancedAnalytics'), getAttentionMetrics);
router.post('/attention',   requireFeature('advancedAnalytics'), createAttentionMetric);
router.get('/interactions', requireFeature('advancedAnalytics'), getInteractions);

module.exports = router;
