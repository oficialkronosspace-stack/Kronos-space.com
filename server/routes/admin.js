const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');

// auth.js exporta { protect, checkRole } — usamos protect como middleware
let auth;
try { auth = require('../middleware/auth').protect; }
catch { auth = (req, res, next) => next(); } // fallback dev

const adminController = require('../controllers/adminController');

// Dashboard / stats
router.get('/stats', auth, requireAdmin, adminController.getStats || ((req, res) => res.json({ todo: 'implementar getStats' })));

// Users
router.get('/users', auth, requireAdmin, adminController.listUsers || ((req, res) => res.json({ todo: 'listUsers' })));
router.patch('/users/:id/ban', auth, requireAdmin, adminController.banUser || ((req, res) => res.json({ todo: 'banUser' })));
router.patch('/users/:id/unban', auth, requireAdmin, adminController.unbanUser || ((req, res) => res.json({ todo: 'unbanUser' })));
router.delete('/users/:id', auth, requireAdmin, adminController.deleteUser || ((req, res) => res.json({ todo: 'deleteUser' })));

// Content moderation
router.get('/posts', auth, requireAdmin, adminController.listPosts || ((req, res) => res.json({ todo: 'listPosts' })));
router.delete('/posts/:id', auth, requireAdmin, adminController.deletePost || ((req, res) => res.json({ todo: 'deletePost' })));

// Reports
router.get('/reports', auth, requireAdmin, adminController.listReports || ((req, res) => res.json({ todo: 'listReports' })));
router.patch('/reports/:id/resolve', auth, requireAdmin, adminController.resolveReport || ((req, res) => res.json({ todo: 'resolveReport' })));

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

module.exports = router;
