import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GlassCard, HoloText, BottomNav } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const BUSINESS_TYPES = [
  { value: 'restaurant', label: '🍽️ Restaurante' },
  { value: 'salon', label: '💇 Salón de belleza' },
  { value: 'medical', label: '🏥 Médico / Clínica' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'other', label: '📌 Otro' },
];

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'  },
  confirmed: { label: 'Confirmada', color: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  cancelled: { label: 'Cancelada',  color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.25)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.4,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function businessTypeLabel(val) {
  const found = BUSINESS_TYPES.find(t => t.value === val);
  return found ? found.label : val;
}

// ── New Reservation Modal ─────────────────────────────────────────────────────
function NewReservationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'restaurant',
    date: '',
    time: '',
    partySize: 2,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.businessName.trim()) { setError('Ingresa el nombre del negocio'); return; }
    if (!form.date) { setError('Selecciona una fecha'); return; }
    if (!form.time) { setError('Selecciona una hora'); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/reservations`, form);
      onCreated(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la reservación');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(79,172,254,0.07)',
    border: '1px solid rgba(79,172,254,0.2)',
    borderRadius: 12,
    padding: '11px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    color: 'rgba(10,10,20,0.5)',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <GlassCard style={{ width: '100%', maxWidth: 480, borderRadius: '20px 20px 0 0', paddingBottom: 32, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ color: '#0a0a14', fontSize: 18, fontWeight: 700 }}>Nueva Reservación</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(10,10,20,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Business Name */}
            <div>
              <label style={labelStyle}>Nombre del negocio</label>
              <input
                value={form.businessName}
                onChange={e => set('businessName', e.target.value)}
                placeholder="Ej. La Trattoria, Dr. García..."
                style={inputStyle}
              />
            </div>

            {/* Business Type */}
            <div>
              <label style={labelStyle}>Tipo de negocio</label>
              <select
                value={form.businessType}
                onChange={e => set('businessType', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {BUSINESS_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: '#1a1a2e' }}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Fecha</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Hora</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => set('time', e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Party Size */}
            <div>
              <label style={labelStyle}>Número de personas</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button type="button"
                  onClick={() => set('partySize', Math.max(1, form.partySize - 1))}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.18)', color: '#0a0a14', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  −
                </button>
                <span style={{ color: '#0a0a14', fontSize: 22, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{form.partySize}</span>
                <button type="button"
                  onClick={() => set('partySize', Math.min(20, form.partySize + 1))}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.18)', color: '#0a0a14', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  +
                </button>
                <span style={{ color: 'rgba(10,10,20,0.35)', fontSize: 13 }}>
                  {form.partySize === 1 ? 'persona' : 'personas'}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notas (opcional)</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Alergias, preferencias, solicitudes especiales..."
                rows={3}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: '#fff',
                border: 'none',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                marginTop: 4,
              }}>
              {loading ? 'Creando...' : '📅 Crear Reservación'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

// ── Reservation Card ──────────────────────────────────────────────────────────
function ReservationCard({ reservation, onCancel }) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar esta reservación?')) return;
    setCancelling(true);
    try {
      await onCancel(reservation._id);
    } finally {
      setCancelling(false);
    }
  };

  const typeEmojis = { restaurant: '🍽️', salon: '💇', medical: '🏥', hotel: '🏨', other: '📌' };
  const emoji = typeEmojis[reservation.businessType] || '📌';

  return (
    <GlassCard style={{ marginBottom: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>
          {emoji}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: '#0a0a14', fontWeight: 700, fontSize: 15 }}>{reservation.businessName}</span>
            <StatusBadge status={reservation.status} />
          </div>

          <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, marginBottom: 8 }}>
            {businessTypeLabel(reservation.businessType)}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(10,10,20,0.65)', fontSize: 13 }}>
              <span>📅</span> {formatDate(reservation.date)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(10,10,20,0.65)', fontSize: 13 }}>
              <span>🕐</span> {reservation.time}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(10,10,20,0.65)', fontSize: 13 }}>
              <span>👥</span> {reservation.partySize} {reservation.partySize === 1 ? 'persona' : 'personas'}
            </div>
          </div>

          {reservation.notes && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(79,172,254,0.04)',
              borderRadius: 8,
              color: 'rgba(10,10,20,0.5)',
              fontSize: 12,
              fontStyle: 'italic',
            }}>
              "{reservation.notes}"
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {reservation.status === 'pending' && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              padding: '7px 16px',
              borderRadius: 20,
              background: 'rgba(239,68,68,0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 12,
              fontWeight: 600,
              cursor: cancelling ? 'default' : 'pointer',
            }}>
            {cancelling ? 'Cancelando...' : '✕ Cancelar'}
          </button>
        </div>
      )}
    </GlassCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchReservations = async () => {
    try {
      const res = await axios.get(`${API_URL}/reservations/mine`);
      setReservations(res.data.data || []);
    } catch (err) {
      // silenced
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreated = (newRes) => {
    setReservations(prev => [newRes, ...prev]);
    showToast('Reservación creada exitosamente');
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`${API_URL}/reservations/${id}`);
      setReservations(prev => prev.map(r => r._id === id ? { ...r, status: 'cancelled' } : r));
      showToast('Reservación cancelada');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cancelar');
    }
  };

  const FILTERS = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'confirmed', label: 'Confirmadas' },
    { id: 'cancelled', label: 'Canceladas' },
  ];

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 100 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
          color: '#fff', padding: '10px 24px', borderRadius: 28,
          fontSize: 14, fontWeight: 600, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(124,58,237,0.4)', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <HoloText size={26}>Reservaciones</HoloText>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: 24,
              background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
            }}>
            + Nueva
          </button>
        </div>

        {/* Stats Row */}
        {!loading && reservations.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Pendientes', count: reservations.filter(r => r.status === 'pending').length, color: '#f59e0b' },
              { label: 'Confirmadas', count: reservations.filter(r => r.status === 'confirmed').length, color: '#10b981' },
              { label: 'Canceladas', count: reservations.filter(r => r.status === 'cancelled').length, color: '#6b7280' },
            ].map(s => (
              <GlassCard key={s.label} style={{ textAlign: 'center', padding: '14px 10px' }}>
                <div style={{ color: s.color, fontSize: 22, fontWeight: 900, marginBottom: 2 }}>{s.count}</div>
                <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 10, letterSpacing: 0.5 }}>{s.label}</div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        {!loading && reservations.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', paddingBottom: 2 }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: filter === f.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  transition: 'background 0.2s',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 60 }}>
            Cargando reservaciones...
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '50px 24px' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📅</div>
            <div style={{ color: '#0a0a14', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              {filter === 'all' ? 'Sin reservaciones' : `Sin reservaciones ${FILTERS.find(f => f.id === filter)?.label.toLowerCase()}`}
            </div>
            <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 13, marginBottom: 24 }}>
              {filter === 'all' ? 'Crea tu primera reservación con el botón de arriba' : 'Prueba otro filtro'}
            </div>
            {filter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '11px 28px',
                  borderRadius: 24,
                  background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}>
                📅 Nueva Reservación
              </button>
            )}
          </GlassCard>
        ) : (
          filtered.map(r => (
            <ReservationCard key={r._id} reservation={r} onCancel={handleCancel} />
          ))
        )}
      </div>

      {showModal && (
        <NewReservationModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      <BottomNav />
    </div>
  );
}
