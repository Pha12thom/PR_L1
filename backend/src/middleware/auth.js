const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const store = require('../utils/dbStore');

const authRequired = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await store.getUserById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token verification failed' });
  }
};

const allowAnonymousAuth = async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await store.getUserById(decoded.id);
    req.user = user ? { id: user.id, role: user.role, email: user.email, name: user.name } : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

const roleRequired = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient privileges' });
  }
  next();
};

module.exports = {
  authRequired,
  allowAnonymousAuth,
  roleRequired,
};
