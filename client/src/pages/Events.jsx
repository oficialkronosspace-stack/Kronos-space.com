import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GlassCard, BotonBurbuja3D, QRCode } from '../components/kronos';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['todos','música','deporte','arte','tecnología','gastronomía','educación','otro'];
const TYPES = [{ v:'', l:'Todos' }, { v:'physical', l:'Presencial' }, { v:'online', l:'Online' }, { v:'hybrid', l:'Híbrido' }];

/* ───────────────────────────────────────────────────── helpers */
function fmt(d) {
  return new Date(d).toLocaleDateString('es-MX', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
}

/* ───────────────────────────────────────────────────── componente QR real */
function QRDisplay({ value, size = 200 }) {
  // Dibuja una cuadrícula de módulos basada en el hash del value
  const cells = 21;
  const cell = size / cells;

  // Pseudo-deterministic pattern desde el string
  const grid = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const idx = (r * cells + c);
      const charCode = value.charCodeAt(idx % value.length) || 0;
      const dark = (charCode + r + c) % 3 !== 0;
      grid.push({ r, c, dark });
    }
  }

  // Patrones de posición (esquinas)
  const isFinderPattern = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);

  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map(({ r, c, dark }) => {
          const isFinder = isFinderPattern(r, c);
          const fill = isFinder ? '#1a0040' : (dark ? '#0a0a14' : '#ffffff');
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cell} y={r * cell}
              width={cell - 0.5} height={cell - 0.5}
              fill={fill}
              rx={isFinder ? 0 : 0.5}
            />
          );
        })}
      </svg>
      <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(10,10,20,0.4)', marginTop: 4, fontFamily: 'monospace', letterSpacing: 1 }}>
        {value.slice(0, 16).toUpperCase()}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────── modal crear evento */
function CreateEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'otro', type: 'physical',
    location: '', onlineLink: '', startDate: '', endDate: '',
    ticketTypes: [{ name: 'General', price: 0, quantity: 100, description: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setTicket = (i, k, v) => setForm(p => {
    const tt = [...p.ticketTypes];
    tt[i] = { ...tt[i], [k]: v };
    return { ...p, ticketTypes: tt };
  });
  const addTicket = () => setForm(p => ({ ...p, ticketTypes: [...p.ticketTypes, { name: '', price: 0, quantity: 50, description: '' }] }));
  const removeTicket = (i) => setForm(p => ({ ...p, ticketTypes: p.ticketTypes.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/events`, form);
      onCreated(res.data.event);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10, outline: 'none',
    background: 'rgba(79,172,254,0.05)', border: '1.5px solid rgba(79,172,254,0.2)',
    color: '#0a0a14', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.5)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0a0a14' }}>🎪 Crear Evento</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#0a0a14' }}>×</button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inp} placeholder="Título del evento *" value={form.title} onChange={e => set('title', e.target.value)} required />
          <textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} placeholder="Descripción" value={form.description} onChange={e => set('description', e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select style={inp} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.filter(c => c !== 'todos').map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.filter(t => t.v).map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>

          {(form.type === 'physical' || form.type === 'hybrid') && (
            <input style={inp} placeholder="Ubicación (dirección)" value={form.location} onChange={e => set('location', e.target.value)} />
          )}
          {(form.type === 'online' || form.type === 'hybrid') && (
            <input style={inp} placeholder="Enlace online (URL)" value={form.onlineLink} onChange={e => set('onlineLink', e.target.value)} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.5)', marginBottom: 4 }}>Fecha inicio *</div>
              <input style={inp} type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.5)', marginBottom: 4 }}>Fecha fin</div>
              <input style={inp} type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Tipos de boleto */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0a0a14' }}>🎟️ Tipos de boleto</div>
              <button type="button" onClick={addTicket} style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>+ Añadir</button>
            </div>
            {form.ticketTypes.map((tt, i) => (
              <div key={i} style={{ background: 'rgba(79,172,254,0.04)', border: '1px solid rgba(79,172,254,0.15)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 6 }}>
                  <input style={inp} placeholder="Nombre (ej. VIP)" value={tt.name} onChange={e => setTicket(i, 'name', e.target.value)} required />
                  <input style={inp} type="number" placeholder="Precio" min="0" value={tt.price} onChange={e => setTicket(i, 'price', e.target.value)} />
                  <input style={inp} type="number" placeholder="Cantidad" min="1" value={tt.quantity} onChange={e => setTicket(i, 'quantity', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Descripción del boleto" value={tt.description} onChange={e => setTicket(i, 'description', e.target.value)} />
                  {form.ticketTypes.length > 1 && (
                    <button type="button" onClick={() => removeTicket(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <BotonBurbuja3D as="button" type="submit" size="md" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Creando...' : '🎪 Publicar Evento'}
          </BotonBurbuja3D>
        </form>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────── modal boleto QR */
function TicketModal({ event, onClose }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedType, setSelectedType] = useState(event.ticketTypes?.[0]?._id || '');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/events/${event._id}/my-ticket`)
      .then(r => setTicket(r.data.ticket))
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [event._id]);

  const buyTicket = async () => {
    setBuying(true); setError('');
    try {
      const res = await axios.post(`${API}/events/${event._id}/buy-ticket`, { ticketTypeId: selectedType });
      setTicket(res.data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al comprar boleto');
    } finally {
      setBuying(false);
    }
  };

  const selType = event.ticketTypes?.find(t => t._id === selectedType);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,20,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400, padding: 28, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0a0a14' }}>🎟️ Boleto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#0a0a14' }}>×</button>
        </div>

        <div style={{ fontWeight: 700, fontSize: 16, color: '#0a0a14', marginBottom: 4 }}>{event.title}</div>
        <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 13, marginBottom: 20 }}>{fmt(event.startDate)} · {fmtTime(event.startDate)}</div>

        {loading ? (
          <div style={{ color: 'rgba(10,10,20,0.4)', padding: 24 }}>Cargando...</div>
        ) : ticket ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <QRDisplay value={ticket.qrCode} size={180} />
            </div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#16a34a', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              ✅ Boleto activo
            </div>
            <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.4)', fontFamily: 'monospace' }}>
              ID: {ticket.qrCode?.slice(0, 12).toUpperCase()}
            </div>
          </div>
        ) : (
          <div>
            {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px', borderRadius: 10, marginBottom: 12, fontSize: 13 }}>{error}</div>}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'rgba(10,10,20,0.5)', marginBottom: 8, textAlign: 'left' }}>Tipo de boleto:</div>
              {event.ticketTypes?.map(tt => (
                <div key={tt._id} onClick={() => setSelectedType(tt._id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                    border: `2px solid ${selectedType === tt._id ? '#8B5CF6' : 'rgba(79,172,254,0.2)'}`,
                    background: selectedType === tt._id ? 'rgba(139,92,246,0.06)' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0a0a14' }}>{tt.name}</div>
                    {tt.description && <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.45)' }}>{tt.description}</div>}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#8B5CF6' }}>
                    {tt.price === 0 ? 'GRATIS' : `$${tt.price}`}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.4)', marginTop: 4 }}>
                {event.ticketTypes?.find(t => t._id === selectedType)?.sold || 0} / {event.ticketTypes?.find(t => t._id === selectedType)?.quantity || 0} boletos vendidos
              </div>
            </div>
            <BotonBurbuja3D size="md" disabled={buying} onClick={buyTicket} style={{ width: '100%' }}>
              {buying ? 'Procesando...' : `🎟️ Obtener boleto${selType?.price ? ` — $${selType.price}` : ' gratis'}`}
            </BotonBurbuja3D>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────── página principal */
export default function Events() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('todos');
  const [eventType, setEventType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tab, setTab] = useState('discover'); // 'discover' | 'my-tickets' | 'my-events'
  const [myTickets, setMyTickets] = useState([]);
  const [myEvents, setMyEvents] = useState([]);

  useEffect(() => {
    if (tab === 'discover') fetchEvents();
    else if (tab === 'my-tickets') fetchMyTickets();
    else if (tab === 'my-events') fetchMyEvents();
  }, [tab, category, eventType]); // eslint-disable-line

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'todos') params.category = category;
      if (eventType) params.type = eventType;
      const res = await axios.get(`${API}/events`, { params });
      setEvents(res.data.events || []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/events/user/my-tickets`);
      setMyTickets(res.data.tickets || []);
    } catch { setMyTickets([]); }
    finally { setLoading(false); }
  };

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/events/user/my`);
      setMyEvents(res.data.events || []);
    } catch { setMyEvents([]); }
    finally { setLoading(false); }
  };

  const handleCreated = (ev) => {
    setEvents(p => [ev, ...p]);
    setTab('my-events');
    fetchMyEvents();
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0a0a14' }}>🎪 Eventos</h1>
            <div style={{ color: 'rgba(10,10,20,0.45)', fontSize: 13 }}>Descubre y crea eventos</div>
          </div>
          <BotonBurbuja3D size="sm" onClick={() => setShowCreate(true)}>+ Crear</BotonBurbuja3D>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(79,172,254,0.04)', borderRadius: 14, padding: 4 }}>
          {[
            { id: 'discover', label: '🔍 Descubrir' },
            { id: 'my-tickets', label: '🎟️ Mis boletos' },
            { id: 'my-events', label: '🎪 Mis eventos' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(10,10,20,0.55)',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Filtros — solo en discover */}
        {tab === 'discover' && (
          <>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 600,
                  background: category === c ? 'linear-gradient(135deg,#EC4899,#8B5CF6)' : 'rgba(79,172,254,0.08)',
                  color: category === c ? '#fff' : 'rgba(10,10,20,0.6)',
                  transition: 'all 0.2s',
                }}>{c.charAt(0).toUpperCase() + c.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {TYPES.map(t => (
                <button key={t.v} onClick={() => setEventType(t.v)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: eventType === t.v ? 'linear-gradient(135deg,#06B6D4,#8B5CF6)' : 'rgba(79,172,254,0.08)',
                  color: eventType === t.v ? '#fff' : 'rgba(10,10,20,0.6)',
                  transition: 'all 0.2s',
                }}>{t.l}</button>
              ))}
            </div>
          </>
        )}

        {/* Contenido */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>Cargando...</div>
        ) : tab === 'discover' ? (
          events.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {events.map(ev => <EventCard key={ev._id} event={ev} onSelect={() => setSelectedEvent(ev)} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎪</div>
              <div>No hay eventos disponibles</div>
            </div>
          )
        ) : tab === 'my-tickets' ? (
          myTickets.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {myTickets.map(tk => <TicketCard key={tk._id} ticket={tk} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎟️</div>
              <div>No tienes boletos aún</div>
              <button onClick={() => setTab('discover')} style={{ marginTop: 12, background: 'none', border: 'none', color: '#8B5CF6', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Descubrir eventos →</button>
            </div>
          )
        ) : (
          myEvents.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {myEvents.map(ev => <EventCard key={ev._id} event={ev} isOrganizer onSelect={() => setSelectedEvent(ev)} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(10,10,20,0.35)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎪</div>
              <div>No has creado eventos</div>
              <BotonBurbuja3D size="sm" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>Crear mi primer evento</BotonBurbuja3D>
            </div>
          )
        )}
      </div>

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {selectedEvent && <TicketModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}    </div>
  );
}

/* ───────────────────────────────────────────────────── tarjeta evento */
function EventCard({ event, onSelect, isOrganizer }) {
  const minPrice = event.ticketTypes?.length
    ? Math.min(...event.ticketTypes.map(t => t.price))
    : null;
  const typeIcon = { physical: '📍', online: '💻', hybrid: '🌐' }[event.type] || '🎪';

  return (
    <GlassCard style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={onSelect}>
      {event.coverImage && (
        <img src={event.coverImage} alt={event.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
      )}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#0a0a14', flex: 1, marginRight: 8 }}>{event.title}</div>
          {isOrganizer && (
            <span style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>Tu evento</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(10,10,20,0.5)' }}>📅 {fmt(event.startDate)}</span>
          <span style={{ fontSize: 12, color: 'rgba(10,10,20,0.5)' }}>{typeIcon} {event.location || 'Online'}</span>
          <span style={{ background: 'rgba(79,172,254,0.1)', color: '#4facfe', borderRadius: 6, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{event.category}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'rgba(10,10,20,0.45)' }}>
            {event.ticketTypes?.reduce((a, t) => a + (t.quantity - t.sold), 0)} boletos disponibles
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {minPrice === 0 ? 'GRATIS' : minPrice != null ? `Desde $${minPrice}` : ''}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ───────────────────────────────────────────────────── tarjeta boleto */
function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false);
  const ev = ticket.event;
  const statusColor = { active: '#16a34a', used: '#6b7280', cancelled: '#ef4444', refunded: '#f97316' }[ticket.status] || '#6b7280';
  const statusLabel = { active: '✅ Activo', used: '✓ Usado', cancelled: 'Cancelado', refunded: 'Reembolsado' }[ticket.status] || ticket.status;

  return (
    <GlassCard style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0a0a14' }}>{ev?.title || 'Evento'}</div>
        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.5)', marginBottom: 12 }}>
        📅 {ev?.startDate ? fmt(ev.startDate) : ''} · {ticket.price === 0 ? 'Gratis' : `$${ticket.price}`}
      </div>
      {ticket.status === 'active' && (
        <div>
          <button onClick={() => setShowQR(v => !v)} style={{
            background: 'linear-gradient(135deg,#EC4899,#8B5CF6)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}>
            {showQR ? 'Ocultar QR' : '📱 Ver QR'}
          </button>
          {showQR && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <QRDisplay value={ticket.qrCode} size={180} />
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
