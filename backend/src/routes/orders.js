import { Router } from 'express';
import axios from 'axios';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import User from '../models/User.js';
import Discount from '../models/Discount.js';
import { encrypt } from '../util/crypto.js';
import Referral from '../models/Referral.js';
import { decrypt } from '../util/crypto.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Address from '../models/Address.js';
import SavedPaymentMethod from '../models/SavedPaymentMethod.js';
import OrderEvent from '../models/OrderEvent.js';
import { addOrderEvent, createNotification } from '../util/commerce.js';

const router = Router();
const stripeSecret = process.env.STRIPE_SECRET || null;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const AI_URL = process.env.AI_URL || 'http://ai:8000';
const BASE_CURRENCY = process.env.BASE_CURRENCY || 'USD';
const TAX_RATE = Number(process.env.TAX_RATE || '0');
const CURRENCY_RATES = { USD: 1, EUR: 0.9, RWF: 1300 };
const CANCELABLE_STATUSES = new Set(['pending', 'paid', 'processing']);
const STATUS_FLOW = {
  pending: ['paid', 'failed', 'canceled', 'processing'],
  paid: ['processing', 'canceled', 'refunded'],
  processing: ['shipped', 'canceled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  returned: ['refunded'],
  failed: [],
  canceled: [],
  refunded: [],
};

function getRate(currency) {
  return CURRENCY_RATES[currency] || 1;
}

function resolveProductPrice(product) {
  if (product.flashEnds && new Date(product.flashEnds) > new Date() && typeof product.flashPrice === 'number') {
    return product.flashPrice;
  }
  return product.price;
}

function normalizeQuantity(quantity) {
  const q = Number(quantity || 1);
  if (!Number.isFinite(q)) return 1;
  return Math.max(1, Math.min(100, Math.floor(q)));
}

async function hydratePricedItems(items) {
  if (!Array.isArray(items)) return [];
  const requested = items
    .filter((it) => it && it.productId)
    .map((it) => ({ productId: String(it.productId), quantity: normalizeQuantity(it.quantity) }));
  if (requested.length === 0) return [];
  const products = await Product.find({ _id: { $in: requested.map((it) => it.productId) } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));
  return requested.map((it) => {
    const product = productMap.get(it.productId);
    if (!product) return null;
    return {
      productId: product._id,
      sellerId: product.sellerId || null,
      title: product.title,
      price: resolveProductPrice(product),
      quantity: it.quantity,
    };
  }).filter(Boolean);
}

function calculateTotals({ items, currency, discountPercent = 0 }) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 0)), 0);
  const discountApplied = Math.min(subtotal * (discountPercent / 100), subtotal);
  const subtotalAfterDiscount = subtotal - discountApplied;
  const tax = subtotalAfterDiscount * TAX_RATE;
  const total = subtotalAfterDiscount + tax;
  const rate = getRate(currency);
  const displayTotal = total * rate;
  return { subtotal, discountApplied, subtotalAfterDiscount, tax, total, displayTotal, rate };
}

async function findActiveDiscountByCode(code) {
  if (!code) return null;
  const d = await Discount.findOne({ code, active: true }).lean();
  if (!d) return null;
  if (d.expiresAt && new Date(d.expiresAt) <= new Date()) return null;
  return d;
}

async function validateAndReserveStock(items) {
  const ids = items.map((it) => String(it.productId));
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const missing = [];
  const insufficient = [];
  for (const item of items) {
    const p = byId.get(String(item.productId));
    if (!p) {
      missing.push(String(item.productId));
      continue;
    }
    if (Number(p.stock || 0) < Number(item.quantity || 0)) {
      insufficient.push({
        productId: p._id,
        title: p.title,
        requested: Number(item.quantity || 0),
        available: Number(p.stock || 0),
      });
    }
  }
  if (missing.length || insufficient.length) {
    return { ok: false, missing, insufficient };
  }
  await Promise.all(items.map((item) => Product.updateOne(
    { _id: item.productId },
    { $inc: { stock: -Number(item.quantity || 0) } }
  )));
  return { ok: true };
}

async function restoreStock(items) {
  await Promise.all((items || []).map((item) => Product.updateOne(
    { _id: item.productId },
    { $inc: { stock: Number(item.quantity || 0) } }
  )));
}

function canSellerTouchOrder(order, sellerId) {
  return (order.items || []).some((it) => String(it.sellerId || '') === String(sellerId));
}

