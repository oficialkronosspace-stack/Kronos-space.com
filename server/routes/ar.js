const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getARConfig,
  startARSession,
  endARSession,
  saveScreenshot,
  submitFeedback,
} = require('../controllers/arController');

router.use(protect);

router.get('/:productId',             getARConfig);
router.post('/:productId/start',      startARSession);
router.post('/:productId/end',        endARSession);
router.post('/:productId/screenshot', saveScreenshot);
router.post('/:productId/feedback',   submitFeedback);

module.exports = router;
