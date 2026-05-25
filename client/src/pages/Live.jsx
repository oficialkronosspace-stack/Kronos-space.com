import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { GlassCard, HoloText, BottomNav } from '../components/kronos';
import { AuthContext } from '../context/AuthContext';

const SOCKET_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

// ─── VIDEO CALL ────────────────────────────────────────────────────────────────
function VideoCall({ socket, targetUserId, targetName, onEnd }) {
  const { user } = useContext(AuthContext);
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  useEffect(() => {
    let stream;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localRef.current) localRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        stream.getTracks().forEach(t => pc.addTrack(t, stream));

        pc.ontrack = e => { if (remoteRef.current) remoteRef.current.srcObject = e.streams[0]; };
        pc.onicecandidate = e => {
          if (e.candidate) socket.emit('call_ice_candidate', { targetUserId, candidate: e.candidate });
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call_offer', { targetUserId, offer, callerId: user?._id, callerName: user?.firstName || user?.username });
        setStatus('ringing');
      } catch (err) {
        // silenced;
        setStatus('error');
      }
    };

    socket.on('call_answered', async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
      setStatus('connected');
    });
    socket.on('ice_candidate', async ({ candidate }) => {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });
    socket.on('call_ended', () => { cleanup(); onEnd(); });
    socket.on('call_rejected', () => { setStatus('rejected'); setTimeout(onEnd, 2000); });

    init();
    return () => cleanup();

    function cleanup() {
      stream?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    }
  }, []);

  const toggleMute = () => {
    const stream = localRef.current?.srcObject;
    stream?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };
  const toggleCam = () => {
    const stream = localRef.current?.srcObject;
    stream?.getVideoTracks().forEach(t => { t.enabled = camOff; });
    setCamOff(c => !c);
  };
  const hangUp = () => {
    socket.emit('call_end', { targetUserId });
    onEnd();
  };

  const statusLabel = { connecting: 'Conectando...', ringing: `Llamando a ${targetName}...`, connected: 'En llamada', error: 'Error de cámara', rejected: 'Llamada rechazada' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 640, aspectRatio: '16/9', background: '#111', borderRadius: 16, overflow: 'hidden' }}>
        <video ref={remoteRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <video ref={localRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: 12, right: 12, width: 120, height: 90, objectFit: 'cover', borderRadius: 10, border: '2px solid rgba(255,255,255,0.3)' }} />
        <div style={{ position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center', color: 'rgba(10,10,20,0.65)', fontSize: 14 }}>{statusLabel[status]}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        {[
          { icon: muted ? '🔇' : '🎤', action: toggleMute, bg: muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)' },
          { icon: camOff ? '📵' : '📷', action: toggleCam, bg: camOff ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)' },
          { icon: '📞', action: hangUp, bg: '#ef4444' },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{ width: 56, height: 56, borderRadius: '50%', background: btn.bg, border: 'none', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── INCOMING CALL MODAL ───────────────────────────────────────────────────────
function IncomingCallModal({ callerName, onAccept, onReject }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassCard style={{ textAlign: 'center', padding: 40, maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📲</div>
        <div style={{ color: '#0a0a14', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Llamada entrante</div>
        <div style={{ color: 'rgba(10,10,20,0.65)', fontSize: 14, marginBottom: 28 }}>{callerName}</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={onReject} style={{ width: 56, height: 56, borderRadius: '50%', background: '#ef4444', border: 'none', fontSize: 22, cursor: 'pointer' }}>📵</button>
          <button onClick={onAccept} style={{ width: 56, height: 56, borderRadius: '50%', background: '#10b981', border: 'none', fontSize: 22, cursor: 'pointer' }}>📞</button>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── LIVE STREAMER ─────────────────────────────────────────────────────────────
function LiveStreamer({ socket, streamerId, streamerName, onStop }) {
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const [, setViewers] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [live, setLive] = useState(false);

  useEffect(() => {
    socket.on('stream_chat', msg => setChatMessages(prev => [...prev, msg].slice(-50)));
    return () => {};
  }, [socket]);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      socket.emit('start_stream', { streamerId, streamerName });

      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      rec.ondataavailable = e => {
        if (e.data.size > 0) {
          const reader = new FileReader();
          reader.onload = () => socket.emit('stream_chunk', { streamerId, chunk: reader.result });
          reader.readAsArrayBuffer(e.data);
        }
      };
      rec.start(250);
      recorderRef.current = { recorder: rec, stream };
      setLive(true);
    } catch (e) { alert('No se pudo acceder a la cámara'); }
  };

  const stopStream = () => {
    recorderRef.current?.recorder.stop();
    recorderRef.current?.stream.getTracks().forEach(t => t.stop());
    socket.emit('stop_stream', { streamerId });
    setLive(false);
    onStop();
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('stream_chat', { streamerId, username: streamerName, message: chatInput });
    setChatInput('');
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 480 }}>
      <div style={{ flex: 1, position: 'relative', background: '#111', borderRadius: 16, overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {live && <div style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: '#0a0a14', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>🔴 EN VIVO</div>}
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          {!live
            ? <button onClick={startStream} style={{ padding: '12px 32px', borderRadius: 28, background: '#ef4444', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Iniciar Stream</button>
            : <button onClick={stopStream} style={{ padding: '12px 32px', borderRadius: 28, background: 'rgba(239,68,68,0.3)', color: '#fff', border: '2px solid #ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Detener</button>
          }
        </div>
      </div>
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>Chat del stream</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chatMessages.map((m, i) => (
            <div key={i} style={{ background: 'rgba(79,172,254,0.07)', borderRadius: 8, padding: '6px 10px' }}>
              <span style={{ color: '#a855f7', fontSize: 11, fontWeight: 700 }}>{m.username}: </span>
              <span style={{ color: 'rgba(10,10,20,0.65)', fontSize: 12 }}>{m.message}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Mensaje..."
            style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 20, padding: '7px 12px', color: '#0a0a14', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={sendChat} style={{ padding: '7px 12px', borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── LIVE VIEWER ───────────────────────────────────────────────────────────────
const LIVE_REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '🎉'];

function LiveViewer({ socket, stream, currentUser }) {
  const videoRef = useRef(null);
  const msRef = useRef(null);
  const sbRef = useRef(null);
  const chatEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(stream.viewers || 1);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const sendReaction = (emoji) => {
    const id = Date.now();
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 1400);
    socket.emit('stream_chat', { streamerId: stream.streamerId, username: currentUser?.firstName || currentUser?.username, message: emoji, isReaction: true });
  };

  useEffect(() => {
    socket.emit('watch_stream', { streamerId: stream.streamerId });

    const ms = new MediaSource();
    msRef.current = ms;
    if (videoRef.current) videoRef.current.src = URL.createObjectURL(ms);

    ms.addEventListener('sourceopen', () => {
      try {
        const sb = ms.addSourceBuffer('video/webm;codecs=vp8,opus');
        sbRef.current = sb;
      } catch { }
    });

    socket.on('viewer_count', ({ streamerId, count }) => {
      if (streamerId === stream.streamerId) setViewerCount(count);
    });

    socket.on('stream_chunk', ({ streamerId, chunk }) => {
      if (streamerId !== stream.streamerId) return;
      if (sbRef.current && !sbRef.current.updating) {
        sbRef.current.appendBuffer(chunk);
      }
    });
    socket.on('stream_ended', () => { if (msRef.current?.readyState === 'open') msRef.current.endOfStream(); });
    socket.on('stream_chat', msg => {
      if (msg.streamerId === stream.streamerId) {
        setChatMessages(prev => [...prev, msg].slice(-80));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    });

    return () => { socket.off('viewer_count'); };
  }, [stream.streamerId]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('stream_chat', { streamerId: stream.streamerId, username: currentUser?.firstName || currentUser?.username, message: chatInput });
    setChatInput('');
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 500 }}>
      {/* Video side */}
      <div style={{ flex: 1, background: '#111', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: '#ef4444', color: '#0a0a14', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>🔴 EN VIVO</div>
          <div style={{ background: 'rgba(0,0,0,0.6)', color: '#0a0a14', fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>👁 {viewerCount}</div>
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: 'rgba(10,10,20,0.65)', fontSize: 13, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {stream.streamerName}
        </div>
        {/* Floating reactions */}
        <div style={{ position: 'absolute', bottom: 60, right: 16, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none' }}>
          {floatingReactions.map(r => (
            <div key={r.id} style={{ fontSize: 28, animation: 'floatUp 1.4s ease-out forwards' }}>{r.emoji}</div>
          ))}
        </div>
      </div>

      {/* Chat sidebar */}
      <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>Chat en vivo</div>
          <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 11 }}>👁 {viewerCount} viendo</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 2 }}>
          {chatMessages.map((m, i) => (
            <div key={i} style={{ background: m.isReaction ? 'transparent' : 'rgba(255,255,255,0.05)', borderRadius: 8, padding: m.isReaction ? '2px 4px' : '5px 8px', display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              {m.isReaction
                ? <span style={{ fontSize: 20 }}>{m.message}</span>
                : <>
                    <span style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, flexShrink: 0, paddingTop: 1 }}>{m.username}</span>
                    <span style={{ color: 'rgba(10,10,20,0.65)', fontSize: 11, lineHeight: 1.4 }}>{m.message}</span>
                  </>
              }
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Reactions bar */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', paddingBottom: 4 }}>
          {LIVE_REACTIONS.map(emoji => (
            <button key={emoji} onClick={() => sendReaction(emoji)}
              style={{ background: 'rgba(79,172,254,0.07)', border: 'none', borderRadius: 8, padding: '5px 7px', fontSize: 16, cursor: 'pointer', transition: 'transform 0.1s', lineHeight: 1 }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(1.3)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              {emoji}
            </button>
          ))}
        </div>

        {/* Chat input */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Mensaje..."
            style={{ flex: 1, background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 20, padding: '7px 12px', color: '#0a0a14', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={sendChat} style={{ padding: '7px 12px', borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN LIVE PAGE ────────────────────────────────────────────────────────────
export default function Live() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [tab, setTab] = useState('streams');
  const [activeStreams, setActiveStreams] = useState([]);
  const [watchingStream, setWatchingStream] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callTarget, setCallTarget] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const pcAnswerRef = useRef(null);
  const myId = user?._id || user?.id;

  useEffect(() => {
    const sock = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    if (myId) sock.emit('user_online', myId);
    setSocket(sock);

    sock.on('stream_started', data => setActiveStreams(prev => [...prev.filter(s => s.streamerId !== data.streamerId), data]));
    sock.on('stream_stopped', ({ streamerId }) => setActiveStreams(prev => prev.filter(s => s.streamerId !== streamerId)));

    sock.on('incoming_call', async ({ callerId, callerName, offer }) => {
      setIncomingCall({ callerId, callerName, offer });
    });

    return () => sock.close();
  }, [myId]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchUsers([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await axios.get(`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api')}/search/users`, { params: { q: searchQuery, limit: 6 } });
        setSearchUsers(r.data.users || []);
      } catch { setSearchUsers([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    const { callerId, offer } = incomingCall;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
    if (!stream) return;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcAnswerRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.onicecandidate = e => { if (e.candidate) socket.emit('call_ice_candidate', { targetUserId: callerId, candidate: e.candidate }); };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('call_answer', { callerId, answer });

    setCallTarget({ userId: callerId, name: incomingCall.callerName });
    setIncomingCall(null);
    setInCall(true);
  };

  const rejectCall = () => {
    if (incomingCall && socket) socket.emit('call_rejected', { callerId: incomingCall.callerId });
    setIncomingCall(null);
  };

  const startCall = (targetUser) => {
    setCallTarget({ userId: targetUser._id, name: targetUser.firstName || targetUser.username });
    setInCall(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 80 }}>
      <div style={{ padding: '16px', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <HoloText size={26}>LIVE</HoloText>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/portal')} style={{ padding: '7px 14px', borderRadius: 20, background: 'rgba(124,58,237,0.2)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              🎧 Audio Spaces
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'streams', label: '📺 Streams' },
            { id: 'videocall', label: '📹 Videollamada' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t.id ? 'linear-gradient(135deg,#ef4444,#f59e0b)' : 'rgba(255,255,255,0.06)', color: '#fff' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* STREAMS TAB */}
        {tab === 'streams' && (
          <>
            {!streaming && !watchingStream && (
              <>
                <GlassCard style={{ marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🎬</div>
                  <div style={{ color: '#0a0a14', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>¿Quieres transmitir?</div>
                  <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 13, marginBottom: 16 }}>Tu audiencia te está esperando</div>
                  <button onClick={() => setStreaming(true)}
                    style={{ padding: '12px 32px', borderRadius: 28, background: 'linear-gradient(135deg,#ef4444,#f59e0b)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    🔴 Ir en Vivo
                  </button>
                </GlassCard>

                <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Streams activos ({activeStreams.length})
                </div>
                {activeStreams.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📡</div>
                    <div>No hay streams activos ahora</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>¡Sé el primero en transmitir!</div>
                  </div>
                ) : activeStreams.map(s => (
                  <GlassCard key={s.streamerId} style={{ cursor: 'pointer', marginBottom: 10, padding: 0, overflow: 'hidden' }} onClick={() => setWatchingStream(s)}>
                    {/* Thumbnail banner */}
                    <div style={{ height: 100, background: 'linear-gradient(135deg,#1a0533,#0c1a3d)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 36 }}>📺</div>
                      <div style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#0a0a14', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>🔴 LIVE</div>
                      {s.viewers > 0 && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#0a0a14', fontSize: 10, padding: '3px 8px', borderRadius: 20 }}>👁 {s.viewers}</div>
                      )}
                    </div>
                    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.streamerName)}&background=7c3aed&color=fff&size=40`} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      <div>
                        <div style={{ color: '#0a0a14', fontWeight: 700, fontSize: 14 }}>{s.streamerName}</div>
                        <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11 }}>Toca para ver el stream</div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </>
            )}

            {streaming && socket && (
              <GlassCard>
                <LiveStreamer socket={socket} streamerId={myId} streamerName={user?.firstName || user?.username} onStop={() => setStreaming(false)} />
              </GlassCard>
            )}

            {watchingStream && socket && (
              <>
                <button onClick={() => setWatchingStream(null)} style={{ background: 'none', border: 'none', color: 'rgba(10,10,20,0.65)', fontSize: 14, cursor: 'pointer', marginBottom: 12 }}>← Volver</button>
                <GlassCard>
                  <LiveViewer socket={socket} stream={watchingStream} currentUser={user} />
                </GlassCard>
              </>
            )}
          </>
        )}

        {/* VIDEO CALL TAB */}
        {tab === 'videocall' && !inCall && (
          <GlassCard>
            <div style={{ color: '#0a0a14', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Llamar a alguien</div>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar usuarios..."
              style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(79,172,254,0.2)', borderRadius: 20, padding: '10px 16px', color: '#0a0a14', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            {searchUsers.map(u => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px' }}>
                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff&size=40`} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#0a0a14', fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                  <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>@{u.username}</div>
                </div>
                <button onClick={() => startCall(u)}
                  style={{ padding: '8px 18px', borderRadius: 20, background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  📹 Llamar
                </button>
              </div>
            ))}
            {!searchQuery && (
              <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📹</div>
                <div>Busca un usuario para iniciar una videollamada</div>
              </div>
            )}
          </GlassCard>
        )}
      </div>

      {inCall && socket && callTarget && (
        <VideoCall socket={socket} targetUserId={callTarget.userId} targetName={callTarget.name} onEnd={() => { setInCall(false); setCallTarget(null); }} />
      )}
      {incomingCall && (
        <IncomingCallModal callerName={incomingCall.callerName} onAccept={acceptCall} onReject={rejectCall} />
      )}

      <BottomNav />
    </div>
  );
}
