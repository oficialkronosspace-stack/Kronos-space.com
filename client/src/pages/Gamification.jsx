import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GlassCard, BotonBurbuja3D } from '../components/kronos';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RARITY_COLOR = {
  common:    { bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', text: '#6b7280', label: 'Común'    },
  rare:      { bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.4)', text: '#3b82f6',  label: 'Raro'     },
  epic:      { bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.4)', text: '#8B5CF6',  label: 'Épico'    },
  legendary: { bg: 'rgba(236,72,153,0.1)',   border: 'rgba(236,72,153,0.5)', text: '#EC4899',  label: 'Legendario'},
};

const LEVEL_TITLES = [
  [1,'Novato'],[5,'Aprendiz'],[10,'Explorador'],[15,'Aventurero'],[20,'Veterano'],
  [25,'Experto'],[30,'Maestro'],[35,'Élite'],[40,'Campeón'],[45,'Leyenda'],[50,'Kronos Legend'],
];
function getLevelTitle(level) {
  let title = 'Novato';
  for (const [l, t] of LEVEL_TITLES) { if (level >= l) title = t; }
  return title;
}

/* ── Barra de progreso XP ── */
function XPBar({ progress, xpForNext }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(10,10,20,0.45)', marginBottom: 6 }}>
        <span>Progreso al siguiente nivel</span>
        <span>{progress}% · faltan {xpForNext.toLocaleString()} XP</span>
      </div>
      <div style={{ height: 10, background: 'rgba(79,172,254,0.1)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg,#EC4899,#8B5CF6,#06B6D4)',
          width: `${Math.min(progress, 100)}%`,
          transition: 'width 1s ease',
          boxShadow: '0 0 8px rgba(139,92,246,0.5)',
        }} />
      </div>
    </div>
  );
}

