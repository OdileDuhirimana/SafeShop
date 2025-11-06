import { Router } from 'express';
import Product from '../models/Product.js';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import SearchQuery from '../models/SearchQuery.js';

const router = Router();
const STOP_WORDS = new Set(['a', 'an', 'the', 'for', 'and', 'or', 'with', 'to', 'of', 'on', 'in', 'my', 'i', 'need', 'want']);

function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function scoreProduct(product, { goalTokens, budget, category }) {
  const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
  const categoryText = String(product.category || '').toLowerCase();
  const now = new Date();
  const effectivePrice = product.flashEnds && new Date(product.flashEnds) > now && typeof product.flashPrice === 'number'
    ? product.flashPrice
    : product.price;
  let score = 0;
  const reasons = [];

  for (const token of goalTokens) {
    if (text.includes(token)) {
      score += 2;
      reasons.push(`matches "${token}"`);
    }
    if (categoryText.includes(token)) {
      score += 2.5;
      reasons.push(`fits ${product.category || 'category'}`);
    }
  }
  if (category && categoryText === String(category).toLowerCase()) {
    score += 3;
    reasons.push('exact category match');
  }
  if (Number(product.stock || 0) > 0) score += 1.25;
  if (product.flashEnds && new Date(product.flashEnds) > now) {
    score += 0.75;
    reasons.push('active flash deal');
  }
  score += Math.min(5, Number(product.rating || 0)) * 0.8;
  if (typeof budget === 'number' && budget > 0 && effectivePrice <= budget) {
    score += 0.75;
    reasons.push('within budget');
  }

  return {
    product,
    score: Number(score.toFixed(2)),
    effectivePrice,
    reason: reasons.slice(0, 3).join(', ') || 'general relevance and rating'
  };
}

/**
 * @openapi
 * /products:
 *   get:
 *     summary: List products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *       - in: query
 *         name: ratingMin
 *         schema: { type: number, minimum: 0, maximum: 5 }
 *       - in: query
 *         name: inStock
 *         schema: { type: string, enum: ["true","false"] }
 *       - in: query
 *         name: flashOnly
 *         schema: { type: string, enum: ["true","false"] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: ["price_asc","price_desc"] }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', async (req, res) => {
  const { q, category, sort, brand, ratingMin, inStock, flashOnly, minPrice, maxPrice } = req.query;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const filter = {};
  if (q) filter.title = { $regex: q, $options: 'i' };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (ratingMin) filter.rating = { $gte: Number(ratingMin) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (flashOnly === 'true') filter.flashEnds = { $gt: new Date() };
  let query = Product.find(filter);
  if (sort === 'price_asc') query = query.sort({ price: 1 });
  if (sort === 'price_desc') query = query.sort({ price: -1 });
  if (sort === 'rating_desc') query = query.sort({ rating: -1 });
  if (sort === 'newest') query = query.sort({ createdAt: -1 });
  const [items, total] = await Promise.all([
    query.skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);
  if (q && String(q).trim().length >= 2) {
    const normalized = String(q).trim().toLowerCase().replace(/\s+/g, ' ');
    SearchQuery.findOneAndUpdate(
      { query: normalized },
      { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch(() => {});
  }
  if (req.query.withMeta === 'true') {
    return res.json({ items, total, page, limit });
  }
  return res.json(items);
});

/**
 * @openapi
 * /products/concierge:
 *   post:
 *     summary: AI-style shopping concierge (goal + budget => curated picks)
 *     tags: [Products]
 *     responses:
 *       200: { description: OK }
 */
router.post('/concierge', async (req, res) => {
  try {
    const { goal = '', budget, maxItems = 4, category } = req.body || {};
    const cap = Math.max(1, Math.min(8, Number(maxItems) || 4));
    const parsedBudget = typeof budget === 'number' ? budget : Number(budget);
    const budgetValue = Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : null;
    const goalTokens = tokenize(goal);
    const query = {};
    if (category) query.category = category;
    const products = await Product.find(query).limit(120).lean();
    if (products.length === 0) return res.json({ picks: [], plan: { total: 0, budget: budgetValue, goal, maxItems: cap } });

    const ranked = products.map((p) => scoreProduct(p, { goalTokens, budget: budgetValue, category }))
      .sort((a, b) => b.score - a.score);

    const picks = [];
    let runningTotal = 0;
    for (const item of ranked) {
      if (picks.length >= cap) break;
      if (budgetValue && runningTotal + item.effectivePrice > budgetValue && picks.length > 0) continue;
      picks.push({
        _id: item.product._id,
        title: item.product.title,
        category: item.product.category,
        price: item.effectivePrice,
        rating: item.product.rating || 0,
        stock: item.product.stock || 0,
        images: item.product.images || [],
        reason: item.reason,
        fitScore: item.score
      });
      runningTotal += item.effectivePrice;
    }
    if (picks.length === 0 && ranked[0]) {
      picks.push({
        _id: ranked[0].product._id,
        title: ranked[0].product.title,
        category: ranked[0].product.category,
        price: ranked[0].effectivePrice,
        rating: ranked[0].product.rating || 0,
        stock: ranked[0].product.stock || 0,
        images: ranked[0].product.images || [],
        reason: ranked[0].reason,
        fitScore: ranked[0].score
      });
      runningTotal = ranked[0].effectivePrice;
    }

    res.json({
      plan: {
        goal,
        budget: budgetValue,
        maxItems: cap,
        total: Number(runningTotal.toFixed(2)),
        confidence: picks.length ? Number((picks.reduce((s, p) => s + p.fitScore, 0) / picks.length).toFixed(2)) : 0
      },
      picks
    });
  } catch {
    res.status(500).json({ error: 'Concierge recommendation failed' });
  }
});

// Get single product by id
/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.get('/:id', async (req, res) => {
  const item = await Product.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// Create product (seller or admin)
/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product (seller or admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authRequired, requireRole('seller','admin'), async (req, res) => {
  const body = req.body;
  const product = await Product.create({ ...body, sellerId: req.user.id });
  res.status(201).json(product);
});

// Update product (owner seller or admin)
/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update a product (owner seller or admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put('/:id', authRequired, requireRole('seller','admin'), async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && String(product.sellerId) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  Object.assign(product, req.body);
  await product.save();
  res.json(product);
});

// Delete product (owner seller or admin)
/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (owner seller or admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete('/:id', authRequired, requireRole('seller','admin'), async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && String(product.sellerId) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await product.deleteOne();
  res.json({ ok: true });
});

export default router;
