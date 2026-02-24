require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const { port, uploadDir, adminEmail, adminPassword } = require('./config/env');
const { initDatabase } = require('./config/database');
const store = require('./utils/dbStore');
const authRoutes = require('./routes/auth.routes');
const reportsRoutes = require('./routes/reports.routes');
const adminRoutes = require('./routes/admin.routes');
const socialRoutes = require('./routes/social.routes');
const contactsRoutes = require('./routes/contacts.routes');

const app = express();

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const init = async () => {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized');

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await store.seedAdmin(adminEmail, passwordHash);
    await store.seedContacts();

    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', service: 'Emergency Response API' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/reports', reportsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/social', socialRoutes);
    app.use('/api/contacts', contactsRoutes);

    app.use((err, _req, res, _next) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error', error: err.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    });

    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
      console.log(`Seed admin email: ${adminEmail}`);
    });
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
};

init();
