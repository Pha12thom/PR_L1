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
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
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
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', authRequired, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