function canTransition(current, next) {
  return (STATUS_FLOW[current] || []).includes(next);
}

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
  let reservedItems = null;
  try {
    const {
      items,
      discountCode,
      referralCode,
      currency = BASE_CURRENCY,
      shippingAddressId,
      paymentMethodId,
    } = req.body;
    const pricedItems = await hydratePricedItems(items);
    if (pricedItems.length === 0) {
      return res.status(400).json({ error: 'No valid items to checkout' });
    }
    if (shippingAddressId) {
      const addr = await Address.findOne({ _id: shippingAddressId, userId: req.user.id }).lean();
      if (!addr) return res.status(400).json({ error: 'Invalid shipping address' });
    }
    if (paymentMethodId) {
      const pm = await SavedPaymentMethod.findOne({ _id: paymentMethodId, userId: req.user.id }).lean();
      if (!pm) return res.status(400).json({ error: 'Invalid payment method' });
    }
    const discount = await findActiveDiscountByCode(discountCode);
    const totals = calculateTotals({ items: pricedItems, currency, discountPercent: discount?.percent || 0 });

    // Call AI fraud service (best-effort)
    let fraud = { score: 0, flagged: false };
    try {
      const { data } = await axios.post(`${AI_URL}/fraud`, {
        order_total: totals.total,
        items_count: pricedItems.length,
        user_age_days: 999
      }, { timeout: 1500 });
      fraud = data;
    } catch {}

    if (fraud.flagged) {
      return res.status(400).json({ error: 'Order flagged by fraud detection', fraud });
    }

    const stock = await validateAndReserveStock(pricedItems);
    if (!stock.ok) {
      return res.status(400).json({ error: 'Stock unavailable', details: { missing: stock.missing, insufficient: stock.insufficient } });
    }
    reservedItems = pricedItems;

    const order = await Order.create({
      userId: req.user.id,
      items: pricedItems,
      total: totals.displayTotal,
      status: 'pending',
    });
    await addOrderEvent({
      orderId: order._id,
      byUserId: req.user.id,
      type: 'order_created',
      note: 'Order was created during checkout',
      meta: { shippingAddressId: shippingAddressId || null, paymentMethodId: paymentMethodId || null },
    }).catch(() => {});

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totals.total * 100),
        currency: 'usd',
        metadata: { orderId: String(order._id) }
      });
      order.paymentIntentId = paymentIntent.id;
      order.status = 'processing';
      await order.save();
      await addOrderEvent({
        orderId: order._id,
        byUserId: req.user.id,
        type: 'payment_intent_created',
        note: 'Stripe payment intent created',
        meta: { paymentIntentId: paymentIntent.id },
      }).catch(() => {});
      await createNotification({
        userId: req.user.id,
        type: 'order',
        title: 'Order Placed',
        message: `Order ${order._id} is awaiting payment confirmation.`,
        data: { orderId: order._id, status: order.status },
      }).catch(() => {});
      return res.json({
        clientSecret: paymentIntent.client_secret,
        orderId: order._id,
        currency,
        discountCode: discount?.code || null,
        tax: totals.tax,
        discountApplied: totals.discountApplied,
        total: totals.displayTotal
      });
    } else {
      // Simulate payment success in dev without Stripe
      order.status = 'paid';
      await order.save();
      await addOrderEvent({
        orderId: order._id,
        byUserId: req.user.id,
        type: 'payment_simulated',
        note: 'Payment simulated successfully',
      }).catch(() => {});
      // Award loyalty points (1 point per $1)
      try {
        const user = await User.findById(req.user.id);
        user.loyaltyPoints = (user.loyaltyPoints || 0) + Math.floor(totals.displayTotal);
        await user.save();
        if (referralCode) {
          const ref = await Referral.findOne({ code: referralCode });
          if (ref) { ref.uses += 1; await ref.save(); }
        }
        // Create encrypted invoice payload
        const payload = encrypt(JSON.stringify({
          items: pricedItems,
          currency,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discountApplied: totals.discountApplied,
          total: totals.displayTotal
        }));
        await Invoice.create({
          orderId: order._id,
          currency,
          total: totals.displayTotal,
          tax: totals.tax,
          discountApplied: totals.discountApplied,
          payload
        });
        await createNotification({
          userId: req.user.id,
          type: 'order',
          title: 'Order Confirmed',
          message: `Order ${order._id} is confirmed and paid.`,
          data: { orderId: order._id, status: order.status },
        }).catch(() => {});
        return res.json({
          simulated: true,
          orderId: order._id,
          loyaltyPoints: user.loyaltyPoints,
          currency,
          discountCode: discount?.code || null,
          tax: totals.tax,
          discountApplied: totals.discountApplied,
          total: totals.displayTotal
        });
      } catch {
        return res.json({ simulated: true, orderId: order._id });
      }
    }
  } catch (e) {
    if (reservedItems) {
      await restoreStock(reservedItems).catch(() => {});
    }
    return res.status(500).json({ error: 'Checkout failed' });
  }
});

