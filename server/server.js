require('dotenv').config();
const express = require('express');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');

// Security & performance middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// Conectar a MongoDB (with timeout)
connectDB();

// Inicializar Express
const app = express();
const server = http.createServer(app);

// Render corre detrás de un proxy — necesario para req.ip y rate limiting correctos
app.set('trust proxy', 1);

// Health check ANTES de cualquier middleware (rate limiter, auth, etc.)
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbStatus,
    memory: process.memoryUsage().heapUsed,
    timestamp: new Date().toISOString()
  });
});

// Socket.io con CORS
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean);
      const isVercel = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
      if (allowed.includes(origin) || isVercel) return callback(null, true);
      callback(new Error('Socket CORS: origen no permitido'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ============= SECURITY & PERFORMANCE MIDDLEWARE =============

// HTTP security headers
app.use(helmet());

// Gzip compression for all responses
app.use(compression());

// Request logging
app.use(morgan('combined'));

// General rate limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }
});
app.use(generalLimiter);

// Auth-specific rate limit: solo en login (brute-force protection)
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de login. Espera 15 minutos.' }
});
app.use('/api/auth/login', authLoginLimiter);

// =============================================================

// CORS — producción + desarrollo
const corsOptions = {
  origin: (origin, callback) => {
    // Peticiones sin origin (apps móviles, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const whitelist = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);

    const isVercel = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);

    if (whitelist.includes(origin) || isVercel) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido — ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight para todas las rutas

// ── Stripe webhooks: necesitan el body en raw ANTES de express.json() ──
const subscriptionRoutes = require('./routes/subscription');
app.post(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionRoutes.webhookHandler
);

const eventsRoutes = require('./routes/events');
app.post(
  '/api/events/ticket-webhook',
  express.raw({ type: 'application/json' }),
  eventsRoutes.ticketWebhookHandler
);

app.use(express.json());
app.use(xss());
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true }));

// Passport (Google & Facebook OAuth) — inicializar sin sesiones (usamos JWT)
const passport = require('./config/passport');
app.use(passport.initialize());

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/search', require('./routes/search'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/users', require('./routes/users'));
app.use('/api/multimedia', require('./routes/multimedia'));
app.use('/api/checkout', require('./routes/checkout')); // Stripe payment routes
app.use('/api/cart',     require('./routes/cart'));     // Carrito sincronizado
app.use('/api/tokens', require('./routes/tokens')); // Kronos Token
app.use('/api/stories', require('./routes/stories')); // Stories 24h
app.use('/api/admin', require('./routes/admin')); // Admin Dashboard
app.use('/api/reporting', require('./routes/reporting')); // Report & Block System
app.use('/api/refunds', require('./routes/refunds')); // Refund Management
app.use('/api/twofactor', require('./routes/twofactor')); // 2FA Authentication
app.use('/api/videos', require('./routes/videos')); // Video Upload & Streaming
app.use('/api/recommendations', require('./routes/recommendations')); // Recommendation Engine
app.use('/api/tips', require('./routes/tips')); // Propinas Directas
app.use('/api/ai', require('./routes/ai')); // IA Generativa (OpenAI)
app.use('/api/sessions', require('./routes/sessions')); // Sesiones activas
app.use('/api/analytics', require('./routes/analytics')); // Métricas
app.use('/api/interactions', require('./routes/interactions')); // Interacciones
app.use('/api/wallet', require('./routes/wallet')); // Wallet
app.use('/api/ephemeral-stories', require('./routes/ephemeralStories')); // Instagram-style Stories 24h
app.use('/api/communities', require('./routes/communities')); // Comunidades / Grupos
app.use('/api/listings', require('./routes/listings')); // Marketplace P2P con Escrow
app.use('/api/group-chats', require('./routes/groupChats')); // Chat Grupal
app.use('/api/notifications', require('./routes/notifications')); // Centro de notificaciones
app.use('/api/avatar', require('./routes/avatar')); // Avatar 3D Customizable + Tienda
app.use('/api/subscription', subscriptionRoutes); // Kronos Pro / Suscripciones (Stripe)
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/events',        eventsRoutes);
app.use('/api/audio',         require('./routes/audio'));       // Audio Rooms
app.use('/api/translation',   require('./routes/translation')); // Traducción IA
app.use('/api/ar',            require('./routes/ar'));           // Realidad Aumentada
app.use('/api/gamification',  require('./routes/gamification')); // Reservaciones
app.use('/api/health', require('./routes/health')); // Health & Fitness

// Initialize Socket.io singleton (para que controllers/routes puedan emitir eventos)
const socketService = require('./services/socketService');
socketService.init(io);

