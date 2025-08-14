import { Router } from 'express'
import Wishlist from '../models/Wishlist.js'
import { authRequired } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activity.js'

const router = Router()
router.use(authRequired)
router.use(activityLogger('wishlist'))

/**
 * @openapi
 * /wishlist:
 *   get:
 *     summary: Get current user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res) => {
  let wl = await Wishlist.findOne({ userId: req.user.id })
  if (!wl) wl = await Wishlist.create({ userId: req.user.id, productIds: [] })
  res.json(wl)
})

/**
 * @openapi
 * /wishlist/toggle:
 *   post:
 *     summary: Toggle a product in the wishlist
 *     tags: [Wishlist]
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
 *     responses:
 *       200: { description: OK }
 */
router.post('/toggle', async (req, res) => {
  const { productId } = req.body
  let wl = await Wishlist.findOne({ userId: req.user.id })
  if (!wl) wl = await Wishlist.create({ userId: req.user.id, productIds: [] })
  const exists = wl.productIds.find(id => String(id) === String(productId))
  if (exists) wl.productIds = wl.productIds.filter(id => String(id) !== String(productId))
  else wl.productIds.push(productId)
  await wl.save()
  res.json(wl)
})

export default router
