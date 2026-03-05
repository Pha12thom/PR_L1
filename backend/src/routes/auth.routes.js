const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { signToken } = require('../utils/auth');
const { authRequired } = require('../middleware/auth');
const store = require('../utils/dbStore');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone } = req.body;

    const existing = await store.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await store.createUser({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      role: 'user',
      passwordHash,
    });

    const token = signToken(user);
    await store.addSiteLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'auth.register_success',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
    });
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || null,
      },
    });
  }
);

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await store.getUserByEmail(email);

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password || '', user.password_hash);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user);
  await store.addSiteLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'auth.login_success',
    entityType: 'user',
    entityId: user.id,
    ipAddress: req.ip,
  });
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatarUrl: user.avatar_url || null,
    },
  });
});

router.get('/me', authRequired, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone || '',
      avatarUrl: req.user.avatarUrl || null,
      organizationId: req.user.organizationId || null,
      organizationName: req.user.organizationName || null,
    },
  });
});

router.put('/profile', authRequired, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const avatarUrl = String(req.body.avatarUrl || '').trim();

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await store.getUserByEmail(email);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ message: 'That email is already in use' });
    }

    const updated = await store.updateUserProfile(req.user.id, {
      name,
      email,
      phone,
      avatarUrl: avatarUrl || null,
    });

    await store.addSiteLog({
      actorId: req.user.id,
      actorName: updated.name,
      actorRole: req.user.role,
      action: 'auth.profile_updated',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip,
    });

    return res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone || '',
        avatarUrl: updated.avatar_url || null,
        organizationId: updated.organization_id || null,
        organizationName: updated.organization_name || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/change-password', authRequired, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await store.getUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await store.updateUserPasswordHash(req.user.id, passwordHash);

    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'auth.password_changed',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip,
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
