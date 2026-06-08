const mongoose = require('mongoose');

const emojiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shortcode: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  url: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['social', 'food', 'shop', 'premium', 'animated'],
    default: 'social'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  tierRequired: {
    type: String,
    enum: ['free', 'plus', 'pro', 'business'],
    default: 'free'
  },
  metadata: {
    width: Number,
    height: Number,
    format: String // png, gif, lottie
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Emoji', emojiSchema);
