import { Router } from 'express';
import crypto from 'crypto';
import { authRequired } from '../middleware/auth.js';
import SavedPaymentMethod from '../models/SavedPaymentMethod.js';

const router = Router();
router.use(authRequired);

/**
 * @openapi
 * /payment-methods:
 *   get:
 *     summary: List current user's saved payment methods
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res) => {
  const items = await SavedPaymentMethod.find({ userId: req.user.id })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
  res.json(items);
});

/**
 * @openapi
 * /payment-methods:
 *   post:
 *     summary: Save a payment method token (simulated vault)
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Created }
 */
router.post('/', async (req, res) => {
  const { provider = 'card', brand = 'visa', last4, expMonth, expYear, billingPostalCode = '', isDefault = false } = req.body;
  if (!last4 || String(last4).length !== 4) return res.status(400).json({ error: 'last4 must be 4 digits' });
  const tokenRef = `tok_${crypto.randomBytes(8).toString('hex')}`;
  const doc = await SavedPaymentMethod.create({
    userId: req.user.id,
    provider,
    brand,
    last4: String(last4),
    expMonth: Number(expMonth || 1),
    expYear: Number(expYear || 2030),
    billingPostalCode,
    tokenRef,
    isDefault: Boolean(isDefault),
  });
  if (doc.isDefault) {
    await SavedPaymentMethod.updateMany({ userId: req.user.id, _id: { $ne: doc._id } }, { $set: { isDefault: false } });
  }
  res.status(201).json(doc);
});

/**
 * @openapi
 * /payment-methods/{id}/default:
 *   post:
 *     summary: Set default payment method
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/default', async (req, res) => {
  const doc = await SavedPaymentMethod.findOne({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  await SavedPaymentMethod.updateMany({ userId: req.user.id }, { $set: { isDefault: false } });
  doc.isDefault = true;
  await doc.save();
  res.json(doc);
});

/**
 * @openapi
 * /payment-methods/{id}:
 *   delete:
 *     summary: Delete saved payment method
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.delete('/:id', async (req, res) => {
  const doc = await SavedPaymentMethod.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
