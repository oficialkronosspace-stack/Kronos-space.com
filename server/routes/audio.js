const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  joinRoom,
  leaveRoom,
  toggleMute,
  updateSpatial,
  getRoomMetrics,
  transcribe,
  uploadMiddleware,
} = require('../controllers/audioController');

router.use(protect);

router.post('/sessions/join',    joinRoom);
router.post('/sessions/leave',   leaveRoom);
router.post('/sessions/mute',    toggleMute);
router.post('/sessions/spatial', updateSpatial);
router.get('/sessions/metrics',  getRoomMetrics);
// Voz a texto con OpenAI Whisper
router.post('/transcribe', uploadMiddleware, transcribe);

module.exports = router;
