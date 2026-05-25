import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HoloText, BotonBurbuja3D } from '../kronos';

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const HOLO = 'linear-gradient(135deg,#4facfe,#00f2fe,#f3a0ff,#ff85a2)';

const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: 12, outline: 'none',
  background: 'rgba(79,172,254,0.05)', border: '1.5px solid rgba(79,172,254,0.2)',
  color: '#0a0a14', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

function Login() {
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [slowWarning, setSlowWarning] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSlowWarning(false);
    const timer = setTimeout(() => setSlowWarning(true), 5000);
    const result = await login(
      method === 'email' ? identifier : '',
      password,
      method === 'phone' ? identifier : ''
    );
    clearTimeout(timer);
    setSlowWarning(false);
    if (result.success) navigate('/feed');
    else setError(result.message);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(79,172,254,0.08), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(243,160,255,0.06), transparent 50%), #ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
          <HoloText size={36}>KRONOS</HoloText>
          <div style={{ color: 'rgba(10,10,20,0.45)', fontSize: 13, marginTop: 6 }}>
            Inicia sesión en tu cuenta
          </div>
        </div>

        {/* Selector Email / Teléfono */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(79,172,254,0.04)', borderRadius: 12, padding: 4 }}>
          {[
            { id: 'email', label: '📧 Email' },
            { id: 'phone', label: '📱 Teléfono' },
          ].map(opt => (
            <button key={opt.id} type="button" onClick={() => { setMethod(opt.id); setIdentifier(''); }}
              style={{
                flex: 1, padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: method === opt.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'transparent',
                color: method === opt.id ? '#fff' : 'rgba(10,10,20,0.55)',
                transition: 'all 0.2s',
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {slowWarning && (
          <div style={{
            background: 'rgba(79,172,254,0.08)', border: '1px solid rgba(79,172,254,0.3)',
            color: '#4facfe', padding: '10px 14px', borderRadius: 12, fontSize: 12,
            marginBottom: 14, textAlign: 'center',
          }}>
            ⏳ El servidor está despertando, espera unos segundos...
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', padding: '12px 14px', borderRadius: 12, fontSize: 13, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {method === 'email' ? (
            <input
              type="email"
              placeholder="Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={inputStyle}
            />
          ) : (
            <input
              type="tel"
              placeholder="Teléfono (ej. +521234567890)"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <BotonBurbuja3D
            as="button"
            type="submit"
            size="md"
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </BotonBurbuja3D>
        </form>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link to="/forgot-password" style={{ color: 'rgba(10,10,20,0.45)', fontSize: 12, textDecoration: 'none' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={handleGoogleLogin} style={{
            width: '100%', padding: '11px 0', borderRadius: 10, cursor: 'pointer',
            background: '#fff', border: '1.5px solid rgba(79,172,254,0.2)',
            color: '#0a0a14', fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
            boxShadow: '0 2px 8px rgba(79,172,254,0.08)',
          }}>
            🔵 Continuar con Google
          </button>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', color: 'rgba(10,10,20,0.45)', fontSize: 13 }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none', fontWeight: 700 }}>
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
