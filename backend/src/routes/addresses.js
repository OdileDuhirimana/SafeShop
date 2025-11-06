import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import Address from '../models/Address.js';

const router = Router();
router.use(authRequired);

/**
 * @openapi
 * /addresses:
 *   get:
 *     summary: List current user's shipping addresses
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (req, res) => {
  const items = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 }).lean();
  res.json(items);
});

/**
 * @openapi
 * /addresses:
 *   post:
 *     summary: Create a shipping address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Created }
 */
router.post('/', async (req, res) => {
  const payload = { ...req.body, userId: req.user.id };
  const doc = await Address.create(payload);
  if (doc.isDefault) {
    await Address.updateMany({ userId: req.user.id, _id: { $ne: doc._id } }, { $set: { isDefault: false } });
  }
  res.status(201).json(doc);
});

/**
 * @openapi
 * /addresses/{id}:
 *   put:
 *     summary: Update a shipping address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.put('/:id', async (req, res) => {
  const doc = await Address.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: req.body },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.isDefault) {
    await Address.updateMany({ userId: req.user.id, _id: { $ne: doc._id } }, { $set: { isDefault: false } });
  }
  res.json(doc);
});

/**
 * @openapi
 * /addresses/{id}/default:
 *   post:
 *     summary: Mark an address as default
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/default', async (req, res) => {
  const doc = await Address.findOne({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  await Address.updateMany({ userId: req.user.id }, { $set: { isDefault: false } });
  doc.isDefault = true;
  await doc.save();
  res.json(doc);
});

/**
 * @openapi
 * /addresses/{id}:
 *   delete:
 *     summary: Delete a shipping address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: OK }
 */
router.delete('/:id', async (req, res) => {
  const doc = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;
