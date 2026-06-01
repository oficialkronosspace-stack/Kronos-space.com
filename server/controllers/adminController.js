const User         = require('../models/User');
const Post         = require('../models/Post');
const Subscription = require('../models/Subscription');

let Report;
try { Report = require('../models/Report'); } catch {}

exports.getStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      newUsersLast30,
      totalPosts,
      pendingReports,
      activeSubs,
      proSubs,
      businessSubs,
      bannedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Post.countDocuments(),
      Report ? Report.countDocuments({ status: 'pending' }) : Promise.resolve(0),
      Subscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
      Subscription.countDocuments({ status: { $in: ['active', 'trialing'] }, tier: 'pro' }),
      Subscription.countDocuments({ status: { $in: ['active', 'trialing'] }, tier: 'business' }),
      User.countDocuments({ banned: true }),
    ]);

    res.json({
      users: { total: totalUsers, newLast30: newUsersLast30, banned: bannedUsers },
      posts: { total: totalPosts },
      reports: { pending: pendingReports },
      subscriptions: { active: activeSubs, pro: proSubs, business: businessSubs },
      ts: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, q = '', tier = '', role = '' } = req.query;
    const filter = {};
    if (q) filter.$or = [{ username: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (tier) filter.tier = tier;
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(+limit)
        .skip((+page - 1) * +limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({ users, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { banned: true, bannedAt: new Date() },
      { new: true }
    ).select('-password');
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { banned: false, bannedAt: null },
      { new: true }
    ).select('-password');
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listPosts = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId = '' } = req.query;
    const filter = {};
    if (userId) filter.author = userId;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(+limit)
        .skip((+page - 1) * +limit)
        .lean(),
      Post.countDocuments(filter)
    ]);

    res.json({ posts, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const p = await Post.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: 'Post no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listReports = async (req, res) => {
  try {
    if (!Report) return res.json({ reports: [], total: 0 });
    const { status = '', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).limit(+limit).skip((+page - 1) * +limit).lean(),
      Report.countDocuments(filter)
    ]);

    res.json({ reports, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    if (!Report) return res.status(404).json({ error: 'Report model no disponible' });
    const r = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    if (!r) return res.status(404).json({ error: 'Reporte no encontrado' });
    res.json(r);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/subscriptions — lista suscripciones con datos del usuario
exports.listSubscriptions = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [subs, total] = await Promise.all([
      Subscription.find(filter)
        .sort({ createdAt: -1 })
        .limit(+limit)
        .skip((+page - 1) * +limit)
        .lean(),
      Subscription.countDocuments(filter)
    ]);

    // Enrich with user data
    const userIds = [...new Set(subs.map(s => s.userId?.toString()).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('username email avatar tier').lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const enriched = subs.map(s => ({
      ...s,
      user: userMap[s.userId?.toString()] || null
    }));

    res.json({ subscriptions: enriched, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
