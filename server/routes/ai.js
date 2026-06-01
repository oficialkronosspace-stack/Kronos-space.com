const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/auth');
const { requireFeature } = require('../middleware/requireTier');
const {
  generateCaption, generateImage, generateImageVariants,
  analyzeSentiment, generateProductDescription,
  generateHashtags, chat, generateStory
} = require('../controllers/aiController');

// Generación IA requiere plan Pro o superior
router.post('/caption',             auth, requireFeature('aiGenerator'), generateCaption);
router.post('/image',               auth, requireFeature('aiGenerator'), generateImage);
router.post('/image/variants',      auth, requireFeature('aiGenerator'), generateImageVariants);
router.post('/product-description', auth, requireFeature('aiGenerator'), generateProductDescription);
router.post('/hashtags',            auth, requireFeature('aiGenerator'), generateHashtags);
router.post('/chat',                auth, requireFeature('aiGenerator'), chat);
router.post('/story',               auth, requireFeature('aiGenerator'), generateStory);
// Sentiment es uso interno (moderación de posts) — sin restricción de tier
router.post('/sentiment', auth, analyzeSentiment);

module.exports = router;
