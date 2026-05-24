import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [msg,      setMsg]      = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  async function handleSubmit() {
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres'); return }
    setLoading(true); setError('')
    const { error } = await signUp(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else { setMsg('¡Cuenta creada! Redirigiendo...'); setTimeout(() => navigate('/app'), 1500) }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Crear cuenta en <span style={{ color: '#00FFB2' }}>ScriptDrop</span></h2>
        <p style={{ textAlign: 'center', color: '#444', fontSize: '13px', marginBottom: '26px' }}>Gratis · Sin tarjeta · 3 scripts/día</p>
        {error && <div style={errorStyle}>{error}</div>}
        {msg   && <div style={successStyle}>{msg}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input style={inputStyle} type="email"    placeholder="Email"                   value={email}    onChange={e => setEmail(e.target.value)} />
          <input style={inputStyle} type="password" placeholder="Contraseña (mín. 6 chars)" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#444' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#00FFB2' }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}

const pageStyle    = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080F', padding: '24px' }
const cardStyle    = { background: '#0F0F1A', border: '1px solid #1E1E30', borderRadius: '8px', padding: '42px', width: '100%', maxWidth: '400px' }
const titleStyle   = { fontSize: '20px', fontWeight: '900', color: '#FFF', marginBottom: '8px', textAlign: 'center' }
const inputStyle   = { width: '100%', background: '#08080F', border: '1px solid #2A2A3E', color: '#E0E0E0', padding: '12px 16px', borderRadius: '4px', fontSize: '14px', fontFamily: "'Courier New', monospace", outline: 'none' }
const btnStyle     = { width: '100%', background: '#00FFB2', color: '#000', border: 'none', padding: '13px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', fontFamily: "'Courier New', monospace", marginTop: '4px' }
const errorStyle   = { background: '#FF3B3B15', border: '1px solid #FF3B3B40', color: '#FF3B3B', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }
const successStyle = { background: '#00FFB215', border: '1px solid #00FFB240', color: '#00FFB2', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }
