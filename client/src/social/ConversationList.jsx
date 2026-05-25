import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GlassCard, HoloText } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_URL}/search/users`, { params: { q: search, limit: 8 } });
        setResults(r.data.users || []);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggle = (u) => setSelected(prev => prev.find(p => p._id === u._id) ? prev.filter(p => p._id !== u._id) : [...prev, u]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/group-chats`, { name, description, memberIds: selected.map(u => u._id) });
      onCreated();
      onClose();
    } catch { }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassCard style={{ width: '90%', maxWidth: 420 }}>
        <div style={{ color: '#0a0a14', fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Nuevo Grupo</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del grupo *"
          style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 10, padding: '9px 14px', color: '#0a0a14', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)"
          style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 10, padding: '9px 14px', color: '#0a0a14', fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar y añadir miembros..."
          style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 10, padding: '9px 14px', color: '#0a0a14', fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit' }} />
        {results.map(u => (
          <div key={u._id} onClick={() => toggle(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer' }}>
            <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff&size=32`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <div style={{ flex: 1, color: '#0a0a14', fontSize: 13 }}>{u.firstName} {u.lastName} <span style={{ color: 'rgba(10,10,20,0.5)' }}>@{u.username}</span></div>
            <span style={{ fontSize: 16 }}>{selected.find(p => p._id === u._id) ? '✅' : '⬜'}</span>
          </div>
        ))}
        {selected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4 }}>
            {selected.map(u => <span key={u._id} style={{ background: 'rgba(124,58,237,0.3)', color: '#a855f7', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{u.firstName || u.username}</span>)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(79,172,254,0.07)', color: '#0a0a14', border: 'none', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleCreate} disabled={loading || !name.trim()}
            style={{ flex: 2, padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            {loading ? 'Creando...' : 'Crear Grupo'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

export default function ConversationList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('directos');
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const fetchData = () => {
    axios.get(`${API_URL}/messages/chats`).then(r => setChats(r.data.chats || [])).catch(() => {});
    axios.get(`${API_URL}/group-chats`).then(r => setGroups(r.data.data || [])).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await axios.get(`${API_URL}/search/users`, { params: { q: search, limit: 8 } });
        setSearchResults(r.data.users || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 80 }}>
      <div style={{ padding: '16px', maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <HoloText size={26}>Mensajes</HoloText>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/live')}
              style={{ padding: '7px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#ef4444,#f59e0b)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              🔴 LIVE
            </button>
            {tab === 'grupos' && (
              <button onClick={() => setCreatingGroup(true)}
                style={{ padding: '7px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                + Grupo
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ id: 'directos', label: '💬 Directos' }, { id: 'grupos', label: '👥 Grupos' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '9px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.06)', color: '#fff' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Buscador (solo directos) */}
        {tab === 'directos' && (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar personas..."
              style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 24, padding: '10px 14px 10px 40px', color: '#0a0a14', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
        )}

        {/* Resultados búsqueda */}
        {tab === 'directos' && search.trim() && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {searching ? 'Buscando...' : `${searchResults.length} resultado(s)`}
            </div>
            {searchResults.map(u => (
              <GlassCard key={u._id} onClick={() => navigate(`/social/chat/${u._id}`)} style={{ cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff&size=40`} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ color: '#0a0a14', fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                    <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>@{u.username}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 18 }}>💬</span>
                </div>
              </GlassCard>
            ))}
            {!searching && searchResults.length === 0 && (
              <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 13, textAlign: 'center', padding: 16 }}>No encontrado</div>
            )}
          </div>
        )}

        {/* Conversaciones directas */}
        {tab === 'directos' && !search.trim() && (
          <>
            <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Conversaciones</div>
            {chats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(10,10,20,0.35)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(10,10,20,0.5)' }}>Sin conversaciones aún</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Busca personas arriba</div>
              </div>
            ) : chats.map(chat => (
              <GlassCard key={chat.userId} onClick={() => navigate(`/social/chat/${chat.userId}`)} style={{ cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.username}&background=random&color=fff&size=40`} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#0a0a14', fontWeight: 600, fontSize: 14 }}>{chat.firstName || chat.username}</div>
                    <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.lastMessage || 'Sin mensajes aún'}</div>
                  </div>
                  {chat.unread > 0 && (
                    <span style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{chat.unread}</span>
                  )}
                </div>
              </GlassCard>
            ))}
          </>
        )}

        {/* Grupos */}
        {tab === 'grupos' && (
          <>
            <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tus grupos</div>
            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(10,10,20,0.35)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(10,10,20,0.5)' }}>Sin grupos aún</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Crea uno con el botón + Grupo</div>
              </div>
            ) : groups.map(g => (
              <GlassCard key={g._id} onClick={() => navigate(`/social/group/${g._id}`)} style={{ cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#0a0a14', fontWeight: 600, fontSize: 14 }}>{g.name}</div>
                    <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.lastMessage?.content || `${g.members?.length || 0} miembros`}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </>
        )}
      </div>

      {creatingGroup && <CreateGroupModal onClose={() => setCreatingGroup(false)} onCreated={fetchData} />}
    </div>
  );
}