/* ── Tarjeta de badge ── */
function BadgeCard({ badge, earned }) {
  const r = RARITY_COLOR[badge.rarity] || RARITY_COLOR.common;
  return (
    <div style={{
      background: earned ? r.bg : 'rgba(10,10,20,0.03)',
      border: `1.5px solid ${earned ? r.border : 'rgba(10,10,20,0.08)'}`,
      borderRadius: 16, padding: '14px 12px', textAlign: 'center',
      opacity: earned ? 1 : 0.45,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { if (earned) { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${r.border}`; } }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      {earned && (
        <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: r.text, boxShadow: `0 0 6px ${r.text}` }} />
      )}
      <div style={{ fontSize: 32, marginBottom: 6 }}>{earned ? badge.emoji : '🔒'}</div>
      <div style={{ fontWeight: 700, fontSize: 12, color: '#0a0a14', marginBottom: 2 }}>{badge.name}</div>
      <div style={{ fontSize: 10, color: r.text, fontWeight: 600, marginBottom: 4 }}>{r.label}</div>
      <div style={{ fontSize: 10, color: 'rgba(10,10,20,0.45)', lineHeight: 1.4 }}>{badge.description}</div>
      {earned && <div style={{ fontSize: 10, color: r.text, fontWeight: 700, marginTop: 4 }}>+{badge.xpReward} XP</div>}
    </div>
  );
}

/* ── Página principal ── */
export default function Gamification() {
  const { user } = useContext(AuthContext);
  const [stats, setStats]         = useState(null);
  const [badges, setBadges]       = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('stats'); // stats | badges | leaderboard
  const [rarityFilter, setRarityFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/gamification`),
      axios.get(`${API}/gamification/badges`),
    ]).then(([statsRes, badgesRes]) => {
      setStats(statsRes.data);
      setBadges(badgesRes.data.badges || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'leaderboard' && !leaderboard.length) {
      axios.get(`${API}/gamification/leaderboard`)
        .then(r => setLeaderboard(r.data.leaderboard || []))
        .catch(() => {});
    }
  }, [tab]); // eslint-disable-line

  const filteredBadges = rarityFilter === 'all' ? badges : badges.filter(b => b.rarity === rarityFilter);
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, color: '#0a0a14' }}>🏆 Gamificación</h1>
          <div style={{ color: 'rgba(10,10,20,0.45)', fontSize: 13 }}>XP · Niveles · Badges · Leaderboard</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(79,172,254,0.04)', borderRadius: 14, padding: 4 }}>
          {[
            { id: 'stats',       label: '⚡ Mi Perfil' },
            { id: 'badges',      label: '🏅 Badges' },
            { id: 'leaderboard', label: '🥇 Top 50' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(10,10,20,0.55)',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>Cargando...</div>
        ) : tab === 'stats' && stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Card principal nivel */}
            <GlassCard style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%',
                background: 'linear-gradient(135deg,rgba(236,72,153,0.15),rgba(139,92,246,0.1))',
                filter: 'blur(30px)',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, position: 'relative' }}>
                {/* Círculo de nivel */}
                <div style={{
                  width: 88, height: 88, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#EC4899,#8B5CF6,#06B6D4)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(139,92,246,0.4)',
                }}>
                  <div style={{ color: '#fff', fontSize: 11, fontWeight: 600, opacity: 0.85 }}>NIVEL</div>
                  <div style={{ color: '#fff', fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{stats.level}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#0a0a14' }}>{getLevelTitle(stats.level)}</div>
                  <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 13 }}>{stats.xp.toLocaleString()} XP total</div>
                  <div style={{ color: 'rgba(10,10,20,0.4)', fontSize: 12, marginTop: 2 }}>
                    {earnedCount}/{badges.length} badges desbloqueados
                  </div>
                </div>
              </div>
              <XPBar progress={stats.progress} xpForNext={stats.xpForNext} />
            </GlassCard>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'XP Total', value: stats.totalXpEarned?.toLocaleString(), icon: '⚡' },
                { label: 'Badges',   value: `${earnedCount}/${badges.length}`,      icon: '🏅' },
                { label: 'Nivel',    value: stats.level,                             icon: '🎯' },
              ].map(s => (
                <GlassCard key={s.label} style={{ padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: '#0a0a14' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.45)' }}>{s.label}</div>
                </GlassCard>
              ))}
            </div>

            {/* Badges recientes */}
            {stats.badges?.length > 0 && (
              <GlassCard style={{ padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0a0a14', marginBottom: 12 }}>🏅 Últimos badges</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {stats.badges.slice(-6).map(b => (
                    <div key={b.id} style={{
                      background: RARITY_COLOR[b.rarity]?.bg || 'rgba(79,172,254,0.08)',
                      border: `1px solid ${RARITY_COLOR[b.rarity]?.border || 'rgba(79,172,254,0.2)'}`,
                      borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 18 }}>{b.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0a0a14' }}>{b.name}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('badges')} style={{
                  marginTop: 12, background: 'none', border: 'none', color: '#8B5CF6',
                  cursor: 'pointer', fontWeight: 700, fontSize: 13,
                }}>Ver todos los badges →</button>
              </GlassCard>
            )}

            {/* Rachas */}
            <GlassCard style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0a0a14', marginBottom: 12 }}>🔥 Rachas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Login diario', key: 'login',   icon: '📅' },
                  { label: 'Publicando',   key: 'posting', icon: '📝' },
                  { label: 'Fitness',      key: 'health',  icon: '🏃' },
                ].map(s => (
                  <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#0a0a14' }}>{s.icon} {s.label}</span>
                    <span style={{
                      fontWeight: 800, fontSize: 13,
                      color: (stats.streaks?.[s.key]?.count || 0) > 0 ? '#f97316' : 'rgba(10,10,20,0.3)',
                    }}>
                      {stats.streaks?.[s.key]?.count || 0} días 🔥
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>

        ) : tab === 'badges' ? (
          <div>
            {/* Filtro de rareza */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all','common','rare','epic','legendary'].map(r => (
                <button key={r} onClick={() => setRarityFilter(r)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: rarityFilter === r ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'rgba(79,172,254,0.08)',
                  color: rarityFilter === r ? '#fff' : 'rgba(10,10,20,0.6)',
                  transition: 'all 0.2s',
                }}>
                  {r === 'all' ? 'Todos' : RARITY_COLOR[r]?.label || r}
                  {r !== 'all' && ` (${badges.filter(b => b.rarity === r && b.earned).length}/${badges.filter(b => b.rarity === r).length})`}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {filteredBadges.map(b => <BadgeCard key={b.id} badge={b} earned={b.earned} />)}
            </div>
          </div>

        ) : (
          /* Leaderboard */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
                <div>El leaderboard se está llenando...</div>
              </div>
            ) : leaderboard.map((entry, i) => {
              const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`;
              const isMe = entry.user?._id === (user?._id || user?.id);
              return (
                <GlassCard key={entry.user?._id || i} style={{
                  padding: '12px 16px',
                  border: isMe ? '1.5px solid rgba(139,92,246,0.5)' : undefined,
                  background: isMe ? 'rgba(139,92,246,0.04)' : undefined,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: i < 3 ? 24 : 16, fontWeight: 800, minWidth: 36, textAlign: 'center', color: i < 3 ? undefined : 'rgba(10,10,20,0.4)' }}>{rankIcon}</div>
                    <img src={entry.user?.avatar || `https://ui-avatars.com/api/?name=${entry.user?.username}&background=random`}
                      alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0a0a14' }}>
                        {entry.user?.firstName || entry.user?.username}
                        {entry.user?.isVerified && ' ✅'}
                        {isMe && <span style={{ marginLeft: 6, fontSize: 11, color: '#8B5CF6', fontWeight: 700 }}>(tú)</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.45)' }}>
                        Nivel {entry.level} · {entry.badgeCount} badges
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        {entry.xp.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(10,10,20,0.4)' }}>XP</div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>    </div>
  );
}
