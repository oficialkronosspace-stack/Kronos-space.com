const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');

// auth.js exporta { protect, checkRole } — usamos protect como middleware
let auth;
try { auth = require('../middleware/auth').protect; }
catch { auth = (req, res, next) => next(); } // fallback dev

const adminController = require('../controllers/adminController');

// Dashboard / stats
router.get('/stats', auth, requireAdmin, adminController.getStats);

// Users
router.get('/users',               auth, requireAdmin, adminController.listUsers);
router.patch('/users/:id/ban',     auth, requireAdmin, adminController.banUser);
router.patch('/users/:id/unban',   auth, requireAdmin, adminController.unbanUser);
router.delete('/users/:id',        auth, requireAdmin, adminController.deleteUser);

// Content moderation
router.get('/posts',         auth, requireAdmin, adminController.listPosts);
router.delete('/posts/:id',  auth, requireAdmin, adminController.deletePost);

// Reports
router.get('/reports',               auth, requireAdmin, adminController.listReports);
router.patch('/reports/:id/resolve', auth, requireAdmin, adminController.resolveReport);

// Subscriptions
router.get('/subscriptions', auth, requireAdmin, adminController.listSubscriptions);

// Push subscription endpoint (cualquier usuario autenticado)
router.post('/push/subscribe', auth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No auth' });
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id || req.user.id, { pushSubscription: req.body });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/push/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
});

