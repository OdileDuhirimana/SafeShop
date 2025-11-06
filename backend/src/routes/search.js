import { Router } from 'express';
import SearchQuery from '../models/SearchQuery.js';
import Product from '../models/Product.js';

const router = Router();

function normalize(q = '') {
  return String(q).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * @openapi
 * /search/track:
 *   post:
 *     summary: Track a search query for analytics
 *     tags: [Search]
 *     responses:
 *       200: { description: OK }
 */
router.post('/track', async (req, res) => {
  const q = normalize(req.body?.query || req.body?.q || '');
  if (!q || q.length < 2) return res.status(400).json({ error: 'Query too short' });
  const doc = await SearchQuery.findOneAndUpdate(
    { query: q },
    { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(doc);
});

/**
 * @openapi
 * /search/trending:
 *   get:
 *     summary: Get trending searches
 *     tags: [Search]
 *     responses:
 *       200: { description: OK }
 */
router.get('/trending', async (req, res) => {
  const items = await SearchQuery.find({})
    .sort({ count: -1, lastSearchedAt: -1 })
    .limit(12)
    .lean();
  res.json(items);
});

/**
 * @openapi
 * /search/suggest:
 *   get:
 *     summary: Suggest searches and products for autocomplete
 *     tags: [Search]
 *     responses:
 *       200: { description: OK }
 */
router.get('/suggest', async (req, res) => {
  const q = normalize(req.query.q || '');
  if (!q) return res.json({ queries: [], products: [] });
  const [queries, products] = await Promise.all([
    SearchQuery.find({ query: { $regex: `^${q}` } }).sort({ count: -1 }).limit(8).lean(),
    Product.find({ title: { $regex: q, $options: 'i' } }).limit(8).lean(),
  ]);
  res.json({
    queries: queries.map((x) => x.query),
    products: products.map((p) => ({ _id: p._id, title: p.title, price: p.price, category: p.category })),
  });
});

export default router;
