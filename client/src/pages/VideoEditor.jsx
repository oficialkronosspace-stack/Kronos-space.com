import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/kronos';

const CSS_FILTERS = [
  { label: 'Normal', value: 'none' },
  { label: 'B&N', value: 'grayscale(100%)' },
  { label: 'Sepia', value: 'sepia(80%)' },
  { label: 'Contraste', value: 'contrast(180%) brightness(0.9)' },
  { label: 'Vintage', value: 'sepia(40%) saturate(0.8) contrast(1.2) brightness(0.85)' },
];

export default function VideoEditor() {
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [overlay, setOverlay] = useState('');
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [msg, setMsg] = useState(null);

  const videoRef = useRef(null);
  const livePreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  // Apply filter and speed to video element when they change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.filter = activeFilter;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [activeFilter, playbackRate]);

  // Track current time for trim indicator
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => setCurrentTime(vid.currentTime);
    const onLoaded = () => setDuration(vid.duration || 0);
    vid.addEventListener('timeupdate', onTime);
    vid.addEventListener('loadedmetadata', onLoaded);
    return () => {
      vid.removeEventListener('timeupdate', onTime);
      vid.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [videoUrl]);

  const showMsg = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 3000);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (livePreviewRef.current) {
        livePreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permite acceso a la camara para grabar video.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No se encontro ninguna camara en este dispositivo.');
      } else {
        setCameraError(`Error al acceder a la camara: ${err.message}`);
      }
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? { mimeType: 'video/webm;codecs=vp9' }
      : MediaRecorder.isTypeSupported('video/webm')
        ? { mimeType: 'video/webm' }
        : {};
    const recorder = new MediaRecorder(streamRef.current, options);
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const mime = options.mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mime });
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      stopCamera();
      showMsg('Video grabado exitosamente!');
    };
    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showMsg('Por favor selecciona un archivo de video', true);
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoBlob(file);
    setVideoUrl(url);
    setActiveFilter('none');
    setPlaybackRate(1);
    setOverlay('');
    showMsg(`Video "${file.name}" cargado`);
  };

  const handleApplyTrim = () => {
    const start = parseFloat(trimStart);
    const end = parseFloat(trimEnd);
    const vid = videoRef.current;
    if (!vid) return;
    if (!isNaN(start) && start >= 0) vid.currentTime = start;
    if (!isNaN(end) && end > 0 && end <= duration) {
      const onTime = () => {
        if (vid.currentTime >= end) {
          vid.pause();
          vid.removeEventListener('timeupdate', onTime);
        }
      };
      vid.addEventListener('timeupdate', onTime);
    }
    vid.play();
    showMsg(`Previsualizando: ${isNaN(start) ? 0 : start}s → ${isNaN(end) ? 'fin' : end + 's'}`);
  };

  const handleExportTrimmed = async () => {
    const vid = videoRef.current;
    if (!vid || !videoBlob) { showMsg('Carga un video primero', true); return; }
    const start = parseFloat(trimStart) || 0;
    const end   = parseFloat(trimEnd) || duration;
    if (start >= end) { showMsg('El inicio debe ser menor que el fin', true); return; }
    if (!window.MediaRecorder) { showMsg('Tu navegador no soporta exportación de video', true); return; }

    showMsg('Exportando video recortado...');

    const canvas = document.createElement('canvas');
    canvas.width  = vid.videoWidth  || 640;
    canvas.height = vid.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const stream   = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks   = [];

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `kronos-trim-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMsg('Video recortado descargado!');
    };

    vid.muted       = true;
    vid.currentTime = start;

    await new Promise(resolve => { vid.onseeked = resolve; });

    recorder.start(100);
    vid.play();

    const drawLoop = () => {
      if (vid.ended || vid.currentTime >= end) {
        vid.pause();
        recorder.stop();
        return;
      }
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawLoop);
    };
    drawLoop();
  };

  const handleDownload = () => {
    if (!videoBlob) {
      showMsg('No hay video para descargar', true);
      return;
    }
    const a = document.createElement('a');
    const ext = videoBlob.type?.includes('mp4') ? 'mp4' : 'webm';
    a.href = videoUrl;
    a.download = `kronos-video-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showMsg('Descargando video...');
  };

  const handleClearVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setActiveFilter('none');
    setPlaybackRate(1);
    setOverlay('');
    setTrimStart('');
    setTrimEnd('');
    setDuration(0);
    setCurrentTime(0);
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#ffffff',
      color: '#fff',
      fontFamily: "'Outfit', sans-serif",
      paddingTop: 72,
      paddingBottom: 80,
    },
    header: {
      padding: '24px 20px 0',
      maxWidth: 700,
      margin: '0 auto',
    },
    title: {
      fontSize: 26,
      fontWeight: 800,
      background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
    },
    content: {
      padding: '20px',
      maxWidth: 700,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: 'rgba(10,10,20,0.5)',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
    bigBtn: (color) => ({
      padding: '18px 28px',
      borderRadius: 16,
      border: 'none',
      cursor: 'pointer',
      background: color === 'red'
        ? 'linear-gradient(135deg,#ef4444,#dc2626)'
        : color === 'purple'
          ? 'linear-gradient(135deg,#7c3aed,#06b6d4)'
          : 'rgba(255,255,255,0.07)',
      color: '#fff',
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      fontSize: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    }),
    btn: (active, variant) => ({
      padding: '8px 14px',
      borderRadius: 8,
      border: variant === 'danger' ? '1px solid rgba(239,68,68,0.3)' : (active ? 'none' : '1px solid rgba(79,172,254,0.2)'),
      cursor: 'pointer',
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
      fontSize: 13,
      background: active
        ? 'linear-gradient(135deg,#7c3aed,#06b6d4)'
        : variant === 'danger'
          ? 'rgba(239,68,68,0.1)'
          : 'rgba(255,255,255,0.05)',
      color: variant === 'danger' ? '#f87171' : '#0a0a14',
    }),
    input: {
      background: 'rgba(79,172,254,0.07)',
      border: '1px solid rgba(79,172,254,0.2)',
      borderRadius: 8,
      padding: '8px 12px',
      color: '#fff',
      fontFamily: "'Outfit', sans-serif",
      fontSize: 14,
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    videoWrapper: {
      position: 'relative',
      width: '100%',
      background: '#000',
      borderRadius: 12,
      overflow: 'hidden',
      minHeight: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    msgBox: (isError) => ({
      position: 'fixed',
      bottom: 90,
      left: '50%',
      transform: 'translateX(-50%)',
      background: isError ? 'rgba(239,68,68,0.95)' : 'rgba(6,182,212,0.95)',
      color: '#fff',
      padding: '10px 22px',
      borderRadius: 10,
      fontWeight: 700,
      fontSize: 14,
      zIndex: 999,
      backdropFilter: 'blur(8px)',
      whiteSpace: 'nowrap',
      maxWidth: '90vw',
    }),
    filterBtn: (active) => ({
      padding: '7px 12px',
      borderRadius: 8,
      border: active ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
      cursor: 'pointer',
      fontFamily: "'Outfit', sans-serif",
      fontSize: 12,
      fontWeight: 600,
      background: active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
      color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)',
    }),
    speedBtn: (active) => ({
      padding: '6px 12px',
      borderRadius: 8,
      border: active ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
      cursor: 'pointer',
      fontFamily: "'Outfit', sans-serif",
      fontSize: 12,
      fontWeight: 700,
      background: active ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)',
      color: active ? '#67e8f9' : 'rgba(255,255,255,0.5)',
    }),
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Empty state — no video loaded
  if (!videoUrl && !isCameraActive) {
    return (
      <div style={styles.page}>
        {msg && <div style={styles.msgBox(msg.isError)}>{msg.text}</div>}
        <div style={styles.header}>
          <h1 style={styles.title}>Editor de Video</h1>
          <p style={{ color: 'rgba(10,10,20,0.5)', fontSize: 14, margin: '6px 0 0' }}>
            Graba o sube un video para comenzar a editar
          </p>
        </div>

        <div style={styles.content}>
          {cameraError && (
            <GlassCard style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ color: '#f87171', fontWeight: 600, fontSize: 14 }}>
                {cameraError}
              </div>
            </GlassCard>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button style={styles.bigBtn('red')} onClick={startCamera}>
              <span style={{ fontSize: 36 }}>📹</span>
              <span>Grabar</span>
              <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>Usar camara</span>
            </button>

            <label style={{ ...styles.bigBtn('purple'), cursor: 'pointer' }}>
              <span style={{ fontSize: 36 }}>📁</span>
              <span>Subir</span>
              <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>Desde dispositivo</span>
              <input
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {msg && <div style={styles.msgBox(msg.isError)}>{msg.text}</div>}

      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={styles.title}>Editor de Video</h1>
          {videoUrl && (
            <button style={styles.btn(false, 'danger')} onClick={handleClearVideo}>
              Nuevo video
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>

        {/* LIVE CAMERA PREVIEW */}
        {isCameraActive && (
          <GlassCard padding={0} style={{ overflow: 'hidden' }}>
            <div style={styles.sectionTitle && { padding: '12px 16px 0', ...styles.sectionTitle }}>
              Camara en vivo
            </div>
            <div style={styles.videoWrapper}>
              <video
                ref={livePreviewRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', maxHeight: 360, objectFit: 'contain' }}
                onLoadedMetadata={e => { e.target.play(); }}
              />
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
              {!isRecording ? (
                <button
                  style={{ ...styles.btn(true, null), background: 'linear-gradient(135deg,#ef4444,#dc2626)', flex: 1 }}
                  onClick={startRecording}
                >
                  🔴 Iniciar Grabacion
                </button>
              ) : (
                <button
                  style={{ ...styles.btn(false, null), flex: 1, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171' }}
                  onClick={stopRecording}
                >
                  ⏹ Detener Grabacion
                </button>
              )}
              <button style={styles.btn(false, 'danger')} onClick={stopCamera}>
                Cancelar
              </button>
            </div>
            {isRecording && (
              <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse 1s ease-in-out infinite',
                }} />
                <span style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>Grabando...</span>
              </div>
            )}
          </GlassCard>
        )}

        {/* VIDEO PLAYER + OVERLAY */}
        {videoUrl && (
          <GlassCard padding={0} style={{ overflow: 'hidden' }}>
            <div style={styles.videoWrapper}>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                style={{ width: '100%', maxHeight: 360, objectFit: 'contain', filter: activeFilter }}
                onLoadedMetadata={e => setDuration(e.target.duration || 0)}
              />
              {overlay && (
                <div style={{
                  position: 'absolute',
                  bottom: 48,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.65)',
                  color: '#0a0a14',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 18,
                  fontWeight: 700,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  backdropFilter: 'blur(4px)',
                }}>
                  {overlay}
                </div>
              )}
            </div>
            {duration > 0 && (
              <div style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(10,10,20,0.5)' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            )}
          </GlassCard>
        )}

        {/* UPLOAD MORE */}
        {videoUrl && !isCameraActive && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={styles.btn(false, null)} onClick={startCamera}>
              📹 Grabar otro
            </button>
            <label style={{ ...styles.btn(false, null), cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
              📁 Subir otro
              <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {/* EDITING TOOLS — only when video loaded */}
        {videoUrl && (
          <>
            {/* FILTERS */}
            <GlassCard>
              <div style={styles.sectionTitle}>Filtros CSS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CSS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    style={styles.filterBtn(activeFilter === f.value)}
                    onClick={() => setActiveFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* SPEED */}
            <GlassCard>
              <div style={styles.sectionTitle}>Velocidad de reproduccion</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0.5, 1, 1.5, 2].map(s => (
                  <button
                    key={s}
                    style={styles.speedBtn(playbackRate === s)}
                    onClick={() => {
                      setPlaybackRate(s);
                      if (videoRef.current) videoRef.current.playbackRate = s;
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* TRIM */}
            <GlassCard>
              <div style={styles.sectionTitle}>Recortar video</div>
              {duration > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.5)', marginBottom: 10 }}>
                  Duracion total: {formatTime(duration)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.5)', marginBottom: 4 }}>
                    Inicio (segundos)
                  </div>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="0"
                    min="0"
                    max={duration || undefined}
                    step="0.1"
                    value={trimStart}
                    onChange={e => setTrimStart(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.5)', marginBottom: 4 }}>
                    Fin (segundos)
                  </div>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder={duration ? duration.toFixed(1) : ''}
                    min="0"
                    max={duration || undefined}
                    step="0.1"
                    value={trimEnd}
                    onChange={e => setTrimEnd(e.target.value)}
                  />
                </div>
                <button
                  style={{ ...styles.btn(true, null), padding: '9px 18px' }}
                  onClick={handleApplyTrim}
                >
                  Previsualizar
                </button>
                <button
                  style={{ ...styles.btn(false, null), padding: '9px 18px', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff' }}
                  onClick={handleExportTrimmed}
                >
                  ✂️ Exportar
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(10,10,20,0.35)', marginTop: 8 }}>
                "Previsualizar" reproduce el segmento. "Exportar" descarga el video recortado (sin audio).
              </div>
            </GlassCard>

            {/* TEXT OVERLAY */}
            <GlassCard>
              <div style={styles.sectionTitle}>Texto superpuesto</div>
              <input
                style={styles.input}
                type="text"
                placeholder="Escribe un texto para superponer al video..."
                value={overlay}
                onChange={e => setOverlay(e.target.value)}
                maxLength={80}
              />
              {overlay && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(10,10,20,0.5)' }}>
                  Texto visible sobre el video en reproduccion
                </div>
              )}
            </GlassCard>

            {/* EXPORT */}
            <GlassCard>
              <div style={styles.sectionTitle}>Exportar</div>
              <div style={{ fontSize: 13, color: 'rgba(10,10,20,0.5)', marginBottom: 14 }}>
                Descarga el video original con los ajustes visuales aplicados en el reproductor.
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                  color: '#fff',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                }}
                onClick={handleDownload}
              >
                💾 Descargar Video
              </button>
            </GlassCard>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
