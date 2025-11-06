import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { addOrderEvent, createNotification } from '../util/commerce.js';

const router = Router();
router.use(authRequired);

function sellerOwnsOrder(order, sellerId) {
  return (order.items || []).some((it) => String(it.sellerId || '') === String(sellerId));
}

/**
 * @openapi
 * /returns:
 *   post:
 *     summary: Create a return request
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Created }
 */
router.post('/', async (req, res) => {
  const { orderId, items } = req.body;
  const order = await Order.findById(orderId).lean();
  if (!order || String(order.userId) !== String(req.user.id)) return res.status(404).json({ error: 'Order not found' });
  if (!['paid', 'delivered'].includes(order.status)) return res.status(400).json({ error: 'Order is not returnable yet' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Return items required' });

  const normalized = items.map((it) => ({
    productId: it.productId,
    quantity: Math.max(1, Number(it.quantity || 1)),
    reason: String(it.reason || '').slice(0, 300),
  }));

  const doc = await ReturnRequest.create({ orderId, userId: req.user.id, items: normalized });
  await addOrderEvent({
    orderId: order._id,
    byUserId: req.user.id,
    type: 'return_requested',
    note: `Return request ${doc._id} created`,
    meta: { returnRequestId: doc._id },
  }).catch(() => {});
  await createNotification({
    userId: req.user.id,
    type: 'return',
    title: 'Return Requested',
    message: `Your return request for order ${order._id} was submitted.`,
    data: { orderId: order._id, returnRequestId: doc._id },
  }).catch(() => {});
  res.status(201).json(doc);
});

/**
 * @openapi
 * /returns/mine:
 *   get:
 *     summary: List current user's return requests
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/mine', async (req, res) => {
  const items = await ReturnRequest.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json(items);
});

/**
 * @openapi
 * /returns:
 *   get:
 *     summary: List return requests for seller/admin queue
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', requireRole('seller', 'admin'), async (req, res) => {
  const status = req.query.status ? { status: req.query.status } : {};
  const items = await ReturnRequest.find(status).sort({ createdAt: -1 }).limit(100).lean();
  if (req.user.role === 'admin') return res.json(items);

  const orderIds = [...new Set(items.map((x) => String(x.orderId)))];
  const orders = await Order.find({ _id: { $in: orderIds } }).lean();
  const orderMap = new Map(orders.map((o) => [String(o._id), o]));
  const filtered = items.filter((x) => sellerOwnsOrder(orderMap.get(String(x.orderId)) || {}, req.user.id));
  res.json(filtered);
});

/**
 * @openapi
 * /returns/{id}/status:
 *   post:
 *     summary: Update return request status (seller/admin)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/status', requireRole('seller', 'admin'), async (req, res) => {
  const { status, resolutionNote = '' } = req.body;
  if (!['approved', 'rejected', 'received', 'refunded'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const doc = await ReturnRequest.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const order = await Order.findById(doc.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.user.role === 'seller' && !sellerOwnsOrder(order, req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  doc.status = status;
  doc.resolutionNote = String(resolutionNote || '').slice(0, 400);
  await doc.save();

  if (status === 'refunded') {
    order.status = 'refunded';
    await order.save();
    for (const item of doc.items || []) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: Number(item.quantity || 1) } }
      );
    }
  }

  await addOrderEvent({
    orderId: order._id,
    byUserId: req.user.id,
    type: `return_${status}`,
    note: `Return ${doc._id} moved to ${status}`,
    meta: { returnRequestId: doc._id },
  }).catch(() => {});
  await createNotification({
    userId: doc.userId,
    type: 'return',
    title: 'Return Status Updated',
    message: `Your return request for order ${order._id} is now ${status}.`,
    data: { orderId: order._id, returnRequestId: doc._id, status },
  }).catch(() => {});

  res.json(doc);
});

export default router;
