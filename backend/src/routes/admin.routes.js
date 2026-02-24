const express = require('express');
const { roleRequired, authRequired } = require('../middleware/auth');
const store = require('../utils/dbStore');

const router = express.Router();

router.use(authRequired, roleRequired('admin'));

router.get('/reports', async (_req, res) => {
  try {
    const reports = await store.getReports();
    return res.json({ reports });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/reports/:id/status', async (req, res) => {
  try {
    const report = await store.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const { status, message } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    await store.addAdminUpdate(req.params.id, req.user.id, req.user.name, status, message || '');
    const updated = await store.getReportById(req.params.id);

    return res.json({ report: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await store.getAllUsers();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/users/:id/promote', async (req, res) => {
  try {
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'User is already an admin' });

    const updated = await store.updateUserRole(req.params.id, 'admin');
    return res.json({ user: updated, message: 'User promoted to admin' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/users/:id/demote', async (req, res) => {
  try {
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'user') return res.status(400).json({ message: 'User is already a regular user' });

    const updated = await store.updateUserRole(req.params.id, 'user');
    return res.json({ user: updated, message: 'User demoted to regular user' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const currentAdmin = req.user.id;
    if (currentAdmin === req.params.id) return res.status(400).json({ message: 'Cannot revoke your own account' });

    await store.revokeUser(req.params.id);
    return res.json({ message: 'User account revoked' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
