const mongoose = require('mongoose');

// ── Definición de badges disponibles ──
const BADGES = [
  // Comunes
  { id: 'primer_post',     name: 'Primer Post',       emoji: '📝', rarity: 'common',    description: 'Publicaste tu primer post',              xpReward: 50  },
  { id: 'social_starter',  name: 'Social Starter',    emoji: '👋', rarity: 'common',    description: 'Seguiste a 5 personas',                  xpReward: 30  },
  { id: 'comprador',       name: 'Comprador',         emoji: '🛒', rarity: 'common',    description: 'Realizaste tu primera compra',           xpReward: 80  },
  { id: 'chateador',       name: 'Chateador',         emoji: '💬', rarity: 'common',    description: 'Enviaste 10 mensajes',                   xpReward: 40  },
  { id: 'explorador',      name: 'Explorador',        emoji: '🗺️', rarity: 'common',    description: 'Visitaste 5 secciones diferentes',      xpReward: 25  },
  { id: 'comentarista',    name: 'Comentarista',      emoji: '💭', rarity: 'common',    description: 'Hiciste 10 comentarios',                 xpReward: 35  },
  { id: 'reseñista',       name: 'Reseñista',         emoji: '⭐', rarity: 'common',    description: 'Dejaste 3 reseñas de productos',        xpReward: 45  },
  { id: 'saludable',       name: 'Saludable',         emoji: '🏃', rarity: 'common',    description: 'Registraste actividad 3 días seguidos',  xpReward: 60  },
  { id: 'wallet_user',     name: 'Wallet User',       emoji: '💳', rarity: 'common',    description: 'Usaste el wallet por primera vez',      xpReward: 50  },
  { id: 'event_goer',      name: 'Event Goer',        emoji: '🎟️', rarity: 'common',    description: 'Obtuviste tu primer boleto',             xpReward: 70  },
  // Raros
  { id: 'influencer',      name: 'Influencer',        emoji: '🌟', rarity: 'rare',      description: 'Consiguiste 50 seguidores',              xpReward: 200 },
  { id: 'content_king',    name: 'Content King',      emoji: '👑', rarity: 'rare',      description: 'Publicaste 50 posts',                    xpReward: 300 },
  { id: 'trader',          name: 'Trader',            emoji: '🤝', rarity: 'rare',      description: 'Vendiste en el marketplace',             xpReward: 250 },
  { id: 'streamer',        name: 'Streamer',          emoji: '🎥', rarity: 'rare',      description: 'Hiciste tu primer LIVE',                 xpReward: 180 },
  { id: 'comunero',        name: 'Comunero',          emoji: '🏘️', rarity: 'rare',      description: 'Creaste una comunidad',                  xpReward: 220 },
  // Épicos
  { id: 'kronos_og',       name: 'Kronos OG',         emoji: '🔮', rarity: 'epic',      description: 'Uno de los primeros 1000 usuarios',      xpReward: 1000},
  { id: 'millonario',      name: 'Millonario',        emoji: '💎', rarity: 'epic',      description: 'Acumulaste 10,000 tokens',              xpReward: 800 },
  { id: 'maratonista',     name: 'Maratonista',       emoji: '🏅', rarity: 'epic',      description: '30 días de racha de salud',              xpReward: 600 },
  // Legendario
  { id: 'kronos_legend',   name: 'Kronos Legend',     emoji: '🌈', rarity: 'legendary', description: 'Alcanzaste el nivel 50',                 xpReward: 5000},
];

// ── Perfil de gamificación por usuario ──
const gamificationSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  xp:          { type: Number, default: 0, min: 0 },
  level:       { type: Number, default: 1, min: 1 },
  badges:      [{ type: String }],   // array de badge IDs ganados
  streaks: {
    login:     { count: { type: Number, default: 0 }, lastDate: Date },
    posting:   { count: { type: Number, default: 0 }, lastDate: Date },
    health:    { count: { type: Number, default: 0 }, lastDate: Date },
  },
  totalXpEarned: { type: Number, default: 0 },
}, { timestamps: true });

gamificationSchema.index({ xp: -1 });
gamificationSchema.index({ level: -1 });

// Calcula nivel a partir de XP: nivel = floor(sqrt(xp/100)) + 1
gamificationSchema.statics.xpToLevel = function (xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// XP necesario para alcanzar cierto nivel
gamificationSchema.statics.levelToXp = function (level) {
  return Math.pow(level - 1, 2) * 100;
};

const Gamification = mongoose.model('Gamification', gamificationSchema);

module.exports = { Gamification, BADGES };
