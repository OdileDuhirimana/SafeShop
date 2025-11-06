import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'

const router = Router()
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function toId(v){
  return String(v || '')
}

function scoreFromFactors({ avgRating = 0, fulfillmentRate = 0, stockHealth = 0 }){
  const ratingNorm = Math.max(0, Math.min(1, avgRating / 5))
  const score = (ratingNorm * 0.45) + (fulfillmentRate * 0.35) + (stockHealth * 0.2)
  return Math.round(score * 100)
}

function urgencyFromDays(daysToStockout, dailyRunRate){
  if (!dailyRunRate || dailyRunRate <= 0) return 'stable'
  if (daysToStockout <= 7) return 'critical'
  if (daysToStockout <= 21) return 'high'
  if (daysToStockout <= 45) return 'medium'
  return 'low'
}

async function buildSellerSummary(sellerId){
  const sellerProducts = await Product.find({ sellerId }).lean()
  const productIds = new Set(sellerProducts.map((p) => toId(p._id)))
  const paidOrders = await Order.find({ status: 'paid' }).lean()
  const allOrders = await Order.find({}).lean()

  let itemSales = 0
  let paidOrdersWithSeller = 0
  let allOrdersWithSeller = 0
  for (const o of paidOrders) {
    let contains = false
    for (const it of o.items || []) {
      if (toId(it.sellerId) === toId(sellerId) || productIds.has(toId(it.productId))) {
        contains = true
        itemSales += Number(it.price || 0) * Number(it.quantity || 0)
      }
    }
    if (contains) paidOrdersWithSeller += 1
  }
  for (const o of allOrders) {
    let contains = false
    for (const it of o.items || []) {
      if (toId(it.sellerId) === toId(sellerId) || productIds.has(toId(it.productId))) {
        contains = true
        break
      }
    }
    if (contains) allOrdersWithSeller += 1
  }

  const avgRating = sellerProducts.length
    ? (sellerProducts.reduce((s, p) => s + Number(p.rating || 0), 0) / sellerProducts.length)
    : 0
  const inStockCount = sellerProducts.filter((p) => Number(p.stock || 0) > 0).length
  const stockHealth = sellerProducts.length ? (inStockCount / sellerProducts.length) : 0
  const fulfillmentRate = allOrdersWithSeller > 0 ? (paidOrdersWithSeller / allOrdersWithSeller) : 1
  const trustScore = scoreFromFactors({ avgRating, fulfillmentRate, stockHealth })

  return {
    sales: itemSales,
    productsCount: sellerProducts.length,
    paidOrdersCount: paidOrdersWithSeller,
    allOrdersCount: allOrdersWithSeller,
    trust: { score: trustScore, avgRating, fulfillmentRate, stockHealth },
    products: sellerProducts,
  }
}

async function buildInventoryForecast(sellerId){
  const products = await Product.find({ sellerId }).lean()
  const since = new Date(Date.now() - THIRTY_DAYS_MS)
  const orders = await Order.find({ status: 'paid', createdAt: { $gte: since } }).lean()
  const soldByProduct = new Map()
  for (const o of orders) {
    for (const it of o.items || []) {
      if (toId(it.sellerId) !== toId(sellerId)) continue
      const key = toId(it.productId)
      soldByProduct.set(key, (soldByProduct.get(key) || 0) + Number(it.quantity || 0))
    }
  }

  const items = products.map((p) => {
    const sold30d = soldByProduct.get(toId(p._id)) || 0
    const dailyRunRate = sold30d / 30
    const stock = Number(p.stock || 0)
    const daysToStockout = dailyRunRate > 0 ? Number((stock / dailyRunRate).toFixed(1)) : null
    const urgency = urgencyFromDays(daysToStockout ?? Infinity, dailyRunRate)
    const restockTarget = Math.max(0, Math.ceil((dailyRunRate * 30) - stock))
    return {
      productId: p._id,
      title: p.title,
      stock,
      sold30d,
      dailyRunRate: Number(dailyRunRate.toFixed(2)),
      daysToStockout,
      urgency,
      restockTarget,
    }
  }).sort((a, b) => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1, stable: 0 }
    return rank[b.urgency] - rank[a.urgency]
  })

  return items
}

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
  if (req.user.role === 'admin') {
    const productsCount = await Product.countDocuments({})
    const ordersCount = await Order.countDocuments({ status: 'paid' })
    return res.json({ sales: 0, productsCount, ordersCount, trust: { score: 0, avgRating: 0, fulfillmentRate: 0, stockHealth: 0 } })
  }
  const summary = await buildSellerSummary(req.user.id)
  res.json({
    sales: summary.sales,
    productsCount: summary.productsCount,
    ordersCount: summary.paidOrdersCount,
    trust: summary.trust
  })
})

/**
 * @openapi
 * /metrics/seller/forecast:
 *   get:
 *     summary: Get inventory forecast for current seller
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/seller/forecast', authRequired, requireRole('seller','admin'), async (req, res) => {
  if (req.user.role === 'admin') return res.json([])
  const items = await buildInventoryForecast(req.user.id)
  res.json(items)
})

/**
 * @openapi
 * /metrics/admin/seller-trust:
 *   get:
 *     summary: Get seller trust leaderboard for admins
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/admin/seller-trust', authRequired, requireRole('admin'), async (req, res) => {
  const sellers = await User.find({ role: 'seller' }).select('_id name email').lean()
  const rows = []
  for (const seller of sellers) {
    const summary = await buildSellerSummary(seller._id)
    rows.push({
      sellerId: seller._id,
      name: seller.name,
      email: seller.email,
      trustScore: summary.trust.score,
      avgRating: Number(summary.trust.avgRating.toFixed(2)),
      fulfillmentRate: Number(summary.trust.fulfillmentRate.toFixed(2)),
      stockHealth: Number(summary.trust.stockHealth.toFixed(2)),
      sales: Number(summary.sales.toFixed(2)),
      productsCount: summary.productsCount,
      paidOrdersCount: summary.paidOrdersCount,
    })
  }
  rows.sort((a, b) => b.trustScore - a.trustScore)
  res.json(rows)
})

export default router
