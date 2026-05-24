import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const NICHES = ['Fitness','Finanzas','Motivación','Tecnología','Moda','Cocina','Gaming','Viajes','Conspiración / OVNI','Otro']
const TONES  = ['Thriller / Misterioso','Motivacional','Educativo','Humorístico','Dramático']
const MODES  = [
  { id: 'full',     label: '⚡ Script Completo', desc: 'Hook + desarrollo + CTA' },
  { id: 'hook',     label: '🎣 Solo el Hook',    desc: 'Los primeros 3 segundos virales' },
  { id: 'hashtags', label: '#️⃣  Hashtags',       desc: 'Hashtags optimizados por nicho' },
]
const DAILY_FREE_LIMIT = 3

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mode,       setMode]       = useState('full')
  const [niche,      setNiche]      = useState('')
  const [topic,      setTopic]      = useState('')
  const [tone,       setTone]       = useState('Thriller / Misterioso')
  const [result,     setResult]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [usageCount, setUsageCount] = useState(0)
  const [isPro,      setIsPro]      = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [history,    setHistory]    = useState([])

  useEffect(() => { if (!user) navigate('/login'); else { loadUsage(); loadHistory() } }, [user])

  async function loadUsage() {
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase.from('usage').select('count').eq('user_id', user.id).eq('date', today).single()
    setUsageCount(usage?.count || 0)
    const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', user.id).single()
    setIsPro(profile?.is_pro || false)
  }

  async function loadHistory() {
    const { data } = await supabase.from('scripts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    setHistory(data || [])
  }

  async function saveScript(result) {
    await supabase.from('scripts').insert({ user_id: user.id, mode, niche, topic, tone, result })
  }

  async function incrementUsage() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('usage').select('*').eq('user_id', user.id).eq('date', today).single()
    if (data) await supabase.from('usage').update({ count: data.count + 1 }).eq('id', data.id)
    else       await supabase.from('usage').insert({ user_id: user.id, date: today, count: 1 })
    setUsageCount(prev => prev + 1)
  }

  async function generate() {
    if (!niche || !topic) { setError('Selecciona el nicho y escribe el tema'); return }
    if (!isPro && usageCount >= DAILY_FREE_LIMIT) { setError('Límite diario alcanzado. Actualiza a Pro ⚡'); return }
    setLoading(true); setError(''); setResult('')

    const prompts = {
      full: `Eres experto en contenido viral para TikTok. Genera un script completo de 45-55 segundos.
Nicho: ${niche} | Tema: ${topic} | Tono: ${tone}
Formato OBLIGATORIO:
[HOOK 0-3s]: Frase que detiene el scroll. Impactante.
[DESARROLLO 3-45s]: 4-5 puntos cortos, revelaciones, datos clave.
[CTA 45-55s]: Invita a seguir, comentar o compartir.
Solo el script en español, sin explicaciones.`,
      hook: `Eres experto en hooks virales para TikTok.
Genera 5 hooks diferentes. Nicho: ${niche} | Tema: ${topic} | Tono: ${tone}
Cada hook: máximo 3 segundos al leerlo. Que generen curiosidad o miedo a perderse algo.
Formato: 1. hook  2. hook  etc. Solo en español.`,
      hashtags: `Genera 20 hashtags para TikTok.
Nicho: ${niche} | Tema: ${topic}
Mezcla: 5 muy populares (+10M), 10 medianos (1M-10M), 5 de nicho.
Solo los hashtags con #, separados por espacio.`
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompts[mode] }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'Error al generar.'
      setResult(text)
      await incrementUsage()
      await saveScript(text)
      await loadHistory()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const remaining = isPro ? '∞' : Math.max(0, DAILY_FREE_LIMIT - usageCount)

  return (
    <div style={{ background: '#08080F', minHeight: '100vh', fontFamily: "'Courier New', monospace" }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid #1A1A2E' }}>
        <span style={{ fontSize: '18px', fontWeight: '900', color: '#00FFB2' }}>ScriptDrop</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#00FFB2', background: '#00FFB215', border: '1px solid #00FFB230', padding: '4px 12px', borderRadius: '2px' }}>
            {remaining} generaciones hoy
          </span>
          <button onClick={() => { signOut(); navigate('/') }} style={{ background: 'none', border: '1px solid #2A2A3E', color: '#666', padding: '6px 14px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Courier New', monospace" }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>

        {/* LEFT COLUMN */}
        <div>
          {/* MODE SELECTOR */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                background: mode === m.id ? '#00FFB210' : '#0F0F1A',
                border: `1px solid ${mode === m.id ? '#00FFB2' : '#1E1E30'}`,
                borderRadius: '5px', padding: '14px 8px', cursor: 'pointer', textAlign: 'center'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: mode === m.id ? '#00FFB2' : '#FFF' }}>{m.label}</div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{m.desc}</div>
              </button>
            ))}
          </div>

          {/* FORM */}
          <div style={{ background: '#0F0F1A', border: '1px solid #1E1E30', borderRadius: '6px', padding: '22px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Nicho</label>
                <select value={niche} onChange={e => setNiche(e.target.value)} style={selectStyle}>
                  <option value="">Selecciona...</option>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tono</label>
                <select value={tone} onChange={e => setTone(e.target.value)} style={selectStyle}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Tema del video</label>
              <input
                style={{ ...selectStyle, width: '100%' }}
                placeholder="ej: La verdad sobre los programas secretos de la NASA"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>
            {error && <div style={{ background: '#FF3B3B15', border: '1px solid #FF3B3B40', color: '#FF3B3B', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
            <button onClick={generate} disabled={loading} style={{
              width: '100%', background: loading ? '#00FFB250' : '#00FFB2',
              color: '#000', border: 'none', padding: '14px', borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '900',
              fontSize: '15px', fontFamily: "'Courier New', monospace", letterSpacing: '1px'
            }}>
              {loading ? '⏳ Generando...' : '⚡ GENERAR SCRIPT'}
            </button>
          </div>

          {/* RESULT */}
          {result && (
            <div style={{ background: '#0F0F1A', border: '1px solid #00FFB240', borderRadius: '6px', padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: '#00FFB2', letterSpacing: '3px' }}>RESULTADO</span>
                <button onClick={copyResult} style={{ background: copied ? '#00FFB220' : '#1A1A2E', border: `1px solid ${copied ? '#00FFB2' : '#2A2A3E'}`, color: copied ? '#00FFB2' : '#888', padding: '6px 16px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Courier New', monospace" }}>
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <pre style={{ color: '#D0D0E0', fontSize: '13px', lineHeight: '1.9', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
            </div>
          )}

          {/* UPGRADE BANNER */}
          {!isPro && (
            <div style={{ marginTop: '16px', background: '#FF6B3510', border: '1px solid #FF6B3530', borderRadius: '6px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#FF6B35', fontWeight: '700', fontSize: '13px' }}>⚡ Pro — Scripts ilimitados</span>
                <p style={{ color: '#555', fontSize: '11px', marginTop: '3px' }}>Sin límite + tonos personalizados + historial completo</p>
              </div>
              <button style={{ background: '#FF6B35', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', fontFamily: "'Courier New', monospace', flexShrink: 0" }}>
                $9.99/mes
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - HISTORY */}
        <div>
          <div style={{ fontSize: '11px', color: '#555', letterSpacing: '3px', marginBottom: '12px' }}>HISTORIAL</div>
          {history.length === 0
            ? <div style={{ color: '#333', fontSize: '12px', textAlign: 'center', marginTop: '40px' }}>Aún no tienes scripts generados</div>
            : history.map(h => (
              <div key={h.id} onClick={() => setResult(h.result)} style={{ background: '#0F0F1A', border: '1px solid #1E1E30', borderRadius: '4px', padding: '12px', marginBottom: '8px', cursor: 'pointer' }}>
                <div style={{ fontSize: '11px', color: '#00FFB2', marginBottom: '4px' }}>{h.niche} · {h.mode}</div>
                <div style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.topic}</div>
                <div style={{ fontSize: '10px', color: '#333', marginTop: '4px' }}>{new Date(h.created_at).toLocaleDateString('es-MX')}</div>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  )
}

const labelStyle  = { display: 'block', fontSize: '11px', color: '#555', letterSpacing: '2px', marginBottom: '6px' }
const selectStyle = { background: '#08080F', border: '1px solid #2A2A3E', color: '#E0E0E0', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', fontFamily: "'Courier New', monospace", outline: 'none', width: '100%' }
