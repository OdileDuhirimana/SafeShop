import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'

const router = Router()

/**
 * @openapi
 * /metrics/admin:
 *   get:
 *     summary: Get admin metrics (revenue, orders, top products)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/admin', authRequired, requireRole('admin'), async (req, res) => {
  const totalRevenueAgg = await Order.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
  ])
  const totalRevenue = totalRevenueAgg[0]?.total || 0
  const ordersCount = totalRevenueAgg[0]?.count || 0
  const topProducts = await Product.find({}).sort({ rating: -1 }).limit(5)
  res.json({ totalRevenue, ordersCount, topProducts })
})

/**
 * @openapi
 * /metrics/seller:
 *   get:
 *     summary: Get seller metrics (sales and product count)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/seller', authRequired, requireRole('seller','admin'), async (req, res) => {
  const match = req.user.role === 'admin' ? {} : { 'items.sellerId': req.user.id }
  const orders = await Order.find({ status: 'paid' })
  const sales = orders.reduce((sum, o) => sum + o.total, 0)
  const productsCount = await Product.countDocuments(req.user.role === 'admin' ? {} : { sellerId: req.user.id })
  res.json({ sales, productsCount })
})

export default router

