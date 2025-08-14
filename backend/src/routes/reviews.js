import { Router } from 'express'
import Review from '../models/Review.js'
import Product from '../models/Product.js'
import { authRequired } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activity.js'

const router = Router()

/**
 * @openapi
 * /reviews/{productId}:
 *   get:
 *     summary: List reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/:productId', async (req, res) => {
  const { productId } = req.params
  const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).limit(50)
  res.json(reviews)
})

/**
 * @openapi
 * /reviews/{productId}:
 *   post:
 *     summary: Create a review for a product
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Failed or duplicate }
 */
router.post('/:productId', authRequired, activityLogger('review:create'), async (req, res) => {
  try {
    const { productId } = req.params
    const { rating, comment } = req.body
    await Product.findById(productId) // ensure exists
    const review = await Review.create({ productId, userId: req.user.id, rating, comment })
    res.json(review)
  } catch (e) {
    if (e?.code === 11000) return res.status(400).json({ error: 'You already reviewed this product' })
    res.status(400).json({ error: 'Failed to submit review' })
  }
})

export default router

