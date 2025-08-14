import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import Referral from '../models/Referral.js'
import crypto from 'crypto'

const router = Router()
router.use(authRequired)

/**
 * @openapi
 * /referrals/mine:
 *   get:
 *     summary: Get current user's referral record
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/mine', async (req, res) => {
  let ref = await Referral.findOne({ ownerUserId: req.user.id })
  if (!ref) return res.json(null)
  res.json(ref)
})

/**
 * @openapi
 * /referrals:
 *   post:
 *     summary: Create a referral code for current user (idempotent)
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Created }
 *       200: { description: Already exists }
 */
router.post('/', async (req, res) => {
  let ref = await Referral.findOne({ ownerUserId: req.user.id })
  if (ref) return res.json(ref)
  const code = crypto.randomBytes(4).toString('hex')
  ref = await Referral.create({ ownerUserId: req.user.id, code })
  res.status(201).json(ref)
})

export default router
