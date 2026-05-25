import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import IridescentDefs from './IridescentDefs';

const ExpandableBubbleNav = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(null);
  const [level, setLevel] = useState(0);
  const userId = user?._id || user?.id;

  // Estructura jerárquica de burbujas
  const bubbleStructure = {
    main: {
      id: 'inicio',
      icon: '🏠',
      label: 'Inicio',
      color: '#4facfe',
    },
    categories: {
      crear: {
        id: 'crear',
        icon: '📝',
        label: 'Crear',
        color: '#f3a0ff',
        subs: [
          { icon: '📄', label: 'Post', path: '/feed' },
          { icon: '📸', label: 'Foto', path: '/social/create-photo' },
          { icon: '🎥', label: 'Video', path: '/video-editor' },
          { icon: '📖', label: 'Historia', path: '/social/stories' },
          { icon: '🎬', label: 'Reels', path: '/social/reels' },
        ],
      },
      mensajes: {
        id: 'mensajes',
        icon: '💬',
        label: 'Mensajes',
        color: '#00f2fe',
        subs: [
          { icon: '💭', label: 'Chat Directo', path: '/social/chat' },
          { icon: '👥', label: 'Grupos', path: '/social/groups' },
          { icon: '🏘️', label: 'Comunidades', path: '/communities' },
          { icon: '🔴', label: 'Salas LIVE', path: '/live' },
          { icon: '🎪', label: 'Eventos', path: '/events' },
        ],
      },
      perfil: {
        id: 'perfil',
        icon: '👤',
        label: 'Perfil',
        color: '#ff85a2',
        subs: [
          { icon: '👁️', label: 'Mi Perfil', path: userId ? `/profile/${userId}` : '/profile/me' },
          { icon: '✏️', label: 'Editar', path: '/settings/profile' },
          { icon: '🏪', label: 'Mi Tienda', path: '/shop' },
          { icon: '🛒', label: 'Mis Compras', path: '/marketplace' },
          { icon: '💰', label: 'Cartera', path: '/wallet' },
          { icon: '🏆', label: 'Gamificación', path: '/gamification' },
          { icon: '📊', label: 'Estadísticas', path: '/settings/stats' },
        ],
      },
      tiendas: {
        id: 'tiendas',
        icon: '🛍️',
        label: 'Tiendas',
        color: '#ff9500',
        subs: [
          { icon: '👕', label: 'Ropa', path: '/shop/category/ropa' },
          { icon: '⚡', label: 'Electrónica', path: '/shop/category/electronica' },
          { icon: '🏠', label: 'Hogar', path: '/shop/category/hogar' },
          { icon: '📿', label: 'Accesorios', path: '/shop/category/accesorios' },
          { icon: '⚽', label: 'Deportes', path: '/shop/category/deportes' },
          { icon: '🍔', label: 'Comida', path: '/shop/category/comida' },
          { icon: '🎁', label: 'Regalos', path: '/shop/category/regalos' },
        ],
      },
      notificaciones: {
        id: 'notificaciones',
        icon: '🔔',
        label: 'Notificaciones',
        color: '#ff6b6b',
        subs: [
          { icon: '💬', label: 'Comentarios', path: '/notifications?type=comments' },
          { icon: '❤️', label: 'Me Gusta', path: '/notifications?type=likes' },
          { icon: '👥', label: 'Seguidos', path: '/notifications?type=follows' },
          { icon: '@', label: 'Menciones', path: '/notifications?type=mentions' },
          { icon: '📧', label: 'Mensajes Nuevos', path: '/notifications?type=messages' },
          { icon: '⚡', label: 'Actividad', path: '/notifications?type=activity' },
          { icon: '📬', label: 'Invitaciones', path: '/notifications?type=invites' },
        ],
      },
    },
  };

  // Calcular posiciones en círculo
  const getCirclePosition = (index, total, radius = 140) => {
    const angle = (index / total) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Renderizar burbujas secundarias
  const renderSubBubbles = (category) => {
    const subs = category.subs;
    const total = subs.length;
    const radius = 180;

    return subs.map((sub, idx) => {
      const pos = getCirclePosition(idx, total, radius);
      return (
        <div
          key={sub.path}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.05}s backwards`,
          }}
        >
          <button
            onClick={() => {
              navigate(sub.path);
              setExpanded(null);
              setLevel(0);
            }}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '1.5px solid rgba(79,172,254,0.3)',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2), rgba(79,172,254,0.1) 50%, rgba(243,160,255,0.08))',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(79,172,254,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              transition: 'all 0.2s ease',
              fontSize: 24,
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.15)';
              e.target.style.boxShadow = '0 8px 24px rgba(243,160,255,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 16px rgba(79,172,254,0.2), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
          >
            <span>{sub.icon}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(10,10,20,0.6)', textAlign: 'center', maxWidth: '100%' }}>
              {sub.label}
            </span>
          </button>
        </div>
      );
    });
  };

  // Renderizar categorías expandidas
  const renderCategories = () => {
    const categories = Object.values(bubbleStructure.categories);
    const total = categories.length;
    const radius = 160;

    return categories.map((cat, idx) => {
      const pos = getCirclePosition(idx, total, radius);
      const isActive = expanded === cat.id;

      return (
        <div
          key={cat.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            animation: `popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.05}s backwards`,
          }}
        >
          <button
            onClick={() => {
              setExpanded(isActive ? null : cat.id);
              setLevel(isActive ? 0 : 2);
            }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: isActive ? `2px solid ${cat.color}60` : '1.5px solid rgba(79,172,254,0.25)',
              background: isActive
                ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.01))`
                : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), rgba(255,255,255,0.02))',
              backdropFilter: 'blur(16px)',
              boxShadow: isActive
                ? `0 0 24px ${cat.color}40, 0 8px 32px rgba(79,172,254,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`
                : `0 4px 20px rgba(79,172,254,0.15), inset 0 1px 0 rgba(255,255,255,0.2)`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              fontSize: 32,
              transform: isActive ? 'scale(1.2)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = `0 6px 24px rgba(79,172,254,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = `0 4px 20px rgba(79,172,254,0.15), inset 0 1px 0 rgba(255,255,255,0.2)`;
              }
            }}
          >
            <span>{cat.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: cat.color, textAlign: 'center', letterSpacing: 0.5 }}>
              {cat.label}
            </span>
          </button>
        </div>
      );
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        pointerEvents: expanded || level > 0 ? 'auto' : 'none',
      }}
    >
      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: translate(calc(-50% + 0px), calc(-50% + 0px)) scale(0.3);
          }
          100% {
            opacity: 1;
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(79,172,254,0.3), 0 0 30px rgba(0,242,254,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
          }
          50% {
            box-shadow: 0 0 35px rgba(79,172,254,0.55), 0 0 50px rgba(243,160,255,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
          }
        }
      `}</style>

      {/* Fondo oscuro con blur cuando está expandido */}
      {(expanded || level > 0) && (
        <div
          onClick={() => {
            setExpanded(null);
            setLevel(0);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10,10,20,0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: -1,
          }}
        />
      )}

      <IridescentDefs />

      {/* Contenedor central de burbujas */}
      <div
        style={{
          position: 'relative',
          width: 600,
          height: 600,
          margin: 'auto',
        }}
      >
        {/* Burbuja central (Inicio) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <button
            onClick={() => {
              if (expanded) {
                setExpanded(null);
                setLevel(0);
              } else {
                setExpanded('main');
                setLevel(1);
              }
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: expanded ? '2.5px solid rgba(79,172,254,0.8)' : '2px solid rgba(79,172,254,0.5)',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4), rgba(79,172,254,0.15) 50%, rgba(243,160,255,0.1))',
              backdropFilter: 'blur(20px)',
              boxShadow: expanded
                ? '0 0 40px rgba(79,172,254,0.6), 0 0 60px rgba(243,160,255,0.4), inset 0 2px 0 rgba(255,255,255,0.4)'
                : '0 8px 40px rgba(79,172,254,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              fontSize: 48,
              animation: expanded ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              transform: expanded ? 'scale(1.3)' : 'scale(1)',
            }}
          >
            <span>{bubbleStructure.main.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#4facfe', letterSpacing: 1 }}>
              INICIO
            </span>
          </button>

          {/* Gloss highlight en burbuja central */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 20,
              width: 50,
              height: 25,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(1px)',
            }}
          />
        </div>

        {/* Categorías expandidas */}
        {(expanded === 'main' || level > 0) && renderCategories()}

        {/* Sub-burbujas de categoría seleccionada */}
        {expanded && expanded !== 'main' && bubbleStructure.categories[expanded] && (
          renderSubBubbles(bubbleStructure.categories[expanded])
        )}
      </div>
    </div>
  );
};

export default ExpandableBubbleNav;
