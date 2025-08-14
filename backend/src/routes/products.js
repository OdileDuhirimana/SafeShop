import { Router } from 'express';
import Product from '../models/Product.js';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

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
  const { q, category, sort, brand, ratingMin, inStock, flashOnly } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: q, $options: 'i' };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (ratingMin) filter.rating = { $gte: Number(ratingMin) };
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (flashOnly === 'true') filter.flashEnds = { $gt: new Date() };
  let query = Product.find(filter);
  if (sort === 'price_asc') query = query.sort({ price: 1 });
  if (sort === 'price_desc') query = query.sort({ price: -1 });
  const items = await query.limit(50);
  res.json(items);
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
