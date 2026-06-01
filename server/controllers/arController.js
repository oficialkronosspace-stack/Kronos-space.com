const Product = require('../models/Product');

// Sesiones AR en memoria (efímeras)
const arSessions = new Map();
// Map<sessionId, { userId, productId, startedAt, screenshots, endedAt }>

const generateSessionId = () =>
  `ar_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// GET /api/ar/:productId — Configuración AR del producto
exports.getARConfig = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .select('name images category colors sizes price');

    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({
      success: true,
      productId: product._id,
      name: product.name,
      images: product.images,
      category: product.category,
      colors: product.colors || [],
      sizes: product.sizes || [],
      price: product.price,
      arConfig: {
        scale: 1.0,
        rotationY: 0,
        positionOffset: { x: 0, y: 0, z: -1.5 },
        lightingIntensity: 1.0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ar/:productId/start — Iniciar sesión AR
exports.startARSession = async (req, res) => {
  try {
    const { productId } = req.params;
    const { deviceInfo } = req.body;

    const product = await Product.findById(productId).select('name images');
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const sessionId = generateSessionId();
    arSessions.set(sessionId, {
      sessionId,
      userId: req.user.id,
      productId,
      deviceInfo: deviceInfo || {},
      startedAt: new Date(),
      screenshots: [],
      endedAt: null,
    });

    res.status(201).json({
      success: true,
      sessionId,
      productId,
      product: { name: product.name, images: product.images },
      startedAt: arSessions.get(sessionId).startedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ar/:productId/end — Finalizar sesión AR
exports.endARSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' });

    const session = arSessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Sesión AR no encontrada' });
    if (session.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    session.endedAt = new Date();
    const durationSeconds = Math.floor(
      (session.endedAt - session.startedAt) / 1000
    );

    arSessions.delete(sessionId);

    res.json({
      success: true,
      sessionId,
      durationSeconds,
      screenshotCount: session.screenshots.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ar/:productId/screenshot — Guardar screenshot AR
exports.saveScreenshot = async (req, res) => {
  try {
    const { sessionId, imageUrl } = req.body;
    if (!sessionId || !imageUrl) {
      return res.status(400).json({ error: 'sessionId e imageUrl requeridos' });
    }

    const session = arSessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Sesión AR no encontrada' });
    if (session.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    if (session.screenshots.length >= 10) {
      return res.status(400).json({ error: 'Máximo 10 screenshots por sesión' });
    }

    const screenshot = { url: imageUrl, capturedAt: new Date() };
    session.screenshots.push(screenshot);

    res.json({ success: true, screenshot, total: session.screenshots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ar/:productId/feedback — Feedback de la experiencia AR
exports.submitFeedback = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, sessionId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating entre 1 y 5 requerido' });
    }

    // Feedback se registra en log pero no persiste (extensible a BD si se necesita)
    console.log(`AR feedback — product=${productId} user=${req.user.id} rating=${rating}`);

    res.json({
      success: true,
      message: 'Feedback recibido. ¡Gracias!',
      productId,
      rating,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
