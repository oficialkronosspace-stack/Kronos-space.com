const webpush = require('web-push');
const User = require('../models/User');

let _configured = false;

function _isConfigured() {
  return (
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

function _configure() {
  if (_configured) return true;
  if (!_isConfigured()) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  _configured = true;
  return true;
}

// Web Push es opcional — sin VAPID keys las notificaciones push simplemente se omiten

exports.sendPush = async (userId, payload) => {
  try {
    if (!_configure()) return false;

    const user = await User.findById(userId).select('pushSubscription');
    if (!user?.pushSubscription?.endpoint) return false;

    const body = typeof payload === 'string' ? { body: payload } : payload;
    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify({ title: 'Kronos', ...body })
    );
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
    }
    console.error('Push send error:', error.message);
    return false;
  }
};

exports.broadcastPush = async (userIds, payload) => {
  const results = await Promise.allSettled(
    userIds.map((id) => exports.sendPush(id, payload))
  );
  return results.filter((r) => r.status === 'fulfilled' && r.value).length;
};

exports.getPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;
