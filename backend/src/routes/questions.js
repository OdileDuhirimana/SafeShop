import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import ProductQuestion from '../models/ProductQuestion.js';
import Product from '../models/Product.js';

const router = Router();

/**
 * @openapi
 * /questions/{productId}:
 *   get:
 *     summary: List product questions and answers
 *     tags: [Questions]
 *     responses:
 *       200: { description: OK }
 */
router.get('/:productId', async (req, res) => {
  const items = await ProductQuestion.find({ productId: req.params.productId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json(items);
});

/**
 * @openapi
 * /questions/{productId}:
 *   post:
 *     summary: Ask a product question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Created }
 */
router.post('/:productId', authRequired, async (req, res) => {
  const product = await Product.findById(req.params.productId).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const question = String(req.body?.question || '').trim();
  if (question.length < 5) return res.status(400).json({ error: 'Question too short' });
  const doc = await ProductQuestion.create({
    productId: req.params.productId,
    userId: req.user.id,
    question,
  });
  res.status(201).json(doc);
});

/**
 * @openapi
 * /questions/{id}/answer:
 *   post:
 *     summary: Answer a product question (seller/admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/answer', authRequired, requireRole('seller', 'admin'), async (req, res) => {
  const doc = await ProductQuestion.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const product = await Product.findById(doc.productId).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (req.user.role !== 'admin' && String(product.sellerId) !== String(req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const answer = String(req.body?.answer || '').trim();
  if (answer.length < 2) return res.status(400).json({ error: 'Answer too short' });
  doc.answer = answer;
  doc.status = 'answered';
  doc.answeredBy = req.user.id;
  await doc.save();
  res.json(doc);
});

export default router;
