const express = require('express');
const { protect: auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const videoController = require('../controllers/videoController');

const router = express.Router();

// Upload video
router.post('/', auth, upload.single('video'), videoController.uploadVideo);

// Get videos
router.get('/public', videoController.getPublicVideos);
router.get('/user', auth, videoController.getUserVideos);
router.get('/:videoId', videoController.getVideo);

// Like video
router.post('/:videoId/like', auth, videoController.likeVideo);

// Delete video
router.delete('/:videoId', auth, videoController.deleteVideo);

module.exports = router;
