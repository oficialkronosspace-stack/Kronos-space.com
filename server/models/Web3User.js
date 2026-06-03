const mongoose = require('mongoose');

const Web3UserSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  nonce: {
    type: String,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Web3User', Web3UserSchema);
