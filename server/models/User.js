const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: 3
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [/.+@.+\..+/, 'Please provide a valid email']
    },
    password: {
      type: String,
      // Not required for OAuth users (Google/Facebook)
      minlength: 6,
      select: false
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    avatar: {
      type: String
    },
    bio: {
      type: String,
      maxlength: 500
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    location: String,
    website: String,
    role: {
      type: String,
      enum: ['user', 'admin', 'seller'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    },
    suspended: {
      type: Boolean,
      default: false
    },
    suspendReason: String,

    // ── Kronos Pro / Suscripciones ──
    tier: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free',
      index: true
    },
    stripeCustomerId: {
      type: String,
      index: true,
      sparse: true
    },
    dailyPostCount: {
      type: Number,
      default: 0
    },
    lastPostReset: {
      type: Date
    },
    features: {
      unlimitedPosts: { type: Boolean, default: false },
      aiGenerator: { type: Boolean, default: false },
      noAds: { type: Boolean, default: false },
      verifiedBadge: { type: Boolean, default: false },
      premiumStickers: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      customShop: { type: Boolean, default: false }
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    kronosTokens: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

// Indexes (email and username unique indexes are also declared in schema fields above)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Asignar avatar por defecto usando UI Avatars si no tiene foto
userSchema.pre('save', function (next) {
  if (!this.avatar) {
    const displayName = this.firstName
      ? `${this.firstName}${this.lastName ? ' ' + this.lastName : ''}`
      : this.username || 'User';
    this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=150`;
  }
  next();
});

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

// Comparar contraseñas
userSchema.methods.matchPassword = async function (enterPassword) {
  return await bcryptjs.compare(enterPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
