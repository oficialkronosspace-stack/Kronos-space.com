import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TwoFactorSetup from '../components/security/TwoFactorSetup';
import ActiveSessions from '../components/security/ActiveSessions';
import { GlassCard, BottomNav } from '../components/kronos';
import { AuthContext } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TABS = [
  { id: '2fa',           label: '2FA',          icon: '🔐' },
  { id: 'sessions',      label: 'Sesiones',      icon: '📱' },
  { id: 'privacy',       label: 'Privacidad',    icon: '🛡️' },
  { id: 'notifications', label: 'Alertas',       icon: '🔔' },
  { id: 'appearance',    label: 'Apariencia',    icon: '🎨' },
  { id: 'account',       label: 'Cuenta',        icon: '⚙️' },
];

// ── Privacy Tab ───────────────────────────────────────────────────────────────
function PrivacyTab() {
  const [settings, setSettings] = useState({
    profilePublic: true,
    showFollowers: true,
    showActivity: false,
    allowMessages: true,
    indexProfile: true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items = [
    { key: 'profilePublic',  label: 'Perfil público',          desc: 'Cualquiera puede ver tu perfil' },
    { key: 'showFollowers',  label: 'Mostrar seguidores',       desc: 'Visible tu lista de seguidores' },
    { key: 'showActivity',   label: 'Mostrar actividad',        desc: 'Otros ven cuando estás activo' },
    { key: 'allowMessages',  label: 'Recibir mensajes',         desc: 'Cualquier usuario puede escribirte' },
    { key: 'indexProfile',   label: 'Indexar en búsquedas',     desc: 'Tu perfil aparece al buscar usuarios' },
  ];

  return (
    <div>
      <GlassCard style={{ marginBottom: 12 }}>
        {items.map((item, i) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div>
              <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12, marginTop: 2 }}>{item.desc}</div>
            </div>
            <button onClick={() => toggle(item.key)}
              style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: settings[item.key] ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(10,10,20,0.12)', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: settings[item.key] ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        ))}
      </GlassCard>
      <button onClick={save}
        style={{ width: '100%', padding: '13px', borderRadius: 14, background: saved ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        {saved ? '✅ Guardado' : 'Guardar cambios'}
      </button>
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    likes: true, comments: true, follows: true,
    messages: true, transfers: true, communities: false,
    pushEnabled: false,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setPrefs(s => ({ ...s, [key]: !s[key] }));

  const items = [
    { key: 'likes',        label: 'Likes en tus posts',         icon: '❤️' },
    { key: 'comments',     label: 'Comentarios',                 icon: '💬' },
    { key: 'follows',      label: 'Nuevos seguidores',           icon: '👤' },
    { key: 'messages',     label: 'Mensajes directos',           icon: '📩' },
    { key: 'transfers',    label: 'Transferencias recibidas',    icon: '💸' },
    { key: 'communities',  label: 'Actividad en comunidades',    icon: '🏛️' },
    { key: 'pushEnabled',  label: 'Notificaciones push',         icon: '📲' },
  ];

  return (
    <div>
      <GlassCard style={{ marginBottom: 12 }}>
        {items.map((item, i) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 600 }}>{item.label}</div>
            </div>
            <button onClick={() => toggle(item.key)}
              style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: prefs[item.key] ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(10,10,20,0.12)', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: prefs[item.key] ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        ))}
      </GlassCard>
      <button onClick={() => setSaved(true)}
        style={{ width: '100%', padding: '13px', borderRadius: 14, background: saved ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        {saved ? '✅ Guardado' : 'Guardar preferencias'}
      </button>
    </div>
  );
}

// ── Appearance Tab ────────────────────────────────────────────────────────────
function AppearanceTab() {
  const [accent, setAccent] = useState('#7c3aed');
  const [fontSize, setFontSize] = useState('normal');
  const [animations, setAnimations] = useState(true);
  const [saved, setSaved] = useState(false);

  const accents = ['#7c3aed', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div>
      <GlassCard style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Color de acento</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {accents.map(c => (
              <button key={c} onClick={() => setAccent(c)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: c, border: accent === c ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer', boxSizing: 'border-box', transition: 'border 0.2s' }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Tamaño de texto</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['small', 'normal', 'large'].map(size => (
              <button key={size} onClick={() => setFontSize(size)}
                style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: fontSize === size ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.06)', color: '#0a0a14', fontSize: size === 'small' ? 11 : size === 'normal' ? 13 : 15, fontWeight: 600 }}>
                {size === 'small' ? 'Pequeño' : size === 'normal' ? 'Normal' : 'Grande'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 600 }}>Animaciones</div>
            <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12, marginTop: 2 }}>Transiciones y efectos visuales</div>
          </div>
          <button onClick={() => setAnimations(a => !a)}
            style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: animations ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(10,10,20,0.12)', position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ position: 'absolute', top: 3, left: animations ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s' }} />
          </button>
        </div>
      </GlassCard>

      {/* Preview */}
      <GlassCard style={{ marginBottom: 12, textAlign: 'center', padding: '20px' }}>
        <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Vista previa</div>
        <div style={{ color: accent, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Kronos</div>
        <div style={{ color: '#0a0a14', fontSize: fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14 }}>Así se verá el texto en la app</div>
      </GlassCard>

      <button onClick={() => setSaved(true)}
        style={{ width: '100%', padding: '13px', borderRadius: 14, background: saved ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        {saved ? '✅ Guardado' : 'Aplicar cambios'}
      </button>
    </div>
  );
}

// ── Account Tab ───────────────────────────────────────────────────────────────
function AccountTab() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExportData = () => {
    const data = JSON.stringify({ user, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kronos-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'ELIMINAR') return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/auth/account`);
      logout();
      navigate('/');
    } catch (e) {
      alert(e.response?.data?.message || 'Error al eliminar cuenta');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <GlassCard style={{ marginBottom: 12 }}>
        <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Información de cuenta</div>
        {[
          { label: 'Usuario', value: `@${user?.username}` },
          { label: 'Email', value: user?.email },
          { label: 'Plan', value: user?.tier === 'pro' ? '⭐ Pro' : user?.tier === 'business' ? '🏢 Business' : '🆓 Free' },
          { label: 'Miembro desde', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }) : '—' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: 'rgba(10,10,20,0.5)', fontSize: 13 }}>{item.label}</span>
            <span style={{ color: '#0a0a14', fontSize: 13, fontWeight: 600 }}>{item.value || '—'}</span>
          </div>
        ))}
      </GlassCard>

      <button onClick={handleExportData}
        style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', color: '#0a0a14', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
        📦 Exportar mis datos
      </button>

      <button onClick={logout}
        style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}>
        🚪 Cerrar sesión
      </button>

      {/* Delete account */}
      {!confirmDelete ? (
        <button onClick={() => setConfirmDelete(true)}
          style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.6)', fontSize: 13, cursor: 'pointer' }}>
          Eliminar cuenta permanentemente
        </button>
      ) : (
        <GlassCard style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
          <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>⚠️ Esto no se puede deshacer</div>
          <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12, marginBottom: 12 }}>
            Se eliminarán tu cuenta, posts, wallet y todos tus datos. Escribe <strong style={{ color: '#fff' }}>ELIMINAR</strong> para confirmar.
          </div>
          <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Escribe ELIMINAR"
            style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#0a0a14', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setConfirmDelete(false); setDeleteInput(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(79,172,254,0.07)', border: 'none', color: '#0a0a14', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
            <button onClick={handleDeleteAccount} disabled={deleteInput !== 'ELIMINAR' || deleting}
              style={{ flex: 1, padding: '10px', borderRadius: 10, background: deleteInput === 'ELIMINAR' ? '#ef4444' : 'rgba(239,68,68,0.2)', border: 'none', color: '#fff', cursor: deleteInput === 'ELIMINAR' ? 'pointer' : 'default', fontSize: 13, fontWeight: 700, opacity: deleting ? 0.6 : 1 }}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── Main Settings ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { tab: tabParam } = useParams();
  const [activeTab, setActiveTab] = useState(tabParam || '2fa');

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#0a0a14', fontSize: 22, fontWeight: 800 }}>Configuración</div>
          <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 13, marginTop: 2 }}>Cuenta, privacidad y apariencia</div>
        </div>

        {/* Scrollable tab bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: activeTab === tab.id ? 'linear-gradient(135deg,rgba(124,58,237,0.5),rgba(6,182,212,0.3))' : 'rgba(255,255,255,0.06)', color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.45)', outline: activeTab === tab.id ? '1px solid rgba(124,58,237,0.4)' : 'none' }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === '2fa'           && <TwoFactorSetup />}
            {activeTab === 'sessions'      && <ActiveSessions />}
            {activeTab === 'privacy'       && <PrivacyTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'appearance'    && <AppearanceTab />}
            {activeTab === 'account'       && <AccountTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
