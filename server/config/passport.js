const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper: genera JWT igual que login normal ──────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ─── Helper: find-or-create user from OAuth profile ───────────────────────
const findOrCreateOAuthUser = async ({ email, firstName, lastName, avatar, provider }) => {
  // Try to find by email
  let user = await User.findOne({ email });

  if (!user) {
    // Create a new user — no password required for OAuth users
    // Generate a unique username from email prefix
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter++}`;
    }

    user = new User({
      username,
      email,
      // Provide a random password (OAuth users won't use it)
      password: require('crypto').randomBytes(32).toString('hex'),
      firstName: firstName || '',
      lastName: lastName || '',
      avatar: avatar || 'https://via.placeholder.com/150',
      isVerified: true
    });

    await user.save();
    console.log(`[OAuth/${provider}] New user created: ${email}`);
  } else {
    console.log(`[OAuth/${provider}] Existing user found: ${email}`);
  }

  return user;
};

// ─── Google OAuth Strategy ─────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          if (!email) {
            return done(new Error('No email returned from Google'), null);
          }

          const user = await findOrCreateOAuthUser({
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value || 'https://via.placeholder.com/150',
            provider: 'google'
          });

          const token = generateToken(user._id);
          return done(null, { user, token });
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('[Passport] Google OAuth strategy registered');
} else {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[Passport] Google OAuth NOT configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  }
}

// ─── Facebook OAuth Strategy ──────────────────────────────────────────────
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'picture.type(large)']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : `fb_${profile.id}@kronos.noemail`;

          const user = await findOrCreateOAuthUser({
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value || 'https://via.placeholder.com/150',
            provider: 'facebook'
          });

          const token = generateToken(user._id);
          return done(null, { user, token });
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('[Passport] Facebook OAuth strategy registered');
} else {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[Passport] Facebook OAuth NOT configured — set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env');
  }
}

// Passport serialize/deserialize (needed even for stateless JWT usage)
passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));

module.exports = passport;
