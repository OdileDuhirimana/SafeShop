import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'

const router = Router()
router.use(authRequired)

// Simulated PayPal checkout session
/**
 * @openapi
 * /payments/paypal/checkout:
 *   post:
 *     summary: Simulate PayPal checkout session
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total: { type: number }
 *     responses:
 *       200: { description: OK }
 */
router.post('/paypal/checkout', async (req, res) => {
  const { total } = req.body
  // Return a simulated approval URL
  res.json({ provider: 'paypal', approveUrl: `https://example.com/paypal/approve?amount=${encodeURIComponent(total)}` })
})

// Simulated Google Pay token generation
/**
 * @openapi
 * /payments/googlepay/checkout:
 *   post:
 *     summary: Simulate Google Pay checkout
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total: { type: number }
 *     responses:
 *       200: { description: OK }
 */
router.post('/googlepay/checkout', async (req, res) => {
  const { total } = req.body
  res.json({ provider: 'googlepay', token: 'simulated-googlepay-token', total })
})

// Simulated Apple Pay session
/**
 * @openapi
 * /payments/applepay/checkout:
 *   post:
 *     summary: Simulate Apple Pay session
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total: { type: number }
 *     responses:
 *       200: { description: OK }
 */
router.post('/applepay/checkout', async (req, res) => {
  const { total } = req.body
  res.json({ provider: 'applepay', sessionId: 'simulated-apple-session', total })
})

export default router
