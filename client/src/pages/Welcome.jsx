import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotonBurbuja3D } from '../components/kronos';

const HOLO = 'linear-gradient(135deg,#EC4899,#8B5CF6,#06B6D4)';

export default function Welcome() {
  const navigate = useNavigate();
  const [showFeatures, setShowFeatures] = useState(false);

  const features = [
    { icon: '💬', label: 'Social', desc: 'Feed, stories, chat en tiempo real' },
    { icon: '🛒', label: 'Tienda', desc: 'Compras con checkout Stripe' },
    { icon: '💰', label: 'Wallet', desc: 'Pagos P2P gratis entre usuarios' },
    { icon: '🪙', label: 'Tokens', desc: 'Gana tokens diarios por actividad' },
    { icon: '🎪', label: 'Eventos', desc: 'Boletos con QR y check-in' },
    { icon: '🏆', label: 'Gamificación', desc: 'XP, niveles y badges únicos' },
    { icon: '🎥', label: 'LIVE', desc: 'Streaming y videollamadas' },
    { icon: '🌐', label: 'Comunidades', desc: 'Grupos con roles y moderación' },
    { icon: '🏪', label: 'Marketplace', desc: 'P2P con escrow de seguridad' },
    { icon: '🎮', label: 'Avatar', desc: 'Personaliza tu avatar 3D' },
    { icon: '❤️', label: 'Health', desc: 'Metas diarias y tokens fitness' },
    { icon: '📅', label: 'Reservas', desc: 'Restaurantes y servicios' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px 60px',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── HERO ── */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 2 }}>

        {/* Logo K 3D animado */}
        <div style={{
          width: 140, height: 140, borderRadius: '50%',
          background: HOLO,
          backgroundSize: '200% 200%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 0 60px rgba(139,92,246,0.5), 0 0 100px rgba(236,72,153,0.3)',
          animation: 'k-spin 12s linear infinite, tornasol-hero 8s ease-in-out infinite',
          position: 'relative',
        }}>
          {/* Brillo interior */}
          <div style={{
            position: 'absolute', top: '12%', left: '20%', width: '60%', height: '35%',
            background: 'linear-gradient(180deg,rgba(255,255,255,0.5) 0%,transparent 100%)',
            borderRadius: '50%', filter: 'blur(4px)',
          }} />
          <span style={{
            fontSize: 72, fontWeight: 900, color: '#fff',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            lineHeight: 1, position: 'relative', zIndex: 1,
          }}>K</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(56px, 14vw, 80px)', fontWeight: 900, letterSpacing: 10, margin: '0 0 8px',
          background: 'linear-gradient(90deg,#EC4899,#8B5CF6,#06B6D4,#8B5CF6,#EC4899)',
          backgroundSize: '300% 300%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'tornasol-hero 5s ease-in-out infinite',
          filter: 'drop-shadow(0 4px 16px rgba(139,92,246,0.4)) drop-shadow(0 0 40px rgba(6,182,212,0.2))',
        }}>
          KRONOS
        </h1>
        <p style={{
          fontSize: 'clamp(11px, 3vw, 14px)', fontWeight: 300, letterSpacing: 2,
          background: 'linear-gradient(90deg,rgba(236,72,153,0.6),#8B5CF6,#06B6D4,#8B5CF6,rgba(236,72,153,0.6))',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'slogan-shimmer 6s linear infinite',
          margin: '0 auto 36px',
        }}>
          Tu tiempo. Tu espacio. Tu orden.
        </p>

        {/* Botones burbuja del plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          <BotonBurbuja3D size="lg" onClick={() => navigate('/auth/login')}>
            🚀 Iniciar sesión
          </BotonBurbuja3D>
          <BotonBurbuja3D size="md" variant="outline" onClick={() => navigate('/auth/register')}>
            ✨ Crear cuenta
          </BotonBurbuja3D>
          <button onClick={() => setShowFeatures(v => !v)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(10,10,20,0.4)', fontSize: 13, marginTop: 4,
            textDecoration: 'underline',
          }}>
            {showFeatures ? 'Ocultar features ↑' : 'Ver los 15 mundos ↓'}
          </button>
        </div>
      </div>

      {/* ── GRID DE FEATURES ── */}
      {showFeatures && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 14, width: '100%', maxWidth: 680,
          position: 'relative', zIndex: 2,
        }}>
          {features.map(f => (
            <div key={f.label} style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,255,255,0.85)',
              borderRadius: 20, padding: '20px 14px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,1)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'default',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,1)';
              }}
            >
              {/* Borde tornasol animado */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 20,
                background: 'linear-gradient(135deg,#EC4899,#8B5CF6,#06B6D4)',
                backgroundSize: '200% 200%',
                animation: 'tornasol-hero 4s linear infinite',
                opacity: 0.18, zIndex: 0,
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0a0a14', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.5)', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes k-spin {
          0%   { transform: rotateY(0deg);   }
          100% { transform: rotateY(360deg); }
        }
        @keyframes tornasol-hero {
          0%,100% { background-position: 0% 50%;   }
          50%      { background-position: 100% 50%; }
        }
        @keyframes slogan-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
