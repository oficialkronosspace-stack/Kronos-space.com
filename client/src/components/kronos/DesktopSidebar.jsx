import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import IridescentDefs from './IridescentDefs';

const IconHome = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="url(#iridescent-grad)" />
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="url(#gloss-grad)" opacity="0.4" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <circle cx="10.5" cy="10.5" r="7.5" fill="none" stroke="url(#iridescent-grad)" strokeWidth="3"/>
    <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="url(#iridescent-grad)" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);
const IconChat = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="url(#iridescent-grad)"/>
    <circle cx="6" cy="10" r="1.5" fill="#fff"/>
    <circle cx="12" cy="10" r="1.5" fill="#fff"/>
    <circle cx="18" cy="10" r="1.5" fill="#fff"/>
  </svg>
);
const IconNotif = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconCommunities = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconMarket = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="url(#iridescent-grad)" strokeWidth="3"/>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconWallet = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconLive = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <rect x="2" y="4" width="20" height="16" rx="4" fill="none" stroke="url(#iridescent-grad)" strokeWidth="2"/>
    <text x="12" y="14" fontFamily="Arial" fontWeight="bold" fontSize="6" fill="url(#iridescent-grad)" textAnchor="middle">LIVE</text>
  </svg>
);
const IconHealth = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.5 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconAvatar = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <circle cx="12" cy="12" r="10" fill="url(#iridescent-grad)"/>
    <path d="M12 14c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z" fill="#fff"/>
    <circle cx="8.5" cy="9.5" r="1.5" fill="#fff"/>
    <circle cx="15.5" cy="9.5" r="1.5" fill="#fff"/>
  </svg>
);
const IconShop = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.9 18 9 18h12v-2H9.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.45 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconReserv = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconVideo = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconSettings = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconEvents = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" fill="url(#iridescent-grad)"/>
  </svg>
);
const IconGamification = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" filter="url(#3d-glass)">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm7 6c-1.65 0-3-1.35-3-3V5h6v6c0 1.65-1.35 3-3 3zm7-6c0 1.3-.84 2.4-2 2.82V7h2v1z" fill="url(#iridescent-grad)"/>
  </svg>
);

const NAV_ITEMS = [
  { Icon: IconHome,        label: 'Inicio',         to: '/feed' },
  { Icon: IconSearch,      label: 'Buscar',          to: '/search' },
  { Icon: IconChat,        label: 'Mensajes',        to: '/social/chat' },
  { Icon: IconNotif,       label: 'Notificaciones',  to: '/notifications' },
  { Icon: IconCommunities, label: 'Comunidades',     to: '/communities' },
  { Icon: IconShop,        label: 'Tienda',           to: '/shop' },
  { Icon: IconMarket,      label: 'Marketplace',     to: '/marketplace' },
  { Icon: IconWallet,      label: 'Wallet',          to: '/wallet' },
  { Icon: IconLive,        label: 'LIVE',            to: '/live' },
  { Icon: IconHealth,      label: 'Health',          to: '/health' },
  { Icon: IconAvatar,      label: 'Avatar',          to: '/avatar' },
  { Icon: IconReserv,      label: 'Reservaciones',   to: '/reservations' },
  { Icon: IconVideo,       label: 'Video Editor',    to: '/video-editor' },
  { Icon: IconEvents,      label: 'Eventos',         to: '/events' },
  { Icon: IconGamification, label: 'Gamificación',  to: '/gamification' },
  { Icon: IconSettings,    label: 'Ajustes',         to: '/settings' },
];

function SidebarItem({ item, isActive }) {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={item.to}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '9px 12px',
        borderRadius: 14,
        background: isActive
          ? 'radial-gradient(circle at 30% 40%, rgba(79,172,254,0.2), rgba(243,160,255,0.12))'
          : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: isActive ? '1px solid rgba(79,172,254,0.35)' : '1px solid transparent',
        boxShadow: isActive ? '0 0 14px rgba(79,172,254,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
        transition: 'all 0.18s ease',
        cursor: 'pointer',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isActive
            ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2), rgba(79,172,254,0.1))'
            : 'rgba(255,255,255,0.05)',
          border: isActive ? '1px solid rgba(79,172,254,0.4)' : '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isActive ? '0 0 10px rgba(79,172,254,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: 5,
            width: 16, height: 8, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <item.Icon />
        </div>
        <span style={{
          color: isActive ? '#4facfe' : 'rgba(10,10,20,0.65)',
          fontWeight: isActive ? 700 : 400,
          fontSize: 13,
          fontFamily: "'Outfit', sans-serif",
          letterSpacing: 0.2,
        }}>
          {item.label}
        </span>
      </div>
    </NavLink>
  );
}

export default function DesktopSidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const userId = user?._id || user?.id;

  return (
    <aside className="kronos-sidebar">
      <IridescentDefs />

      {/* Logo */}
      <div
        onClick={() => navigate('/feed')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 16, cursor: 'pointer' }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), rgba(79,172,254,0.2) 40%, rgba(243,160,255,0.15))',
          border: '1.5px solid rgba(79,172,254,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff',
          boxShadow: '0 0 16px rgba(79,172,254,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 4, left: 6, width: 18, height: 9, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%)', pointerEvents: 'none' }} />
          K
        </div>
        <span style={{
          fontWeight: 800, fontSize: 18, letterSpacing: -0.5,
          background: 'linear-gradient(135deg,#4facfe,#00f2fe,#f3a0ff,#ff85a2)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Kronos</span>
      </div>

      {/* Nav */}
      {NAV_ITEMS.map(item => (
        <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => <SidebarItem item={item} isActive={isActive} />}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      {/* User */}
      {user && (
        <div style={{ borderTop: '1px solid rgba(79,172,254,0.12)', paddingTop: 16, marginTop: 8 }}>
          <div
            onClick={() => navigate(userId ? `/profile/${userId}` : '/profile/me')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, cursor: 'pointer', marginBottom: 8,
              background: 'rgba(79,172,254,0.04)', border: '1px solid rgba(79,172,254,0.12)' }}
          >
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'K')}&background=7c3aed&color=fff&size=36`}
              alt=""
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(79,172,254,0.4)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#0a0a14', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName || user.username}
              </div>
              <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11 }}>@{user.username}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '8px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'rgba(239,68,68,0.8)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
