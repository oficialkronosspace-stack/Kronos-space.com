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
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const isAtBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    // Cargar info del otro usuario
    axios.get(`${API_URL}/users/${userId}`).then(r => setOtherUser(r.data.user || r.data)).catch(() => {});

    // Cargar mensajes y hacer scroll al final en carga inicial
    axios.get(`${API_URL}/messages/conversation/${userId}`)
      .then(r => {
        setMessages(r.data.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
      })
      .catch(() => setMessages([]));

    // Socket
    const sock = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    if (user?._id || user?.id) sock.emit('user_online', user._id || user.id);
    sock.on('receive_private_message', (data) => {
      setMessages(prev => [...prev, data]);
    });
    sock.on('user_typing', (data) => { if (data.userId === userId) setIsTyping(true); });
    sock.on('user_stopped_typing', (data) => { if (data.userId === userId) setIsTyping(false); });
    setSocket(sock);

    return () => sock.close();
  }, [userId]);

  // Smart auto-scroll: solo si ya estás al fondo
  useEffect(() => {
    if (messages.length === 0) return;
    if (isAtBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = { senderId: user?._id || user?.id, receiverId: userId, content: input, timestamp: new Date() };
    try {
      await axios.post(`${API_URL}/messages/send`, { receiverId: userId, content: input });
      socket?.emit('send_private_message', msg);
      setMessages(prev => [...prev, msg]);
    } catch {}
    setInput('');
    socket?.emit('stopped_typing', { receiverId: userId, userId: user?._id || user?.id });
  };

  const handleVoiceToggle = async () => {
    if (isRecordingVoice) {
      // Detener grabación
      mediaRecorderRef.current?.stop();
      setIsRecordingVoice(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append('audio', blob, 'voice.webm');
          const res = await axios.post(`${API_URL}/audio/transcribe`, form, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.data.text) setInput(prev => prev + res.data.text);
        } catch {
          // transcripción falló silenciosamente
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
    } catch {
      // Sin permiso de micrófono
    }
  };

  const myId = user?._id || user?.id;

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#ffffff', borderBottom: '1px solid rgba(79,172,254,0.12)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate('/social/chat')} style={{ background: 'none', border: 'none', color: 'rgba(10,10,20,0.65)', fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        {otherUser && (
          <>
            <img src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=random&color=fff&size=40`} alt={otherUser.username} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div style={{ color: '#0a0a14', fontWeight: 600, fontSize: 14 }}>{otherUser.firstName} {otherUser.lastName || otherUser.username}</div>
              <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 11 }}>{isTyping ? 'escribiendo...' : `@${otherUser.username}`}</div>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 80 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 40 }}>
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
                color: '#0a0a14', fontSize: 14, lineHeight: 1.4,
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#ffffff', borderTop: '1px solid rgba(79,172,254,0.12)', backdropFilter: 'blur(12px)', display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Micrófono — voz a texto */}
        <button
          onClick={handleVoiceToggle}
          disabled={isTranscribing}
          title={isRecordingVoice ? 'Detener grabación' : 'Grabar mensaje de voz'}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: isRecordingVoice
              ? 'linear-gradient(135deg,#ef4444,#dc2626)'
              : 'rgba(79,172,254,0.1)',
            fontSize: isTranscribing ? 12 : 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: isRecordingVoice ? 'micPulse 1s ease-in-out infinite' : 'none',
          }}
        >
          {isTranscribing ? '...' : isRecordingVoice ? '⏹' : '🎤'}
        </button>

        <input
          value={input}
          onChange={e => { setInput(e.target.value); socket?.emit('typing', { receiverId: userId, userId: myId }); }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={isRecordingVoice ? 'Grabando...' : 'Escribe un mensaje...'}
          style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 24, padding: '10px 16px', color: '#0a0a14', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{ width: 42, height: 42, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.08)', border: 'none', color: '#0a0a14', fontSize: 18, cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          ➤
        </button>
      </div>
      <style>{`@keyframes micPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

export default Chat;
