const multer = require('multer');
const { Readable } = require('stream');

// multer: memoria para recibir el audio blob
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
exports.uploadMiddleware = upload.single('audio');

// POST /api/audio/transcribe
exports.transcribe = async (req, res) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('PENDIENTE')) {
    return res.status(503).json({ error: 'Servicio de transcripción no disponible. Configura OPENAI_API_KEY.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Archivo de audio requerido (campo: audio)' });
  }

  try {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Whisper requiere un File-like object con nombre y tipo
    const audioFile = new File(
      [req.file.buffer],
      `audio.${req.file.mimetype.includes('webm') ? 'webm' : 'mp4'}`,
      { type: req.file.mimetype || 'audio/webm' }
    );

    const transcription = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'es',
    });

    res.json({ success: true, text: transcription.text });
  } catch (err) {
    console.error('transcribe error:', err.message);
    res.status(500).json({ error: 'Error al transcribir el audio' });
  }
};

// In-memory room state — no DB needed for real-time ephemeral audio
const rooms = new Map();
// rooms: Map<roomId, { participants: Map<userId, ParticipantState>, createdAt }>
// ParticipantState: { userId, username, avatar, muted, spatialX, spatialY, joinedAt }

const getOrCreateRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      participants: new Map(),
      createdAt: new Date(),
    });
  }
  return rooms.get(roomId);
};

// POST /api/audio/sessions/join
exports.joinRoom = (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId requerido' });

  const room = getOrCreateRoom(roomId);
  const userId = req.user.id.toString();

  room.participants.set(userId, {
    userId,
    username: req.user.username,
    avatar: req.user.avatar || null,
    muted: false,
    spatialX: 0,
    spatialY: 0,
    joinedAt: new Date(),
  });

  res.json({
    success: true,
    roomId,
    participantCount: room.participants.size,
    participants: Array.from(room.participants.values()),
  });
};

// POST /api/audio/sessions/leave
exports.leaveRoom = (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId requerido' });

  const room = rooms.get(roomId);
  if (!room) return res.json({ success: true, message: 'Sala no encontrada (ya vacía)' });

  const userId = req.user.id.toString();
  room.participants.delete(userId);

  // Limpiar sala vacía
  if (room.participants.size === 0) rooms.delete(roomId);

  res.json({ success: true, roomId, remaining: room?.participants.size ?? 0 });
};

// POST /api/audio/sessions/mute
exports.toggleMute = (req, res) => {
  const { roomId, muted } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId requerido' });

  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

  const userId = req.user.id.toString();
  const participant = room.participants.get(userId);
  if (!participant) return res.status(404).json({ error: 'No estás en esta sala' });

  participant.muted = typeof muted === 'boolean' ? muted : !participant.muted;

  res.json({ success: true, userId, muted: participant.muted });
};

// POST /api/audio/sessions/spatial
exports.updateSpatial = (req, res) => {
  const { roomId, x, y } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId requerido' });

  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

  const userId = req.user.id.toString();
  const participant = room.participants.get(userId);
  if (!participant) return res.status(404).json({ error: 'No estás en esta sala' });

  participant.spatialX = typeof x === 'number' ? x : participant.spatialX;
  participant.spatialY = typeof y === 'number' ? y : participant.spatialY;

  res.json({ success: true, userId, spatialX: participant.spatialX, spatialY: participant.spatialY });
};

// GET /api/audio/sessions/metrics
exports.getRoomMetrics = (req, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ error: 'roomId requerido' });

  const room = rooms.get(roomId);
  if (!room) {
    return res.json({
      success: true,
      roomId,
      participantCount: 0,
      mutedCount: 0,
      activeCount: 0,
      uptime: 0,
    });
  }

  const participants = Array.from(room.participants.values());
  const mutedCount = participants.filter(p => p.muted).length;

  res.json({
    success: true,
    roomId,
    participantCount: participants.length,
    mutedCount,
    activeCount: participants.length - mutedCount,
    uptime: Math.floor((Date.now() - new Date(room.createdAt).getTime()) / 1000),
    participants,
  });
};
