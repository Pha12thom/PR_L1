const path = require('path');

module.exports = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@resq.ke',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
  uploadDir: path.join(__dirname, '..', '..', 'uploads'),
  dataFile: path.join(__dirname, '..', 'data', 'store.json'),
};