// Initialize AI Service
const aiService = require('./services/aiService');
aiService.init();


// ============= SOCKET.IO - CHAT EN TIEMPO REAL =============
const users = {}; // { userId: socketId }
const typingUsers = {}; // { userId: { socketId, username } }

io.on('connection', (socket) => {
  console.log('✓ New user connected:', socket.id);

  // Usuario se conecta
  socket.on('user_online', (userId) => {
    users[userId] = socket.id;
    socket.userId = userId;
    socketService.setUserOnline(userId, socket.id);
    io.emit('user_status', { userId, status: 'online', timestamp: new Date() });
  });

  // Enviar mensaje privado
  socket.on('send_private_message', (data) => {
    const { receiverId, content, senderId, senderUsername, timestamp } = data;

    if (users[receiverId]) {
      io.to(users[receiverId]).emit('receive_private_message', {
        senderId,
        senderUsername,
        content,
        timestamp,
        read: false
      });
    }

    // Guardar en base de datos (ya manejado por la ruta POST)
  });

  // Typing notification
  socket.on('typing', (data) => {
    const { receiverId, userId, username } = data;
    typingUsers[userId] = { socketId: socket.id, username };

    if (users[receiverId]) {
      io.to(users[receiverId]).emit('user_typing', {
        userId,
        username
      });
    }
  });

  socket.on('stop_typing', (data) => {
    const { receiverId, userId } = data;
    delete typingUsers[userId];

    if (users[receiverId]) {
      io.to(users[receiverId]).emit('user_stopped_typing', { userId });
    }
  });

  // ============= SOCKET.IO - FEED EN TIEMPO REAL =============

  // Usuario se suscribe al feed
  socket.on('subscribe_to_feed', (userId) => {
    socket.join(`feed_${userId}`);
  });

  // Nuevo post publicado (emit a seguidores)
  socket.on('post_created', (data) => {
    const { authorId, followersIds } = data;
    followersIds.forEach((followerId) => {
      io.to(`feed_${followerId}`).emit('new_post', data);
    });
  });

  // Nuevo like
  socket.on('post_liked', (data) => {
    const { postId, userId, authorId } = data;
    io.to(`feed_${authorId}`).emit('post_like_notification', {
      postId,
      userId,
      message: 'Someone liked your post'
    });
  });

  // Nuevo comentario
  socket.on('post_commented', (data) => {
    const { postId, authorId, commenterId } = data;
    io.to(`feed_${authorId}`).emit('post_comment_notification', {
      postId,
      commenterId,
      message: 'Someone commented on your post'
    });
  });

  // ============= SOCKET.IO - TRACKING DE ORDENES =============

  // Suscribirse al tracking de una orden
  socket.on('track_order', (orderId) => {
    socket.join(`order_${orderId}`);
  });

  // Actualización de estado de orden
  socket.on('order_status_updated', (data) => {
    const { orderId, status, location, estimatedTime } = data;
    io.to(`order_${orderId}`).emit('order_status_change', {
      orderId,
      status,
      location,
      estimatedTime,
      timestamp: new Date()
    });
  });

  // ============= SOCKET.IO - NOTIFICACIONES =============

  // Notificación de nuevo seguidor
  socket.on('new_follower', (data) => {
    const { userId, followerId, followerUsername } = data;
    if (users[userId]) {
      io.to(users[userId]).emit('follower_notification', {
        followerId,
        followerUsername,
        message: `${followerUsername} started following you`
      });
    }
  });

  // ============= SOCKET.IO - CHAT GRUPAL =============

  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('leave_group', (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  socket.on('send_group_message', (data) => {
    const { groupId, message } = data;
    io.to(`group_${groupId}`).emit('receive_group_message', { groupId, message });
  });

  socket.on('group_typing', (data) => {
    const { groupId, userId, username } = data;
    socket.to(`group_${groupId}`).emit('group_user_typing', { userId, username });
  });

  socket.on('group_stop_typing', (data) => {
    const { groupId, userId } = data;
    socket.to(`group_${groupId}`).emit('group_user_stop_typing', { userId });
  });

  // ============= SOCKET.IO - WEBRTC SEÑALIZACIÓN (VIDEOLLAMADAS) =============

  socket.on('call_offer', ({ targetUserId, offer, callerId, callerName }) => {
    if (users[targetUserId]) {
      io.to(users[targetUserId]).emit('incoming_call', { callerId, callerName, offer });
    }
  });

  socket.on('call_answer', ({ callerId, answer }) => {
    if (users[callerId]) {
      io.to(users[callerId]).emit('call_answered', { answer });
    }
  });

  socket.on('call_ice_candidate', ({ targetUserId, candidate }) => {
    if (users[targetUserId]) {
      io.to(users[targetUserId]).emit('ice_candidate', { candidate });
    }
  });

  socket.on('call_end', ({ targetUserId }) => {
    if (users[targetUserId]) {
      io.to(users[targetUserId]).emit('call_ended');
    }
  });

  socket.on('call_rejected', ({ callerId }) => {
    if (users[callerId]) {
      io.to(users[callerId]).emit('call_rejected');
    }
  });

  // ============= SOCKET.IO - STREAMING EN VIVO =============

  socket.on('start_stream', ({ streamerId, streamerName }) => {
    socket.join(`stream_${streamerId}`);
    socket.streamerId = streamerId;
    io.emit('stream_started', { streamerId, streamerName });
  });

  socket.on('stream_chunk', ({ streamerId, chunk }) => {
    socket.to(`stream_${streamerId}`).emit('stream_chunk', { streamerId, chunk });
  });

  socket.on('watch_stream', ({ streamerId }) => {
    socket.join(`stream_${streamerId}`);
    const count = io.sockets.adapter.rooms.get(`stream_${streamerId}`)?.size || 1;
    io.to(`stream_${streamerId}`).emit('viewer_count', { streamerId, count });
  });

  socket.on('leave_stream', ({ streamerId }) => {
    socket.leave(`stream_${streamerId}`);
    const count = io.sockets.adapter.rooms.get(`stream_${streamerId}`)?.size || 0;
    io.to(`stream_${streamerId}`).emit('viewer_count', { streamerId, count });
  });

  socket.on('stop_stream', ({ streamerId }) => {
    io.to(`stream_${streamerId}`).emit('stream_ended', { streamerId });
    io.emit('stream_stopped', { streamerId });
  });

  socket.on('stream_chat', ({ streamerId, username, message }) => {
    io.to(`stream_${streamerId}`).emit('stream_chat', { username, message, at: new Date() });
  });

  // ============= SOCKET.IO - AUDIO ROOMS =============

  socket.on('join_audio_room', ({ roomId, userId, username, avatar }) => {
    socket.join(`audio_${roomId}`);
    socket.audioRoomId = roomId;
    socket.audioUserId = userId;

    io.to(`audio_${roomId}`).emit('audio_room_user_joined', {
      userId, username, avatar, muted: false, spatialX: 0, spatialY: 0
    });

    // Notificar al que se une quiénes están en la sala
    const room = io.sockets.adapter.rooms.get(`audio_${roomId}`);
    socket.emit('audio_room_state', {
      roomId,
      participantCount: room ? room.size : 1
    });
  });

  socket.on('leave_audio_room', ({ roomId, userId }) => {
    socket.leave(`audio_${roomId}`);
    io.to(`audio_${roomId}`).emit('audio_room_user_left', { userId, roomId });
  });

  socket.on('toggle_audio_mute', ({ roomId, userId, muted }) => {
    io.to(`audio_${roomId}`).emit('audio_room_mute_changed', { userId, muted });
  });

  socket.on('update_spatial_position', ({ roomId, userId, x, y }) => {
    socket.to(`audio_${roomId}`).emit('audio_room_spatial_update', { userId, x, y });
  });

  // Desconexión
  socket.on('disconnect', () => {
    socketService.setUserOffline(socket.id);
    Object.keys(users).forEach((userId) => {
      if (users[userId] === socket.id) {
        delete users[userId];
        io.emit('user_status', { userId, status: 'offline', timestamp: new Date() });
      }
    });

    Object.keys(typingUsers).forEach((userId) => {
      if (typingUsers[userId].socketId === socket.id) {
        delete typingUsers[userId];
      }
    });

    console.log('✗ User disconnected:', socket.id);
  });
});

// Manejo de errores centralizado
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Initialize Kronos Token Scheduler
const { scheduleRewardDistribution } = require('./services/scheduler');
if (process.env.NODE_ENV !== 'test') {
  scheduleRewardDistribution();
}


// Seed Avatar default items
const { seedDefaultItems } = require('./controllers/avatarController');
if (process.env.NODE_ENV !== 'test') {
  seedDefaultItems().catch(err => {
    console.error('Failed to seed avatar items:', err);
  });
}

// Auto-seed demo products if collection is empty
if (process.env.NODE_ENV !== 'test') {
  const mongoose = require('mongoose');
  const seedProducts = async () => {
    await new Promise(resolve => setTimeout(resolve, 3000)); // wait for DB connection
    try {
      const Product = require('./models/Product');
      const User = require('./models/User');
      const bcryptjs = require('bcryptjs');
      const count = await Product.countDocuments();
      if (count > 0) return;

      let seller = await User.findOne({ username: 'kronostienda' });
      if (!seller) {
        const hash = await bcryptjs.hash('kronos123', 10);
        seller = await User.create({
          username: 'kronostienda', email: 'tienda@kronos.app', password: hash,
          firstName: 'Kronos', lastName: 'Tienda', role: 'seller',
          bio: 'Tienda oficial de ropa Kronos',
          avatar: 'https://ui-avatars.com/api/?name=Kronos+Tienda&background=7c3aed&color=fff&size=150',
        });
      }

      await Product.insertMany([
        { seller: seller._id, name: 'Playera Kronos Negra', description: 'Playera premium con logo Kronos bordado, tela 100% algodón.', price: 299, originalPrice: 399, category: 'shirts', images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80'], sizes: [{ size: 'S', stock: 5 }, { size: 'M', stock: 10 }, { size: 'L', stock: 8 }], colors: ['Negro'], rating: 4.8, inStock: true },
        { seller: seller._id, name: 'Sudadera Morada Kronos', description: 'Sudadera con capucha, diseño exclusivo Kronos. Cálida y cómoda.', price: 599, originalPrice: 799, category: 'outerwear', images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80'], sizes: [{ size: 'S', stock: 3 }, { size: 'M', stock: 7 }, { size: 'L', stock: 5 }], colors: ['Morado', 'Negro'], rating: 4.9, inStock: true },
        { seller: seller._id, name: 'Jogger Urbano', description: 'Pantalón jogger estilo streetwear, cintura elástica, bolsillos laterales.', price: 449, category: 'pants', images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80'], sizes: [{ size: 'S', stock: 4 }, { size: 'M', stock: 9 }, { size: 'L', stock: 6 }], colors: ['Gris', 'Negro'], rating: 4.6, inStock: true },
        { seller: seller._id, name: 'Tenis Kronos Run', description: 'Tenis deportivos ligeros con suela antideslizante y plantilla ergonómica.', price: 1299, originalPrice: 1599, category: 'shoes', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'], sizes: [{ size: '26', stock: 5 }, { size: '27', stock: 4 }, { size: '28', stock: 3 }], colors: ['Blanco/Negro', 'Todo negro'], rating: 4.7, inStock: true },
        { seller: seller._id, name: 'Vestido Galaxia', description: 'Vestido corto con estampado galáctico, corte tipo A. Ideal para salir.', price: 699, category: 'dresses', images: ['https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400&q=80'], sizes: [{ size: 'XS', stock: 2 }, { size: 'S', stock: 4 }, { size: 'M', stock: 6 }], colors: ['Azul galaxia', 'Negro'], rating: 4.5, inStock: true },
        { seller: seller._id, name: 'Gorra Snapback Kronos', description: 'Gorra ajustable con parche bordado Kronos, visera plana.', price: 199, category: 'accessories', images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80'], sizes: [{ size: 'Única', stock: 20 }], colors: ['Negro', 'Blanco'], rating: 4.4, inStock: true },
        { seller: seller._id, name: 'Chamarra Bomber', description: 'Chamarra bomber estilo varsity, forro suave, cierre central.', price: 899, originalPrice: 1099, category: 'outerwear', images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80'], sizes: [{ size: 'S', stock: 2 }, { size: 'M', stock: 5 }, { size: 'L', stock: 4 }], colors: ['Negro', 'Verde oliva'], rating: 4.7, inStock: true },
        { seller: seller._id, name: 'Vestido Noche Estrellada', description: 'Vestido largo con destellos, perfecto para eventos nocturnos.', price: 999, category: 'dresses', images: ['https://images.unsplash.com/photo-1566479179817-c0b55c52e1bc?w=400&q=80'], sizes: [{ size: 'XS', stock: 1 }, { size: 'S', stock: 3 }, { size: 'M', stock: 5 }], colors: ['Negro con destellos'], rating: 4.9, inStock: true },
      ]);
      console.log('✓ Demo products seeded (8 items)');
    } catch (err) {
      console.error('Product seed error:', err.message);
    }
  };
  seedProducts();
}

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Puerto ${PORT} ya está en uso. Cierra el proceso anterior y vuelve a intentar.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🚀 Super-App Server Running          ║`);
  console.log(`║  Port: ${PORT}                              ║`);
  console.log(`║  URL: http://localhost:${PORT}              ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

module.exports = { app, server, io };
