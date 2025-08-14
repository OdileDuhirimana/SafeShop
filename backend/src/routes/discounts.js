import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import Discount from '../models/Discount.js'

const router = Router()

router.use(authRequired, requireRole('admin'))

/**
 * @openapi
 * /discounts:
 *   get:
 *     summary: List discounts (admin)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res) => {
  const items = await Discount.find({}).sort({ createdAt: -1 }).limit(200)
  res.json(items)
})

/**
 * @openapi
 * /discounts:
 *   post:
 *     summary: Create a discount (admin)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               percent: { type: number }
 *               active: { type: boolean }
 *               expiresAt: { type: string, format: date-time }
 *     responses:
 *       201: { description: Created }
 */
router.post('/', async (req, res) => {
  const doc = await Discount.create(req.body)
  res.status(201).json(doc)
})

/**
 * @openapi
 * /discounts/{id}:
 *   put:
 *     summary: Update a discount (admin)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.put('/:id', async (req, res) => {
  const doc = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

/**
 * @openapi
 * /discounts/{id}:
 *   delete:
 *     summary: Delete a discount (admin)
 *     tags: [Discounts]
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
  const doc = await Discount.findById(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Not found' })
  await doc.deleteOne()
  res.json({ ok: true })
})

export default router
