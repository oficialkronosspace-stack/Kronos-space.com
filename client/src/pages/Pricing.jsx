import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSubscription from '../hooks/useSubscription';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'siempre',
    accent: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.10)',
    features: [
      { label: '5 posts por día', ok: true },
      { label: 'Feed e interacciones básicas', ok: true },
      { label: 'Tienda y comida', ok: true },
      { label: 'IA generativa', ok: false },
      { label: 'Sin anuncios', ok: false },
      { label: 'Badge verificado ✓', ok: false },
      { label: 'Stickers premium', ok: false },
      { label: 'Analytics avanzado', ok: false },
      { label: 'API access', ok: false },
      { label: 'Soporte prioritario', ok: false }
    ],
    cta: null
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$4.99',
    cadence: 'al mes',
    accent: 'linear-gradient(135deg, rgba(234,179,8,0.14), rgba(251,146,60,0.10))',
    border: 'rgba(234,179,8,0.38)',
    features: [
      { label: '20 posts por día', ok: true },
      { label: 'Sin anuncios', ok: true },
      { label: 'Stickers premium', ok: true },
      { label: 'Recompensa diaria 2× mayor', ok: true },
      { label: 'Soporte por correo', ok: true },
      { label: 'IA generativa', ok: false },
      { label: 'Badge verificado ✓', ok: false },
      { label: 'Posts ilimitados', ok: false },
      { label: 'Analytics avanzado', ok: false },
      { label: 'API access', ok: false }
    ],
    cta: 'Suscribirme a Plus'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    cadence: 'al mes',
    accent: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.12))',
    border: 'rgba(168,85,247,0.45)',
    highlighted: true,
    features: [
      { label: 'Posts ilimitados', ok: true },
      { label: 'IA generativa (texto + imagen)', ok: true },
      { label: 'Sin anuncios', ok: true },
      { label: 'Badge verificado ✓', ok: true },
      { label: 'Stickers premium', ok: true },
      { label: 'Recompensa diaria 3× mayor', ok: true },
      { label: 'Analytics avanzado', ok: false },
      { label: 'API access', ok: false },
      { label: 'Soporte prioritario', ok: false },
      { label: 'Tienda customizable', ok: false }
    ],
    cta: 'Suscribirme a Pro'
  },
  {
    id: 'business',
    name: 'Business',
    price: '$29.99',
    cadence: 'al mes',
    accent: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(34,197,94,0.10))',
    border: 'rgba(59,130,246,0.45)',
    features: [
      { label: 'Todo lo de Pro', ok: true },
      { label: 'Analytics avanzado', ok: true },
      { label: 'API access', ok: true },
      { label: 'Soporte prioritario', ok: true },
      { label: 'Tienda customizable', ok: true },
      { label: 'Recompensa diaria 5× mayor', ok: true },
      { label: 'Branding del perfil', ok: true },
      { label: 'Stripe en tu tienda', ok: true },
      { label: 'Onboarding 1:1', ok: true },
      { label: 'SLA de respuesta', ok: true }
    ],
    cta: 'Suscribirme a Business'
  }
];

const TierCard = ({ tier, currentTier, onSelect, busy }) => {
  const isCurrent = currentTier === tier.id;
  const isHighlighted = tier.highlighted;

  return (
    <div
      style={{
        background: tier.accent,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: `1px solid ${tier.border}`,
        borderRadius: 18,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        boxShadow: isHighlighted
          ? '0 12px 32px rgba(124,58,237,0.18), 0 0 0 1px rgba(168,85,247,0.25)'
          : '0 6px 16px rgba(0,0,0,0.25)',
        transform: isHighlighted ? 'scale(1.03)' : 'none'
      }}
    >
      {isHighlighted && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            right: 16,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 10,
            letterSpacing: 1,
            textTransform: 'uppercase'
          }}
        >
          Recomendado
        </div>
      )}

      <div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
          {tier.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
          <span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>{tier.price}</span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{tier.cadence}</span>
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tier.features.map((f) => (
          <li
            key={f.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: f.ok ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              fontSize: 13
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: f.ok ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.05)',
                color: f.ok ? '#22c55e' : 'rgba(255,255,255,0.35)',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {f.ok ? '✓' : '–'}
            </span>
            {f.label}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 'auto' }}>
        {isCurrent ? (
          <div
            style={{
              padding: '12px 0',
              borderRadius: 12,
              border: '1px dashed rgba(255,255,255,0.2)',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.55)',
              fontSize: 13
            }}
          >
            Tu plan actual
          </div>
        ) : tier.cta ? (
          <button
            onClick={() => onSelect(tier.id)}
            disabled={busy}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              cursor: busy ? 'wait' : 'pointer',
              background: isHighlighted
                ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                : tier.id === 'plus'
                  ? 'linear-gradient(135deg, #eab308, #f97316)'
                  : 'linear-gradient(135deg, #3b82f6, #1e40af)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 0.5,
              opacity: busy ? 0.6 : 1
            }}
          >
            {busy ? 'Redirigiendo a Stripe…' : tier.cta}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default function Pricing() {
  const navigate = useNavigate();
  const { tier, upgrade, error, loading } = useSubscription();
  const [busy, setBusy] = React.useState(null);

  const handleSelect = async (target) => {
    setBusy(target);
    const result = await upgrade(target);
    if (!result.success) setBusy(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0528 50%, #0d1117 100%)',
        padding: '64px 24px',
        color: '#fff'
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 42,
            margin: 0,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4, #a855f7, #3b82f6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            letterSpacing: 1
          }}
        >
          Kronos Pro
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, fontSize: 16 }}>
          Más alcance, sin anuncios, IA y herramientas de creador.
        </p>
        {loading && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>
            Cargando tu plan…
          </div>
        )}
        {error && (
          <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          maxWidth: 1100,
          margin: '0 auto'
        }}
      >
        {TIERS.map((t) => (
          <TierCard
            key={t.id}
            tier={t}
            currentTier={tier}
            onSelect={handleSelect}
            busy={busy === t.id}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)',
            padding: '10px 18px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          ← Volver
        </button>
      </div>
    </div>
  );
}