/**
 * @openapi
 * /orders/optimize:
 *   post:
 *     summary: Optimize checkout savings by simulating active discounts
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/optimize', authRequired, async (req, res) => {
  try {
    const { items, currency = BASE_CURRENCY, discountCode } = req.body;
    const pricedItems = await hydratePricedItems(items);
    if (pricedItems.length === 0) {
      return res.status(400).json({ error: 'No valid items to optimize' });
    }

    const now = new Date();
    const discounts = await Discount.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }).lean();
    const unique = new Map();
    unique.set('NO_CODE', { code: null, percent: 0 });
    for (const d of discounts) unique.set(d.code, { code: d.code, percent: d.percent });
    const requested = discountCode && !unique.has(discountCode)
      ? await findActiveDiscountByCode(discountCode)
      : null;
    if (requested) unique.set(requested.code, { code: requested.code, percent: requested.percent });

    const scenarios = [...unique.values()].map((d) => {
      const totals = calculateTotals({
        items: pricedItems,
        currency,
        discountPercent: d.percent || 0
      });
      return {
        code: d.code,
        percent: d.percent || 0,
        subtotal: totals.subtotal,
        discountApplied: totals.discountApplied,
        tax: totals.tax,
        total: totals.displayTotal
      };
    }).sort((a, b) => a.total - b.total);

    const best = scenarios[0];
    const baseline = scenarios.find((s) => !s.code) || best;
    const requestedScenario = discountCode ? scenarios.find((s) => s.code === discountCode) || null : null;

    res.json({
      currency,
      best,
      baseline,
      requested: requestedScenario,
      potentialSavings: Math.max(0, baseline.total - best.total),
      topScenarios: scenarios.slice(0, 5),
    });
  } catch {
    res.status(500).json({ error: 'Failed to optimize checkout' });
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

/**
 * @openapi
 * /orders/queue:
 *   get:
 *     summary: Seller/admin order queue view
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/queue', authRequired, requireRole('seller', 'admin'), async (req, res) => {
  const status = req.query.status ? { status: req.query.status } : {};
  const items = await Order.find(status).sort({ createdAt: -1 }).limit(100).lean();
  if (req.user.role === 'admin') return res.json(items);
  const filtered = items.filter((o) => canSellerTouchOrder(o, req.user.id));
  res.json(filtered);
});

/**
 * @openapi
 * /orders/{id}/timeline:
 *   get:
 *     summary: Get order timeline events
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/:id/timeline', authRequired, async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) return res.status(404).json({ error: 'Not found' });
  const isOwner = String(order.userId) === String(req.user.id);
  const isAdmin = req.user.role === 'admin';
  const isSeller = canSellerTouchOrder(order, req.user.id);
  if (!isOwner && !isAdmin && !isSeller) return res.status(403).json({ error: 'Forbidden' });
  const events = await OrderEvent.find({ orderId: order._id }).sort({ createdAt: 1 }).lean();
  res.json({ orderId: order._id, status: order.status, events });
});

/**
 * @openapi
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order and restock items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/cancel', authRequired, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const isOwner = String(order.userId) === String(req.user.id);
  const isAdmin = req.user.role === 'admin';
  const isSeller = canSellerTouchOrder(order, req.user.id);
  if (!isOwner && !isAdmin && !isSeller) return res.status(403).json({ error: 'Forbidden' });
  if (!CANCELABLE_STATUSES.has(order.status)) {
    return res.status(400).json({ error: `Order cannot be canceled from status ${order.status}` });
  }
  const reason = String(req.body?.reason || 'Canceled by user').slice(0, 300);
  await restoreStock(order.items);
  order.status = 'canceled';
  order.cancellationReason = reason;
  await order.save();
  await addOrderEvent({
    orderId: order._id,
    byUserId: req.user.id,
    type: 'order_canceled',
    note: reason,
  }).catch(() => {});
  await createNotification({
    userId: order.userId,
    type: 'order',
    title: 'Order Canceled',
    message: `Order ${order._id} was canceled.`,
    data: { orderId: order._id, status: order.status },
  }).catch(() => {});
  res.json(order);
});

/**
 * @openapi
 * /orders/{id}/status:
 *   post:
 *     summary: Update order status (seller/admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/status', authRequired, requireRole('seller', 'admin'), async (req, res) => {
  const { status, trackingNumber, note = '', force = false } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'seller' && !canSellerTouchOrder(order, req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const next = String(status || '').trim();
  if (!next) return res.status(400).json({ error: 'Status required' });
  if (!canTransition(order.status, next) && !(req.user.role === 'admin' && force === true)) {
    return res.status(400).json({ error: `Invalid transition from ${order.status} to ${next}` });
  }
  const previous = order.status;
  if ((next === 'failed' || next === 'canceled') && CANCELABLE_STATUSES.has(previous)) {
    await restoreStock(order.items);
  }
  order.status = next;
  if (trackingNumber) order.trackingNumber = String(trackingNumber).slice(0, 120);
  if (next === 'delivered') order.deliveredAt = new Date();
  await order.save();
  await addOrderEvent({
    orderId: order._id,
    byUserId: req.user.id,
    type: `status_${next}`,
    note: String(note || '').slice(0, 300),
    meta: { previousStatus: previous, trackingNumber: order.trackingNumber || null },
  }).catch(() => {});
  await createNotification({
    userId: order.userId,
    type: 'order',
    title: 'Order Status Updated',
    message: `Order ${order._id} moved from ${previous} to ${next}.`,
    data: { orderId: order._id, status: next, previousStatus: previous, trackingNumber: order.trackingNumber || null },
  }).catch(() => {});
  res.json(order);
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