// Seed de datos demo (solo en producción, protegido con clave de entorno)
router.post('/seed', async (req, res) => {
  const key = req.headers['x-seed-key'] || req.body?.key;
  if (key !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    const bcryptjs = require('bcryptjs');
    const User = require('../models/User');
    const Product = require('../models/Product');
    const MenuItem = require('../models/MenuItem');
    const Post = require('../models/Post');

    const results = { created: [], skipped: [] };

    // ── Vendedor / tienda de ropa ──
    let seller = await User.findOne({ username: 'kronostienda' });
    if (!seller) {
      const hash = await bcryptjs.hash('kronos123', 10);
      seller = await User.create({ username: 'kronostienda', email: 'tienda@kronos.app', password: hash, firstName: 'Kronos', lastName: 'Tienda', role: 'seller', bio: 'Tienda oficial de ropa Kronos', avatar: 'https://ui-avatars.com/api/?name=Kronos+Tienda&background=7c3aed&color=fff&size=150' });
      results.created.push('seller:kronostienda');
    } else { results.skipped.push('seller:kronostienda'); }

    if ((await Product.countDocuments({ seller: seller._id })) === 0) {
      await Product.insertMany([
        { seller: seller._id, name: 'Playera Kronos Negra', description: 'Playera premium con logo Kronos bordado.', price: 299, originalPrice: 399, category: 'shirts', images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80'], sizes: [{ size: 'S', stock: 5 }, { size: 'M', stock: 10 }, { size: 'L', stock: 8 }], colors: ['Negro'], rating: 4.8, inStock: true },
        { seller: seller._id, name: 'Sudadera Morada Kronos', description: 'Sudadera con capucha, diseño exclusivo Kronos.', price: 599, originalPrice: 799, category: 'outerwear', images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80'], sizes: [{ size: 'S', stock: 3 }, { size: 'M', stock: 7 }, { size: 'L', stock: 5 }], colors: ['Morado', 'Negro'], rating: 4.9, inStock: true },
        { seller: seller._id, name: 'Jogger Urbano', description: 'Pantalón jogger estilo streetwear.', price: 449, category: 'pants', images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80'], sizes: [{ size: 'M', stock: 9 }, { size: 'L', stock: 6 }], colors: ['Gris', 'Negro'], rating: 4.6, inStock: true },
        { seller: seller._id, name: 'Tenis Kronos Run', description: 'Tenis deportivos con suela antideslizante.', price: 1299, originalPrice: 1599, category: 'shoes', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'], sizes: [{ size: '26', stock: 5 }, { size: '27', stock: 4 }], colors: ['Blanco/Negro'], rating: 4.7, inStock: true },
        { seller: seller._id, name: 'Vestido Galaxia', description: 'Vestido corto con estampado galáctico.', price: 699, category: 'dresses', images: ['https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400&q=80'], sizes: [{ size: 'S', stock: 4 }, { size: 'M', stock: 6 }], colors: ['Azul galaxia'], rating: 4.5, inStock: true },
      ]);
      results.created.push('5 productos');
    } else { results.skipped.push('productos'); }

    // ── Restaurantes ──
    const rests = [
      { username: 'tacoselgrito', email: 'tacos@kronos.app', firstName: 'Tacos', lastName: 'El Grito', bio: 'Los mejores tacos 🌮', avatar: 'https://images.unsplash.com/photo-1565299715199-866c917206bb?w=150&q=80', items: [{ name: 'Taco de Pastor', description: 'Carne marinada, piña, cilantro', price: 22, category: 'Tacos', preparationTime: 10 }, { name: 'Taco de Suadero', description: 'Carne de res suave', price: 25, category: 'Tacos', preparationTime: 10 }, { name: 'Quesadillas', description: '2 quesadillas con queso', price: 85, category: 'Quesadillas', preparationTime: 15 }, { name: 'Refresco', description: 'Refresco 355ml', price: 20, category: 'Bebidas', preparationTime: 2 }] },
      { username: 'pizzastellas', email: 'pizza@kronos.app', firstName: 'Pizzas', lastName: 'Stellas', bio: 'Pizza artesanal al horno de piedra 🍕', avatar: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&q=80', items: [{ name: 'Pizza Margarita', description: 'Salsa de tomate, mozzarella, albahaca', price: 149, category: 'Pizzas', preparationTime: 25 }, { name: 'Pizza BBQ Pollo', description: 'Salsa BBQ, pollo, cebolla morada', price: 179, category: 'Pizzas', preparationTime: 25 }, { name: 'Alitas BBQ x6', description: '6 alitas con salsa BBQ', price: 99, category: 'Entradas', preparationTime: 20 }, { name: 'Limonada', description: 'Limonada natural 500ml', price: 35, category: 'Bebidas', preparationTime: 3 }] },
      { username: 'sushikyoto', email: 'sushi@kronos.app', firstName: 'Sushi', lastName: 'Kyoto', bio: 'Sushi fresco y rolls creativos 🍱', avatar: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&q=80', items: [{ name: 'Roll California', description: '8 piezas: cangrejo, aguacate, pepino', price: 129, category: 'Rolls', preparationTime: 20 }, { name: 'Roll Spicy Tuna', description: '8 piezas: atún picante, sriracha', price: 149, category: 'Rolls', preparationTime: 20 }, { name: 'Sashimi Salmón x5', description: '5 piezas de salmón fresco', price: 139, category: 'Sashimi', preparationTime: 15 }, { name: 'Edamame', description: 'Vainas de soya al vapor', price: 55, category: 'Entradas', preparationTime: 10 }] },
    ];

    for (const r of rests) {
      let rest = await User.findOne({ username: r.username });
      if (!rest) {
        const hash = await bcryptjs.hash('kronos123', 10);
        rest = await User.create({ username: r.username, email: r.email, password: hash, firstName: r.firstName, lastName: r.lastName, bio: r.bio, avatar: r.avatar, role: 'seller' });
        results.created.push(`restaurante:${r.username}`);
      } else { results.skipped.push(`restaurante:${r.username}`); }
      if ((await MenuItem.countDocuments({ restaurant: rest._id })) === 0) {
        await MenuItem.insertMany(r.items.map(item => ({ ...item, restaurant: rest._id })));
        results.created.push(`menu:${r.username}`);
      }
    }

    // ── Post de bienvenida ──
    if ((await Post.countDocuments()) === 0) {
      const kronosUser = await User.findOne({ username: 'kronostienda' });
      if (kronosUser) {
        await Post.create({ author: kronosUser._id, content: '¡Bienvenido a Kronos! 🚀 Socializa, compra ropa, pide comida y más. ¡Empieza explorando!', visibility: 'public' });
        results.created.push('post:bienvenida');
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
