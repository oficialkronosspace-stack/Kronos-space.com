import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace('/api', '');

function Chat() {
  const { userName: userId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Cargar info del otro usuario
    axios.get(`${API_URL}/users/${userId}`).then(r => setOtherUser(r.data.user || r.data)).catch(() => {});

    // Cargar mensajes
    axios.get(`${API_URL}/messages/conversation/${userId}`)
      .then(r => setMessages(r.data.messages || []))
      .catch(() => setMessages([]));

    // Socket
    const sock = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    if (user?._id || user?.id) sock.emit('user_online', user._id || user.id);
    sock.on('receive_private_message', (data) => setMessages(prev => [...prev, data]));
    sock.on('user_typing', (data) => { if (data.userId === userId) setIsTyping(true); });
    sock.on('user_stopped_typing', (data) => { if (data.userId === userId) setIsTyping(false); });
    setSocket(sock);

    return () => sock.close();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = { senderId: user?._id || user?.id, receiverId: userId, content: input, timestamp: new Date() };
    try {
      await axios.post(`${API_URL}/messages/send`, { receiverId: userId, content: input });
      socket?.emit('send_private_message', msg);
      setMessages(prev => [...prev, msg]);
    } catch (e) { console.error(e); }
    setInput('');
    socket?.emit('stopped_typing', { receiverId: userId, userId: user?._id || user?.id });
  };

  const myId = user?._id || user?.id;

  return (
    <div style={{ minHeight: '100vh', background: '#08080f', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(10,10,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate('/social/chat')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        {otherUser && (
          <>
            <img src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=random&color=fff&size=40`} alt={otherUser.username} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{otherUser.firstName} {otherUser.lastName || otherUser.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{isTyping ? 'escribiendo...' : `@${otherUser.username}`}</div>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 80 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <div>Inicia la conversación</div>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = (msg.senderId === myId) || (msg.senderId?._id === myId) || (msg.senderId?.toString() === myId?.toString());
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMine ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 14, lineHeight: 1.4,
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'rgba(10,10,18,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); socket?.emit('typing', { receiverId: userId, userId: myId }); }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Escribe un mensaje..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '10px 16px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{ width: 42, height: 42, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 18, cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default Chat;
