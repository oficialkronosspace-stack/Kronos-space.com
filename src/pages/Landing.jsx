import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#08080F', minHeight: '100vh', fontFamily: "'Courier New', monospace" }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 36px', borderBottom: '1px solid #1A1A2E' }}>
        <span style={{ fontSize: '22px', fontWeight: '900', color: '#00FFB2', letterSpacing: '-1px' }}>ScriptDrop</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/login')}    style={btnGhost}>Entrar</button>
          <button onClick={() => navigate('/register')} style={btnPrimary}>Empezar gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '90px 24px 70px' }}>
        <div style={{ display: 'inline-block', background: '#00FFB210', border: '1px solid #00FFB230', color: '#00FFB2', padding: '4px 18px', borderRadius: '2px', fontSize: '11px', letterSpacing: '4px', marginBottom: '28px' }}>
          POWERED BY IA
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 8vw, 76px)', fontWeight: '900', color: '#FFF', lineHeight: '1.05', marginBottom: '22px', letterSpacing: '-3px' }}>
          Scripts virales<br /><span style={{ color: '#00FFB2' }}>en 10 segundos.</span>
        </h1>
        <p style={{ fontSize: '17px', color: '#666', maxWidth: '500px', margin: '0 auto 40px', lineHeight: '1.7' }}>
          Deja de perder horas pensando qué decir. ScriptDrop genera tu script completo para TikTok y Reels — hook, desarrollo y CTA — al instante.
        </p>
        <button onClick={() => navigate('/register')} style={{ ...btnPrimary, fontSize: '16px', padding: '16px 40px' }}>
          Generar mi primer script →
        </button>
        <p style={{ marginTop: '14px', fontSize: '12px', color: '#333' }}>Gratis · Sin tarjeta · 3 scripts/día</p>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '0 24px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { emoji: '⚡', title: 'Script completo',  desc: 'Hook + desarrollo + CTA listo para grabar en segundos.' },
            { emoji: '🎣', title: 'Hooks virales',     desc: 'Los primeros 3 segundos que detienen el scroll.' },
            { emoji: '#️⃣', title: 'Hashtags por nicho', desc: 'Hashtags optimizados para tu tema específico.' },
            { emoji: '📂', title: 'Historial',         desc: 'Guarda y accede a todos tus scripts generados.' },
          ].map(f => (
            <div key={f.title} style={{ background: '#0F0F1A', border: '1px solid #1E1E30', borderRadius: '6px', padding: '26px 22px' }}>
              <div style={{ fontSize: '30px', marginBottom: '14px' }}>{f.emoji}</div>
              <div style={{ fontWeight: '700', color: '#FFF', marginBottom: '8px', fontSize: '15px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '0 24px 80px', maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#00FFB2', letterSpacing: '4px', marginBottom: '36px' }}>PRECIOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { plan: 'GRATIS',  price: '$0',       perks: ['3 scripts/día', 'Hook generator', 'Hashtags', 'Historial (5 últimos)'], cta: 'Empezar',      highlight: false },
            { plan: 'PRO',     price: '$9.99/mes', perks: ['Scripts ilimitados', 'Todos los tonos', 'Exportar scripts', 'Historial completo', 'Soporte prioritario'], cta: 'Obtener Pro', highlight: true  },
          ].map(p => (
            <div key={p.plan} style={{ background: p.highlight ? '#00FFB208' : '#0F0F1A', border: `1px solid ${p.highlight ? '#00FFB2' : '#1E1E30'}`, borderRadius: '6px', padding: '30px 20px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '3px', color: p.highlight ? '#00FFB2' : '#444', marginBottom: '10px' }}>{p.plan}</div>
              <div style={{ fontSize: '30px', fontWeight: '900', color: '#FFF', marginBottom: '22px' }}>{p.price}</div>
              {p.perks.map(perk => (
                <div key={perk} style={{ fontSize: '12px', color: '#777', marginBottom: '10px', textAlign: 'left' }}>✓ {perk}</div>
              ))}
              <button onClick={() => navigate('/register')} style={{ ...(p.highlight ? btnPrimary : btnGhost), width: '100%', marginTop: '20px', fontSize: '13px' }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '28px', borderTop: '1px solid #111', color: '#2A2A2A', fontSize: '12px' }}>
        © 2025 ScriptDrop — Todos los derechos reservados
      </footer>
    </div>
  )
}

const btnPrimary = { background: '#00FFB2', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '3px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: "'Courier New', monospace" }
const btnGhost   = { background: 'transparent', color: '#00FFB2', border: '1px solid #00FFB230', padding: '10px 24px', borderRadius: '3px', cursor: 'pointer', fontSize: '14px', fontFamily: "'Courier New', monospace" }
