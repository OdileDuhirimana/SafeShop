import { Router } from 'express'
import Cart from '../models/Cart.js'
import { authRequired } from '../middleware/auth.js'
import { activityLogger } from '../middleware/activity.js'

const router = Router()

router.use(authRequired)
router.use(activityLogger('cart'))

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Get current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id })
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] })
  res.json(cart)
})

/**
 * @openapi
 * /cart/add:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Cart]
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
 *               title: { type: string }
 *               price: { type: number }
 *               quantity: { type: number, default: 1 }
 *     responses:
 *       200: { description: OK }
 */
router.post('/add', async (req, res) => {
  const { productId, title, price, quantity = 1 } = req.body
  let cart = await Cart.findOne({ userId: req.user.id })
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] })
  const idx = cart.items.findIndex(i => String(i.productId) === String(productId))
  if (idx >= 0) cart.items[idx].quantity += quantity
  else cart.items.push({ productId, title, price, quantity })
  await cart.save()
  res.json(cart)
})

/**
 * @openapi
 * /cart/update:
 *   post:
 *     summary: Update quantity for an item in the cart
 *     tags: [Cart]
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
 *               quantity: { type: number }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.post('/update', async (req, res) => {
  const { productId, quantity } = req.body
  const cart = await Cart.findOne({ userId: req.user.id })
  if (!cart) return res.status(404).json({ error: 'Cart not found' })
  const item = cart.items.find(i => String(i.productId) === String(productId))
  if (!item) return res.status(404).json({ error: 'Item not found' })
  item.quantity = quantity
  await cart.save()
  res.json(cart)
})

/**
 * @openapi
 * /cart/remove:
 *   post:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
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
 *       404: { description: Not found }
 */
router.post('/remove', async (req, res) => {
  const { productId } = req.body
  const cart = await Cart.findOne({ userId: req.user.id })
  if (!cart) return res.status(404).json({ error: 'Cart not found' })
  cart.items = cart.items.filter(i => String(i.productId) !== String(productId))
  await cart.save()
  res.json(cart)
})

/**
 * @openapi
 * /cart/clear:
 *   post:
 *     summary: Clear the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.post('/clear', async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id })
  if (!cart) return res.status(404).json({ error: 'Cart not found' })
  cart.items = []
  await cart.save()
  res.json(cart)
})

export default router

