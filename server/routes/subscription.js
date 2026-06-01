const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { stripe } = require('../config/stripe');
const subscriptionService = require('../services/subscriptionService');

/**
 * POST /api/subscription/checkout
 * Crea sesión de Stripe Checkout para suscribir al usuario a Pro o Business.
 * Body: { tier: 'pro' | 'business' }
 */
router.post('/checkout', protect, async (req, res) => {
  try {
    const { tier } = req.body;
    if (!['plus', 'pro', 'business'].includes(tier)) {
      return res.status(400).json({ error: 'Tier inválido. Usa "plus", "pro" o "business".' });
    }

    const { url, sessionId } = await subscriptionService.createCheckoutSession(
      req.user._id,
      tier
    );

    return res.json({ success: true, url, sessionId });
  } catch (err) {
    console.error('subscription/checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/subscription/status
 * Devuelve tier, features y datos de la suscripción actual.
 */
router.get('/status', protect, async (req, res) => {
  try {
    const data = await subscriptionService.getSubscription(req.user._id);
    return res.json({ success: true, ...data });
  } catch (err) {
    console.error('subscription/status error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancela al final del periodo actual.
 */
router.post('/cancel', protect, async (req, res) => {
  try {
    const sub = await subscriptionService.cancelSubscription(req.user._id);
    return res.json({ success: true, subscription: sub });
  } catch (err) {
    console.error('subscription/cancel error:', err);
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/subscription/reactivate
 * Reactiva una suscripción que estaba marcada para cancelar.
 */
router.post('/reactivate', protect, async (req, res) => {
  try {
    const sub = await subscriptionService.reactivateSubscription(req.user._id);
    return res.json({ success: true, subscription: sub });
  } catch (err) {
    console.error('subscription/reactivate error:', err);
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Handler del webhook de Stripe.
 * IMPORTANTE: este handler espera req.body como Buffer (raw),
 * por eso se monta directamente en server.js con express.raw()
 * ANTES del middleware global express.json().
 */
const webhookHandler = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('subscription webhook: STRIPE_WEBHOOK_SECRET no configurado');
    return res.status(500).json({ error: 'Webhook secret missing' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error('subscription webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook signature: ${err.message}` });
  }

  try {
    await subscriptionService.handleSubscriptionWebhook(event);
    return res.json({ received: true, type: event.type });
  } catch (err) {
    console.error('subscription webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = router;
module.exports.webhookHandler = webhookHandler;
