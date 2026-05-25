import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HoloText, BotonBurbuja3D } from '../kronos';

const HOLO = 'linear-gradient(135deg,#4facfe,#00f2fe,#f3a0ff,#ff85a2)';

const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: 12, outline: 'none',
  background: 'rgba(79,172,254,0.05)', border: '1.5px solid rgba(79,172,254,0.2)',
  color: '#0a0a14', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
};

function Register() {
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [formData, setFormData] = useState({
    username: '', email: '', phone: '', password: '', firstName: '', lastName: '',
  });
  const [error, setError] = useState('');
  const [slowWarning, setSlowWarning] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSlowWarning(false);

    if (method === 'phone' && !formData.phone) {
      return setError('Ingresa tu número de teléfono');
    }
    if (method === 'email' && !formData.email) {
      return setError('Ingresa tu email');
    }

    const timer = setTimeout(() => setSlowWarning(true), 5000);
    const result = await register(
      formData.username,
      method === 'email' ? formData.email : '',
      formData.password,
      formData.firstName,
      formData.lastName,
      method === 'phone' ? formData.phone : ''
    );
    clearTimeout(timer);
    setSlowWarning(false);
    if (result.success) navigate('/feed');
    else setError(result.message);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 70% 20%, rgba(243,160,255,0.07), transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(79,172,254,0.07), transparent 50%), #ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>⭐</div>
          <HoloText size={34}>KRONOS</HoloText>
          <div style={{ color: 'rgba(10,10,20,0.45)', fontSize: 13, marginTop: 6 }}>Crea tu cuenta</div>
        </div>

        {/* Selector Email / Teléfono */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(79,172,254,0.04)', borderRadius: 12, padding: 4 }}>
          {[
            { id: 'email', label: '📧 Email' },
            { id: 'phone', label: '📱 Teléfono' },
          ].map(opt => (
            <button key={opt.id} type="button" onClick={() => setMethod(opt.id)}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input style={inputStyle} name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleChange} />
            <input style={inputStyle} name="lastName" placeholder="Apellido" value={formData.lastName} onChange={handleChange} />
          </div>
          <input style={inputStyle} name="username" placeholder="Nombre de usuario" value={formData.username} onChange={handleChange} required />

          {method === 'email' ? (
            <input style={inputStyle} name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          ) : (
            <input style={inputStyle} name="phone" type="tel" placeholder="Número de teléfono (ej. +521234567890)" value={formData.phone} onChange={handleChange} required />
          )}

          <input style={inputStyle} name="password" type="password" placeholder="Contraseña (mín. 6 caracteres)" value={formData.password} onChange={handleChange} required />

          <BotonBurbuja3D
            as="button"
            type="submit"
            size="md"
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          >
            {loading ? 'Creando cuenta...' : 'REGISTRARSE'}
          </BotonBurbuja3D>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', color: 'rgba(10,10,20,0.45)', fontSize: 13 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none', fontWeight: 700 }}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
