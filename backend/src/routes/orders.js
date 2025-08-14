import { Router } from 'express';
import axios from 'axios';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/auth.js';
import User from '../models/User.js';
import Discount from '../models/Discount.js';
import { encrypt } from '../util/crypto.js';
import Referral from '../models/Referral.js';
import { decrypt } from '../util/crypto.js';
import Invoice from '../models/Invoice.js';

const router = Router();
const stripeSecret = process.env.STRIPE_SECRET || null;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const AI_URL = process.env.AI_URL || 'http://ai:8000';

/**
 * @openapi
 * /orders/checkout:
 *   post:
 *     summary: Checkout and create an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     title: { type: string }
 *                     price: { type: number }
 *                     quantity: { type: number }
 *               discountCode: { type: string }
 *               referralCode: { type: string }
 *               currency: { type: string, example: USD }
 *           examples:
 *             basic:
 *               summary: Simple USD checkout
 *               value:
 *                 items:
 *                   - { productId: "664e1b...", title: "USB-C Cable", price: 9.99, quantity: 2 }
 *                   - { productId: "664e1c...", title: "Wall Charger", price: 19.99, quantity: 1 }
 *                 currency: USD
 *             withDiscountReferral:
 *               summary: Checkout with discount and referral
 *               value:
 *                 items:
 *                   - { productId: "664e1d...", title: "Headphones", price: 49.99, quantity: 1 }
 *                 discountCode: SAVE10
 *                 referralCode: ab12cd34
 *                 currency: EUR
 *     responses:
 *       200: { description: OK }
 *       400: { description: Flagged or validation error }
 *       500: { description: Failure }
 */
router.post('/checkout', authRequired, async (req, res) => {
  try {
    const { items, discountCode, referralCode, currency = process.env.BASE_CURRENCY || 'USD' } = req.body; // [{productId, title, price, quantity}]
    let subtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    // Apply discount
    let discountApplied = 0;
    if (discountCode) {
      const d = await Discount.findOne({ code: discountCode, active: true });
      const notExpired = d && (!d.expiresAt || d.expiresAt > new Date());
      if (notExpired) {
        discountApplied = Math.min(subtotal * (d.percent / 100), subtotal);
        subtotal -= discountApplied;
      }
    }
    // Tax
    const taxRate = Number(process.env.TAX_RATE || '0');
    const tax = subtotal * taxRate;
    let total = subtotal + tax;
    // Currency conversion (very naive placeholder)
    const rates = { USD: 1, EUR: 0.9, RWF: 1300 };
    const rate = rates[currency] || 1;
    const displayTotal = total * rate;

    // Call AI fraud service (best-effort)
    let fraud = { score: 0, flagged: false };
    try {
      const { data } = await axios.post(`${AI_URL}/fraud`, {
        order_total: total,
        items_count: items.length,
        user_age_days: 999
      }, { timeout: 1500 });
      fraud = data;
    } catch {}

    if (fraud.flagged) {
      return res.status(400).json({ error: 'Order flagged by fraud detection', fraud });
    }

    const order = await Order.create({ userId: req.user.id, items, total: displayTotal, status: 'pending' });

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'usd',
        metadata: { orderId: String(order._id) }
      });
      order.paymentIntentId = paymentIntent.id;
      await order.save();
      return res.json({ clientSecret: paymentIntent.client_secret, orderId: order._id, currency, tax, discountApplied, total: displayTotal });
    } else {
      // Simulate payment success in dev without Stripe
      order.status = 'paid';
      await order.save();
      // Award loyalty points (1 point per $1)
      try {
        const user = await User.findById(req.user.id);
        user.loyaltyPoints = (user.loyaltyPoints || 0) + Math.floor(displayTotal);
        await user.save();
        if (referralCode) {
          const ref = await Referral.findOne({ code: referralCode });
          if (ref) { ref.uses += 1; await ref.save(); }
        }
        // Create encrypted invoice payload
        const payload = encrypt(JSON.stringify({ items, currency, subtotal, tax, discountApplied, total: displayTotal }));
        await Invoice.create({ orderId: order._id, currency, total: displayTotal, tax, discountApplied, payload });
        return res.json({ simulated: true, orderId: order._id, loyaltyPoints: user.loyaltyPoints, currency, tax, discountApplied, total: displayTotal });
      } catch {
        return res.json({ simulated: true, orderId: order._id });
      }
    }
  } catch (e) {
    return res.status(500).json({ error: 'Checkout failed' });
  }
});

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: List current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', authRequired, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
  res.json(orders);
});

// Download decrypted invoice JSON (owner only)
/**
 * @openapi
 * /orders/{id}/invoice:
 *   get:
 *     summary: Download decrypted invoice JSON for an order (owner only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get('/:id/invoice', authRequired, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || String(order.userId) !== String(req.user.id)) return res.status(404).json({ error: 'Not found' });
  const inv = await Invoice.findOne({ orderId: order._id });
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  let payload = inv.payload?.data || null;
  try {
    if (inv.payload?.iv) {
      payload = decrypt(inv.payload);
    } else if (payload) {
      payload = Buffer.from(payload, 'base64').toString('utf8');
    }
    const obj = typeof payload === 'string' ? JSON.parse(payload) : payload;
    res.setHeader('Content-Type','application/json');
    return res.send(JSON.stringify(obj));
  } catch {
    return res.status(500).json({ error: 'Failed to decrypt invoice' });
  }
});

export default router;
