import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticator } from 'otplib';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [customer, seller, admin] }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Email already in use }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: role || 'customer' });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               totp: { type: string, description: Two-factor code if enabled }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Invalid credentials or 2FA required }
 *       500: { description: Login failed }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, totp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.twoFactorEnabled) {
      if (!totp || !authenticator.check(totp, user.twoFactorSecret || '')) {
        return res.status(401).json({ requires2FA: true, error: '2FA required' });
      }
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2FA: generate a secret for the user to enroll
/**
 * @openapi
 * /auth/2fa/setup:
 *   post:
 *     summary: Generate a TOTP secret for 2FA enrollment
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Returns otpauth URI }
 *       404: { description: User not found }
 */
router.post('/2fa/setup', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    await user.save();
    const otpauth = authenticator.keyuri(user.email, 'SafeShop', secret);
    res.json({ otpauth });
  } catch {
    res.status(500).json({ error: '2FA setup failed' });
  }
});

// 2FA: enable after verifying code
/**
 * @openapi
 * /auth/2fa/enable:
 *   post:
 *     summary: Enable 2FA for a user after verifying a TOTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Setup required or invalid code }
 *       500: { description: 2FA enable failed }
 */
router.post('/2fa/enable', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.twoFactorSecret) return res.status(400).json({ error: 'Setup required' });
    const ok = authenticator.check(code, user.twoFactorSecret);
    if (!ok) return res.status(400).json({ error: 'Invalid code' });
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: '2FA enable failed' });
  }
});

export default router;

