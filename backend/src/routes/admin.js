import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import ActivityLog from '../models/ActivityLog.js'

const router = Router()

/**
 * @openapi
 * /admin/activity:
 *   get:
 *     summary: List admin activity logs
 *     description: Admin-only endpoint to view activity logs recorded by the server.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/activity', authRequired, requireRole('admin'), async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100)
  const filter = {}
  if (req.query.userId) filter.userId = req.query.userId
  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
    ActivityLog.countDocuments(filter)
  ])
  res.json({ items, page, limit, total })
})

export default router
