import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { GlassCard, HoloText, BottomNav } from '../components/kronos';
import { AuthContext } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CATEGORY_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'ropa', label: '👗 Ropa' },
  { value: 'electronica', label: '📱 Electrónica' },
  { value: 'hogar', label: '🏠 Hogar' },
  { value: 'deportes', label: '⚽ Deportes' },
  { value: 'arte', label: '🎨 Arte' },
  { value: 'otro', label: '📦 Otro' },
];

const CATEGORY_LABELS = {
  ropa: '👗 Ropa',
  electronica: '📱 Electrónica',
  hogar: '🏠 Hogar',
  deportes: '⚽ Deportes',
  arte: '🎨 Arte',
  otro: '📦 Otro',
};

function statusBadge(status) {
  const map = {
    active:    { label: 'Disponible',   bg: 'rgba(16,185,129,0.18)', color: '#34d399', border: 'rgba(52,211,153,0.3)' },
    escrow:    { label: '🔒 En escrow', bg: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
    completed: { label: 'Vendido ✓',    bg: 'rgba(107,114,128,0.18)', color: '#9ca3af', border: 'rgba(156,163,175,0.3)' },
    cancelled: { label: 'Cancelado',    bg: 'rgba(239,68,68,0.18)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
    sold:      { label: 'Vendido',      bg: 'rgba(107,114,128,0.18)', color: '#9ca3af', border: 'rgba(156,163,175,0.3)' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: 0.3
    }}>
      {s.label}
    </span>
  );
}

const inputStyle = {
  background: 'rgba(79,172,254,0.07)',
  border: '1px solid rgba(79,172,254,0.18)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

function ListingCard({ listing, onClick }) {
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;
  return (
    <div
      onClick={() => onClick(listing)}
      style={{
        cursor: 'pointer',
        background: 'rgba(79,172,254,0.04)',
        border: '1px solid rgba(79,172,254,0.15)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'transform 0.18s, box-shadow 0.18s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {firstImage ? (
        <img
          src={firstImage}
          alt={listing.title}
          style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block', background: '#18182a' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div style={{
        display: firstImage ? 'none' : 'flex',
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(6,182,212,0.1))',
        fontSize: 42,
      }}>
        🛍️
      </div>
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: '#0a0a14', fontWeight: 700, fontSize: 14, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {listing.title}
        </div>
        <div style={{ color: '#06b6d4', fontWeight: 800, fontSize: 16 }}>
          ${listing.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {statusBadge(listing.status)}
          {listing.category && (
            <span style={{ fontSize: 11, color: 'rgba(10,10,20,0.5)', fontWeight: 600 }}>
              {CATEGORY_LABELS[listing.category] || listing.category}
            </span>
          )}
        </div>
        {listing.seller && (
          <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.5)', marginTop: 2 }}>
            @{listing.seller.username}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateListingModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'otro', imageUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        category: form.category,
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
      };
      await axios.post(`${API_URL}/listings`, payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <GlassCard style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ color: '#0a0a14', fontSize: 18, fontWeight: 700 }}>Nuevo Listing</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(10,10,20,0.5)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Título del producto *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            maxLength={120}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={2000}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
          />
          <input
            placeholder="Precio (USD) *"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            required
            style={inputStyle}
          />
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            style={selectStyle}
          >
            {CATEGORY_FILTERS.filter(c => c.value !== '').map(c => (
              <option key={c.value} value={c.value} style={{ background: '#0f0f1a' }}>{c.label}</option>
            ))}
          </select>
          <input
            placeholder="URL de imagen (opcional)"
            value={form.imageUrl}
            onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', color: '#0a0a14', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 2, padding: '11px 0', borderRadius: 12, background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', border: 'none', color: '#0a0a14', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function ListingDetailModal({ listing: initialListing, user, onClose, onUpdate }) {
  const [listing, setListing] = useState(initialListing);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const myId = user?._id || user?.id;
  const sellerId = listing.seller?._id || listing.seller;
  const buyerId = listing.buyer?._id || listing.buyer;
  const isSeller = myId && sellerId && myId.toString() === sellerId.toString();
  const isBuyer = myId && buyerId && myId.toString() === buyerId.toString();

  const handleBuy = async () => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await axios.post(`${API_URL}/listings/${listing._id}/buy`);
      setListing(data.listing);
      setMsg(data.message);
      onUpdate();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error al comprar');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await axios.post(`${API_URL}/listings/${listing._id}/release`);
      setListing(data.listing);
      setMsg(data.message);
      onUpdate();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error al liberar fondos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await axios.post(`${API_URL}/listings/${listing._id}/cancel`);
      setListing(data.listing);
      setMsg(data.message);
      onUpdate();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error al cancelar');
    } finally {
      setLoading(false);
    }
  };

  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <GlassCard style={{ width: '100%', maxWidth: 500, position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: 'rgba(10,10,20,0.5)', fontSize: 24, cursor: 'pointer', lineHeight: 1, zIndex: 1 }}
        >
          ×
        </button>

        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12, marginBottom: 16, background: '#18182a', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
            🛍️
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div style={{ color: '#0a0a14', fontWeight: 800, fontSize: 18, lineHeight: 1.3, flex: 1 }}>{listing.title}</div>
          {statusBadge(listing.status)}
        </div>

        <div style={{ color: '#06b6d4', fontWeight: 900, fontSize: 24, marginBottom: 12 }}>
          ${listing.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>

        {listing.description && (
          <div style={{ color: 'rgba(10,10,20,0.65)', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
            {listing.description}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: 'rgba(10,10,20,0.5)' }}>
            Categoría: <span style={{ color: 'rgba(10,10,20,0.65)' }}>{CATEGORY_LABELS[listing.category] || listing.category}</span>
          </div>
          {listing.seller && (
            <div style={{ fontSize: 13, color: 'rgba(10,10,20,0.5)' }}>
              Vendedor: <span style={{ color: '#a78bfa' }}>@{listing.seller.username}</span>
            </div>
          )}
        </div>

        {listing.status === 'escrow' && (
          <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>🔒 Fondos en Escrow</div>
            <div style={{ color: 'rgba(10,10,20,0.65)', fontSize: 12 }}>
              Monto retenido: <strong style={{ color: '#fbbf24' }}>${listing.escrow?.amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
            </div>
            {listing.buyer && (
              <div style={{ color: 'rgba(10,10,20,0.65)', fontSize: 12, marginTop: 3 }}>
                Comprador: <strong style={{ color: '#a78bfa' }}>@{listing.buyer.username || listing.buyer}</strong>
              </div>
            )}
          </div>
        )}

        {listing.status === 'completed' && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>Transacción completada ✓</div>
            {listing.escrow?.releasedAt && (
              <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12, marginTop: 3 }}>
                Liberado: {new Date(listing.escrow.releasedAt).toLocaleDateString('es-MX')}
              </div>
            )}
          </div>
        )}

        {msg && (
          <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '10px 14px', color: '#a78bfa', fontSize: 13, marginBottom: 14 }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {user && listing.status === 'active' && !isSeller && (
            <button
              onClick={handleBuy}
              disabled={loading}
              style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', border: 'none', color: '#0a0a14', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Procesando...' : 'Comprar · Poner en Escrow'}
            </button>
          )}

          {user && listing.status === 'escrow' && isBuyer && (
            <button
              onClick={handleRelease}
              disabled={loading}
              style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: '#0a0a14', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Procesando...' : 'Confirmar recepción · Liberar fondos'}
            </button>
          )}

          {user && listing.status === 'escrow' && (isBuyer || isSeller) && (
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Cancelando...' : 'Cancelar escrow'}
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function MyListingItem({ listing, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este listing?')) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/listings/${listing._id}`);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard style={{ marginBottom: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {firstImage ? (
          <img src={firstImage} alt={listing.title} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#18182a' }} />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: 10, background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🛍️</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#0a0a14', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {listing.title}
          </div>
          <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            ${listing.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {statusBadge(listing.status)}
            {listing.buyer && (
              <span style={{ fontSize: 11, color: 'rgba(10,10,20,0.5)' }}>
                Comprador: @{listing.buyer.username}
              </span>
            )}
          </div>
        </div>
        {listing.status === 'active' && (
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, padding: '6px 10px', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            {loading ? '...' : 'Eliminar'}
          </button>
        )}
      </div>
    </GlassCard>
  );
}

export default function Marketplace() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('explore');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef(null);

  const fetchListings = useCallback(async (q, cat, pg) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat) params.set('category', cat);
      if (q && q.trim()) params.set('search', q.trim());
      params.set('page', pg);
      const { data } = await axios.get(`${API_URL}/listings?${params.toString()}`);
      setListings(data.listings || []);
      setTotalPages(data.pages || 1);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${API_URL}/listings/mine`);
      setMyListings(data.listings || []);
    } catch {
      setMyListings([]);
    }
  }, [user]);

  useEffect(() => {
    fetchListings(search, category, page);
  }, [category, page]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchListings(search, category, 1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    if (tab === 'mine') fetchMyListings();
  }, [tab]);

  const handleTabChange = t => {
    setTab(t);
    if (t === 'mine') fetchMyListings();
  };

  const handleCategoryChange = cat => {
    setCategory(cat);
    setPage(1);
  };

  const handleCreated = () => {
    fetchListings(search, category, 1);
    fetchMyListings();
    setPage(1);
  };

  const handleUpdate = () => {
    fetchListings(search, category, page);
    if (tab === 'mine') fetchMyListings();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 80 }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ paddingTop: 72, paddingBottom: 8 }}>
          <HoloText size={26} style={{ marginBottom: 4 }}>Marketplace</HoloText>
          <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 14 }}>Compra y vende con escrow seguro</div>
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
          {['explore', 'mine'].map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
                color: tab === t ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                fontSize: 14,
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.2s',
              }}
            >
              {t === 'explore' ? 'Explorar' : 'Mis Listings'}
            </button>
          ))}
        </div>

        {tab === 'explore' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <input
                placeholder="Buscar productos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(79,172,254,0.07)',
                  border: '1px solid rgba(79,172,254,0.2)',
                  borderRadius: 12,
                  padding: '11px 16px',
                  color: '#0a0a14',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 16, scrollbarWidth: 'none' }}>
              {CATEGORY_FILTERS.map(c => (
                <button
                  key={c.value}
                  onClick={() => handleCategoryChange(c.value)}
                  style={{
                    flexShrink: 0,
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: category === c.value ? '1.5px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                    background: category === c.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                    color: category === c.value ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                    fontSize: 13,
                    fontWeight: category === c.value ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.18s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ background: 'rgba(79,172,254,0.04)', borderRadius: 16, height: 240, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(10,10,20,0.35)', fontSize: 14 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
                No hay listings disponibles
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                {listings.map(l => (
                  <ListingCard key={l._id} listing={l} onClick={setSelectedListing} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', color: page <= 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page <= 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}
                >
                  ← Anterior
                </button>
                <span style={{ display: 'flex', alignItems: 'center', color: 'rgba(10,10,20,0.5)', fontSize: 13 }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', color: page >= totalPages ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page >= totalPages ? 'default' : 'pointer', fontFamily: 'inherit' }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'mine' && (
          <>
            {!user ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(10,10,20,0.35)', fontSize: 14 }}>
                Inicia sesión para ver tus listings
              </div>
            ) : myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(10,10,20,0.35)', fontSize: 14 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                No has publicado nada aún
              </div>
            ) : (
              myListings.map(l => (
                <MyListingItem key={l._id} listing={l} onUpdate={handleUpdate} />
              ))
            )}
          </>
        )}
      </div>

      {user && (
        <button
          onClick={() => setShowCreate(true)}
          style={{
            position: 'fixed',
            bottom: 90,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            border: 'none',
            color: '#fff',
            fontSize: 28,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            lineHeight: 1,
          }}
          title="Crear listing"
        >
          +
        </button>
      )}

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          user={user}
          onClose={() => setSelectedListing(null)}
          onUpdate={handleUpdate}
        />
      )}

      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      <BottomNav />
    </div>
  );
}
