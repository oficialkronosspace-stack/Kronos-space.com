import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GlassCard, HoloText } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TYPE_META = {
  like:             { icon: '❤️', color: '#ef4444', label: 'Le dio like a tu post' },
  comment:          { icon: '💬', color: '#3b82f6', label: 'Comentó en tu post' },
  follow:           { icon: '👤', color: '#a855f7', label: 'Empezó a seguirte' },
  message:          { icon: '📩', color: '#06b6d4', label: 'Te envió un mensaje' },
  transfer:         { icon: '💸', color: '#10b981', label: 'Te envió dinero' },
  community_invite: { icon: '🏛️', color: '#f59e0b', label: 'Te invitó a una comunidad' },
  story_reaction:   { icon: '✨', color: '#ec4899', label: 'Reaccionó a tu historia' },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/notifications`, { headers });
      setNotifications(data.notifications || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const markOneRead = async (notif) => {
    if (!notif.read) {
      try {
        await axios.put(`${API_URL}/notifications/${notif._id}/read`, {}, { headers });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch {}
    }
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <HoloText size={24}>Notificaciones</HoloText>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ padding: '7px 14px', borderRadius: 20, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Marcar todo leído
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'all', label: `Todas (${notifications.length})` },
            { id: 'unread', label: `No leídas (${unreadCount})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ flex: 1, padding: '9px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f.id ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.06)', color: '#fff' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(10,10,20,0.35)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(10,10,20,0.35)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {filter === 'unread' ? 'Todo al día' : 'Sin notificaciones'}
            </div>
            <div style={{ fontSize: 13 }}>
              {filter === 'unread' ? 'No tienes notificaciones pendientes' : 'Aquí aparecerán tus likes, comentarios y mensajes'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(notif => {
              const meta = TYPE_META[notif.type] || { icon: '🔔', color: '#a855f7', label: notif.type };
              const sender = notif.sender;
              return (
                <GlassCard
                  key={notif._id}
                  onClick={() => markOneRead(notif)}
                  style={{
                    cursor: notif.link ? 'pointer' : 'default',
                    padding: '12px 14px',
                    background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(168,85,247,0.08)',
                    borderLeft: notif.read ? '3px solid transparent' : `3px solid ${meta.color}`,
                    transition: 'background 0.2s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar or icon */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {sender?.avatar ? (
                        <img src={sender.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          {meta.icon}
                        </div>
                      )}
                      {sender?.avatar && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                          {meta.icon}
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#0a0a14', fontSize: 13, lineHeight: 1.4 }}>
                        {sender && (
                          <span style={{ fontWeight: 700 }}>
                            {sender.firstName || sender.username}{' '}
                          </span>
                        )}
                        <span style={{ color: 'rgba(10,10,20,0.65)' }}>
                          {notif.body || meta.label}
                        </span>
                      </div>
                      {notif.title && notif.title !== notif.body && (
                        <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {notif.title}
                        </div>
                      )}
                    </div>

                    {/* Time + unread dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ color: 'rgba(10,10,20,0.35)', fontSize: 11 }}>{timeAgo(notif.createdAt)}</span>
                      {!notif.read && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
