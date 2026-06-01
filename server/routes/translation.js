const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLanguages,
  detectLanguage,
  translateText,
  batchTranslate,
  getHistory,
} = require('../controllers/translationController');

router.get('/languages',  protect, getLanguages);
router.post('/detect',    protect, detectLanguage);
router.post('/translate', protect, translateText);
router.post('/batch',     protect, batchTranslate);
router.get('/history',    protect, getHistory);

module.exports = router;
