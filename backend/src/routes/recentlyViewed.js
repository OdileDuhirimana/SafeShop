import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import RecentlyViewed from '../models/RecentlyViewed.js';
import Product from '../models/Product.js';

const router = Router();
router.use(authRequired);

/**
 * @openapi
 * /recently-viewed:
 *   get:
 *     summary: List current user's recently viewed products
 *     tags: [RecentlyViewed]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res) => {
  const rv = await RecentlyViewed.findOne({ userId: req.user.id }).lean();
  const ids = rv?.productIds || [];
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const map = new Map(products.map((p) => [String(p._id), p]));
  const ordered = ids.map((id) => map.get(String(id))).filter(Boolean);
  res.json(ordered);
});

/**
 * @openapi
 * /recently-viewed/{productId}:
 *   post:
 *     summary: Push product into recently viewed list
 *     tags: [RecentlyViewed]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/:productId', async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let doc = await RecentlyViewed.findOne({ userId: req.user.id });
  if (!doc) doc = await RecentlyViewed.create({ userId: req.user.id, productIds: [] });
  doc.productIds = [productId, ...doc.productIds.filter((id) => String(id) !== String(productId))].slice(0, 40);
  await doc.save();
  res.json({ ok: true, count: doc.productIds.length });
});

export default router;
