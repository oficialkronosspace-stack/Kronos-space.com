import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GlassCard, HoloText, BottomNav } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ConversationList() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/messages/chats`)
      .then(r => setChats(r.data.chats || []))
      .catch(() => setChats([]));
  }, []);

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

  const goToChat = (userId) => navigate(`/social/chat/${userId}`);

  return (
    <div style={{ minHeight: '100vh', background: '#08080f', paddingBottom: 80 }}>
      <div style={{ padding: '16px', maxWidth: 680, margin: '0 auto' }}>
        <HoloText size={26} style={{ marginBottom: 16 }}>Mensajes</HoloText>

        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar personas..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24, padding: '10px 14px 10px 40px', color: '#fff', fontSize: 14,
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Resultados de búsqueda */}
        {search.trim() && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              {searching ? 'Buscando...' : `${searchResults.length} resultado(s)`}
            </div>
            {searchResults.map(u => (
              <GlassCard key={u._id} onClick={() => goToChat(u._id)} style={{ cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff&size=40`} alt={u.username} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>@{u.username}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 18 }}>💬</span>
                </div>
              </GlassCard>
            ))}
            {!searching && searchResults.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: 16 }}>No se encontraron usuarios</div>
            )}
          </div>
        )}

        {/* Conversaciones recientes */}
        {!search.trim() && (
          <>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Conversaciones</div>
            {chats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Sin conversaciones aún</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Busca personas para empezar a chatear</div>
              </div>
            ) : (
              chats.map(chat => (
                <GlassCard key={chat.userId} onClick={() => goToChat(chat.userId)} style={{ cursor: 'pointer', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.username}&background=random&color=fff&size=40`} alt={chat.username} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{chat.firstName || chat.username}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.lastMessage || 'Sin mensajes aún'}
                      </div>
                    </div>
                    {chat.unread > 0 && (
                      <span style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </GlassCard>
              ))
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
