import { SkeletonList } from '../components/kronos';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GlassCard, HoloText } from '../components/kronos';
import { AuthContext } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'tech', label: '💻 Tech' },
  { value: 'art', label: '🎨 Arte' },
  { value: 'sports', label: '⚽ Deportes' },
  { value: 'music', label: '🎵 Música' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'travel', label: '✈️ Viajes' },
  { value: 'fashion', label: '👗 Moda' },
  { value: 'health', label: '💪 Salud' },
  { value: 'other', label: '🌐 Otro' },
];

function CreateCommunityModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', privacy: 'public', category: 'other' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/communities`, form);
      onCreated();
      onClose();
    } catch (err) {
      // silenced;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassCard style={{ width: '90%', maxWidth: 440 }}>
        <div style={{ color: '#0a0a14', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Nueva Comunidad</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Nombre de la comunidad *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            maxLength={100}
            required
            style={{ background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 10, padding: '10px 14px', color: '#0a0a14', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            maxLength={500}
            style={{ background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 10, padding: '10px 14px', color: '#0a0a14', fontSize: 14, outline: 'none', resize: 'none', minHeight: 80, fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 10, padding: '10px 12px', color: '#0a0a14', fontSize: 13, outline: 'none' }}>
              {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={form.privacy} onChange={e => setForm(f => ({ ...f, privacy: e.target.value }))}
              style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 10, padding: '10px 12px', color: '#0a0a14', fontSize: 13, outline: 'none' }}>
              <option value="public">🌍 Pública</option>
              <option value="private">🔒 Privada</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(79,172,254,0.07)', color: '#0a0a14', border: 'none', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
            <button type="submit" disabled={loading || !form.name.trim()}
              style={{ flex: 2, padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              {loading ? 'Creando...' : 'Crear Comunidad'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function CommunityCard({ community, currentUserId, onJoin, onClick }) {
  const isMember = community.members?.some(m => (m.user?._id || m.user || m._id || m)?.toString() === currentUserId?.toString());
  const label = CATEGORIES.find(c => c.value === community.category)?.label || community.category;

  return (
    <GlassCard
      style={{ cursor: 'pointer', transition: 'border 0.2s' }}
      onClick={() => onClick(community._id)}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden'
        }}>
          {community.avatar ? <img src={community.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : label.split(' ')[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#0a0a14', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{community.name}</div>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: community.privacy === 'private' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: community.privacy === 'private' ? '#ef4444' : '#10b981', flexShrink: 0 }}>
              {community.privacy === 'private' ? '🔒' : '🌍'}
            </span>
          </div>
          <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {community.description || 'Sin descripción'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11 }}>👥 {community.members?.length || 0} miembros</span>
            <button
              onClick={e => { e.stopPropagation(); onJoin(community._id); }}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: isMember ? 'rgba(79,172,254,0.1)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: '#fff'
              }}
            >
              {isMember ? 'Salir' : 'Unirse'}
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function Communities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState('explore');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      const endpoint = tab === 'mine' ? `${API_URL}/communities/mine` : `${API_URL}/communities`;
      const res = await axios.get(endpoint, { params });
      setCommunities(res.data.data || []);
    } catch (e) {
      // silenced;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommunities(); }, [category, tab]);

  const handleSearch = e => {
    e.preventDefault();
    fetchCommunities();
  };

  const handleJoin = async id => {
    try {
      await axios.post(`${API_URL}/communities/${id}/join`);
      fetchCommunities();
    } catch (e) {
      // silenced;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 680, margin: '0 auto' }}>
        <HoloText size={26}>Comunidades</HoloText>
        <button
          onClick={() => setCreating(true)}
          style={{ padding: '8px 18px', borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          + Nueva
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ id: 'explore', label: 'Explorar' }, { id: 'mine', label: 'Mis Comunidades' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.06)', color: '#fff', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        {tab === 'explore' && (
          <GlassCard style={{ marginBottom: 16 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar comunidades..."
                style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 20, padding: '9px 16px', color: '#0a0a14', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
              <button type="submit" style={{ padding: '9px 18px', borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Buscar
              </button>
            </form>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: category === c.value ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: category === c.value ? 700 : 400 }}>
                  {c.label}
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Communities list */}
        {loading ? (<div style={{padding:'0 16px'}}><SkeletonList count={4} /></div>) : communities.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(10,10,20,0.5)' }}>
              {tab === 'mine' ? 'No perteneces a ninguna comunidad aún' : 'No hay comunidades'}
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>¡Crea la primera!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {communities.map(c => (
              <CommunityCard
                key={c._id}
                community={c}
                currentUserId={user?._id}
                onJoin={handleJoin}
                onClick={id => navigate(`/communities/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {creating && <CreateCommunityModal onClose={() => setCreating(false)} onCreated={fetchCommunities} />}
    </div>
  );
}
