const { Gamification, BADGES } = require('../models/Gamification');

// ── Helper: obtener o crear perfil ──
async function getOrCreate(userId) {
  let g = await Gamification.findOne({ user: userId });
  if (!g) g = await Gamification.create({ user: userId });
  return g;
}

// ── Helper: incrementar racha (login | posting | health) ──
// Retorna el nuevo conteo de la racha
function updateStreak(g, type) {
  const streak = g.streaks[type];
  if (!streak) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (!streak.lastDate) {
    streak.count   = 1;
    streak.lastDate = today;
    return 1;
  }

  const last = new Date(streak.lastDate);
  last.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.round((today - last) / 86_400_000);

  if (diffDays === 0) {
    return streak.count; // ya actualizado hoy
  } else if (diffDays === 1) {
    streak.count++;
  } else {
    streak.count = 1; // racha rota
  }
  streak.lastDate = today;
  return streak.count;
}

// Mapa: acción → tipo de racha a actualizar
const ACTION_STREAK_MAP = {
  post_created:  'posting',
  health_logged: 'health',
};

// ── Función interna: añadir XP, actualizar racha y verificar nivel + badges ──
async function addXpInternal(userId, amount, action) {
  const g = await getOrCreate(userId);
  g.xp += amount;
  g.totalXpEarned += amount;
  const newLevel = Gamification.xpToLevel(g.xp);
  const leveledUp = newLevel > g.level;
  g.level = newLevel;

  // Actualizar racha según la acción
  const streakType = ACTION_STREAK_MAP[action];
  let streakCount = 0;
  if (streakType) {
    streakCount = updateStreak(g, streakType);
  }

  // Verificar badges automáticos según acción
  const badgesToCheck = {
    post_created:      ['primer_post'],
    follow_user:       ['social_starter'],
    order_placed:      ['comprador'],
    message_sent:      ['chateador'],
    comment_created:   ['comentarista'],
    review_left:       ['reseñista'],
    health_logged:     ['saludable'],
    wallet_used:       ['wallet_user'],
    ticket_bought:     ['event_goer'],
    live_started:      ['streamer'],
    community_created: ['comunero'],
    marketplace_sold:  ['trader'],
  };

  const toCheck = badgesToCheck[action] || [];
  const newBadges = [];

  for (const badgeId of toCheck) {
    if (!g.badges.includes(badgeId)) {
      g.badges.push(badgeId);
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) {
        g.xp += badge.xpReward;
        g.totalXpEarned += badge.xpReward;
        newBadges.push(badge);
      }
    }
  }

  // Badge 'maratonista' — 30 días de racha de salud
  if (streakType === 'health' && streakCount >= 30 && !g.badges.includes('maratonista')) {
    g.badges.push('maratonista');
    const badge = BADGES.find(b => b.id === 'maratonista');
    if (badge) { g.xp += badge.xpReward; g.totalXpEarned += badge.xpReward; newBadges.push(badge); }
  }

  // Badge de nivel 50
  if (g.level >= 50 && !g.badges.includes('kronos_legend')) {
    g.badges.push('kronos_legend');
    const badge = BADGES.find(b => b.id === 'kronos_legend');
    if (badge) { g.xp += badge.xpReward; g.totalXpEarned += badge.xpReward; }
    newBadges.push(BADGES.find(b => b.id === 'kronos_legend'));
  }

  g.level = Gamification.xpToLevel(g.xp);
  await g.save();
  return { g, leveledUp, newBadges, streakCount };
}

// POST /api/gamification/add-xp — Añadir XP (uso interno desde otros controladores)
exports.addXp = async (req, res) => {
  try {
    const { amount = 10, action = '' } = req.body;
    const { g, leveledUp, newBadges } = await addXpInternal(req.user.id, Number(amount), action);
    res.json({ success: true, xp: g.xp, level: g.level, leveledUp, newBadges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Exportada para uso interno desde otros controladores
exports.addXpInternal = addXpInternal;

// GET /api/gamification — Mis estadísticas de gamificación
exports.getMyStats = async (req, res) => {
  try {
    const g = await getOrCreate(req.user.id);
    const currentLevelXp = Gamification.levelToXp(g.level);
    const nextLevelXp    = Gamification.levelToXp(g.level + 1);
    const progress       = nextLevelXp > currentLevelXp
      ? Math.round(((g.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
      : 100;

    const earnedBadges   = BADGES.filter(b => g.badges.includes(b.id));
    const lockedBadges   = BADGES.filter(b => !g.badges.includes(b.id));

    res.json({
      success: true,
      xp: g.xp,
      level: g.level,
      progress,
      xpForNext: nextLevelXp - g.xp > 0 ? nextLevelXp - g.xp : 0,
      totalXpEarned: g.totalXpEarned,
      badges: earnedBadges,
      lockedBadges,
      streaks: g.streaks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/gamification/leaderboard — Top 100 por XP
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const top = await Gamification.find()
      .sort({ xp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'username avatar firstName lastName isVerified');

    // Encontrar la posición del usuario actual
    let myRank = null;
    if (req.user) {
      myRank = await Gamification.countDocuments({ xp: { $gt: (await getOrCreate(req.user.id)).xp } }) + 1;
    }

    res.json({
      success: true,
      leaderboard: top.map((g, i) => ({
        rank: skip + i + 1,
        user: g.user,
        xp: g.xp,
        level: g.level,
        badgeCount: g.badges.length,
        topBadge: g.badges.length ? BADGES.find(b => b.id === g.badges[g.badges.length - 1]) : null,
      })),
      myRank,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/gamification/badges — Todos los badges (ganados + por ganar)
exports.getAllBadges = async (req, res) => {
  try {
    const g = await getOrCreate(req.user.id);
    res.json({
      success: true,
      badges: BADGES.map(b => ({
        ...b,
        earned: g.badges.includes(b.id),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/gamification/login-streak — Registrar login diario y actualizar racha
exports.recordLoginStreak = async (req, res) => {
  try {
    const g = await getOrCreate(req.user.id);
    const count = updateStreak(g, 'login');
    // XP bonus por racha de login
    const xpBonus = count > 1 ? Math.min(count * 5, 50) : 5;
    g.xp += xpBonus;
    g.totalXpEarned += xpBonus;
    g.level = Gamification.xpToLevel(g.xp);
    await g.save();
    res.json({ success: true, loginStreak: count, xpGained: xpBonus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/gamification/user/:userId — Stats públicas de otro usuario
exports.getUserStats = async (req, res) => {
  try {
    const g = await Gamification.findOne({ user: req.params.userId });
    if (!g) return res.json({ success: true, xp: 0, level: 1, badges: [] });

    const earnedBadges = BADGES.filter(b => g.badges.includes(b.id));
    res.json({ success: true, xp: g.xp, level: g.level, badges: earnedBadges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
