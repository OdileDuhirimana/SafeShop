import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import PriceAlert from '../models/PriceAlert.js';
import Product from '../models/Product.js';
import { createNotification } from '../util/commerce.js';

const router = Router();

router.use(authRequired);

function toProductMap(products) {
  return new Map(products.map((p) => [String(p._id), p]));
}

/**
 * @openapi
 * /alerts:
 *   get:
 *     summary: List current user's price alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res) => {
  const alerts = await PriceAlert.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200).lean();
  const productIds = alerts.map((a) => a.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = toProductMap(products);
  const items = alerts.map((a) => {
    const product = productMap.get(String(a.productId));
    const currentPrice = product?.flashEnds && new Date(product.flashEnds) > new Date() && typeof product.flashPrice === 'number'
      ? product.flashPrice
      : product?.price;
    return {
      ...a,
      currentPrice,
      triggered: typeof currentPrice === 'number' ? currentPrice <= a.targetPrice : false,
      product: product ? {
        _id: product._id,
        title: product.title,
        price: product.price,
        flashPrice: product.flashPrice,
        flashEnds: product.flashEnds,
        images: product.images || [],
        stock: product.stock,
      } : null
    };
  });
  res.json(items);
});

/**
 * @openapi
 * /alerts:
 *   post:
 *     summary: Create or update a price alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               targetPrice: { type: number }
 *               active: { type: boolean }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Invalid data }
 */
router.post('/', async (req, res) => {
  const { productId, targetPrice, active = true } = req.body;
  if (!productId || typeof targetPrice !== 'number' || Number.isNaN(targetPrice) || targetPrice < 0) {
    return res.status(400).json({ error: 'Invalid productId or targetPrice' });
  }
  const product = await Product.findById(productId).lean();
  if (!product) return res.status(400).json({ error: 'Product not found' });
  const doc = await PriceAlert.findOneAndUpdate(
    { userId: req.user.id, productId },
    { $set: { targetPrice, active } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(doc);
});

/**
 * @openapi
 * /alerts/triggered:
 *   get:
 *     summary: List currently triggered alerts (current price <= target)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/triggered', async (req, res) => {
  const alerts = await PriceAlert.find({ userId: req.user.id, active: true }).lean();
  if (alerts.length === 0) return res.json([]);
  const products = await Product.find({ _id: { $in: alerts.map((a) => a.productId) } }).lean();
  const productMap = toProductMap(products);
  const now = new Date();
  const triggered = alerts.filter((a) => {
    const product = productMap.get(String(a.productId));
    if (!product) return false;
    const currentPrice = product.flashEnds && new Date(product.flashEnds) > now && typeof product.flashPrice === 'number'
      ? product.flashPrice
      : product.price;
    return typeof currentPrice === 'number' && currentPrice <= a.targetPrice;
  }).map((a) => {
    const product = productMap.get(String(a.productId));
    const currentPrice = product.flashEnds && new Date(product.flashEnds) > now && typeof product.flashPrice === 'number'
      ? product.flashPrice
      : product.price;
    return {
      ...a,
      currentPrice,
      savings: Math.max(0, a.targetPrice - currentPrice),
      product: product ? {
        _id: product._id,
        title: product.title,
        price: product.price,
        flashPrice: product.flashPrice,
        flashEnds: product.flashEnds,
      } : null
    };
  });
  if (triggered.length > 0) {
    await PriceAlert.updateMany(
      { _id: { $in: triggered.map((a) => a._id) } },
      { $set: { lastTriggeredAt: new Date() } }
    );
    const now = Date.now();
    await Promise.all(triggered.map((a) => {
      const last = a.lastTriggeredAt ? new Date(a.lastTriggeredAt).getTime() : 0;
      const oneHour = 60 * 60 * 1000;
      if (last && now - last < oneHour) return Promise.resolve();
      return createNotification({
        userId: req.user.id,
        type: 'price_alert',
        title: 'Price Alert Triggered',
        message: `${a.product?.title || 'A product'} dropped to ${a.currentPrice}.`,
        data: { productId: a.product?._id || null, alertId: a._id, currentPrice: a.currentPrice, targetPrice: a.targetPrice },
      }).catch(() => {});
    }));
  }
  res.json(triggered);
});

/**
 * @openapi
 * /alerts/{id}:
 *   delete:
 *     summary: Delete an alert
 *     tags: [Alerts]
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
router.delete('/:id', async (req, res) => {
  const doc = await PriceAlert.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
