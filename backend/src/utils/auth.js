const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, jwtSecret, {
    expiresIn: '7d',
  });

module.exports = {
  signToken,
};
