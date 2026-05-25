import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const userId = user?._id || user?.id;

  return (
    <>
      <style>{`
        @keyframes kronos-tornasol {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes kronos-glow-fade {
          0%,100% { text-shadow: 0 0 18px rgba(236,72,153,0.5), 0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(6,182,212,0.15); }
          33%     { text-shadow: 0 0 24px rgba(139,92,246,0.6), 0 0 48px rgba(6,182,212,0.35), 0 0 90px rgba(236,72,153,0.15); }
          66%     { text-shadow: 0 0 20px rgba(6,182,212,0.55), 0 0 44px rgba(236,72,153,0.3), 0 0 85px rgba(139,92,246,0.15); }
        }
        @keyframes slogan-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(255,255,255,0.92)',
        borderBottom: '1px solid rgba(139,92,246,0.12)',
        backdropFilter: 'blur(20px)',
        fontFamily: "'Outfit', sans-serif",
        padding: '10px 16px',
      }}>
        <div style={{
          maxWidth: 680,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>

          {/* Avatar izquierda */}
          <div
            onClick={() => navigate(userId ? `/profile/${userId}` : '/auth/login')}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg,#EC4899,#8B5CF6,#06B6D4)',
              padding: 2,
              boxShadow: '0 0 12px rgba(139,92,246,0.4)',
            }}>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'K')}&background=8B5CF6&color=fff&size=40`}
                alt=""
                style={{
                  width: '100%', height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                  border: '2px solid rgba(255,255,255,0.9)',
                }}
              />
            </div>
          </div>

          {/* Centro — KRONOS + slogan */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            {/* KRONOS 3D tornasol */}
            <div style={{
              fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 900,
              letterSpacing: '0.18em',
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #06B6D4, #8B5CF6, #EC4899)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'kronos-tornasol 5s ease-in-out infinite, kronos-glow-fade 5s ease-in-out infinite',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              // Sombra desvanecida tornasol (filtro sobre el contenedor)
              filter: 'drop-shadow(0 2px 8px rgba(139,92,246,0.35)) drop-shadow(0 0 20px rgba(6,182,212,0.2))',
            }}>
              KRONOS
            </div>

            {/* Slogan */}
            <div style={{
              fontSize: 'clamp(9px, 2.2vw, 11px)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              background: 'linear-gradient(90deg, rgba(236,72,153,0.5), #8B5CF6, #06B6D4, #8B5CF6, rgba(236,72,153,0.5))',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'slogan-shimmer 6s linear infinite',
              marginTop: 2,
              whiteSpace: 'nowrap',
            }}>
              Tu tiempo. Tu espacio. Tu orden.
            </div>
          </div>

          {/* Lupa derecha */}
          <div
            onClick={() => navigate('/search')}
            style={{
              flexShrink: 0,
              width: 40, height: 40,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), rgba(139,92,246,0.12))',
              border: '1.5px solid rgba(139,92,246,0.25)',
              backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.6)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.6)'}
          >
            🔍
          </div>

        </div>
      </nav>
    </>
  );
}
