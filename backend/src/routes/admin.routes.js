const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { frontendUrl } = require('../config/env');
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
    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.report_status_updated',
      entityType: 'report',
      entityId: req.params.id,
      details: `status=${status}`,
      ipAddress: req.ip,
    });

    return res.json({ report: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    const report = await store.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    await store.deleteReport(req.params.id);
    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.report_deleted',
      entityType: 'report',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
    return res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/reset-all', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const admin = await store.getUserAuthById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin account not found' });

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    await store.resetAllDataExceptAdmin(req.user.id);
    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.system_reset_all',
      entityType: 'system',
      entityId: req.user.id,
      details: 'Reset all data except current admin',
      ipAddress: req.ip,
    });
    return res.json({ message: 'System reset complete. Only your admin account was kept.' });
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

router.get('/organizations', async (_req, res) => {
  try {
    const organizations = await store.getOrganizations();
    return res.json({ organizations });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/organizations', async (req, res) => {
  try {
    const { name, contactEmail } = req.body;
    if (!name || !contactEmail) {
      return res.status(400).json({ message: 'Organization name and contact email are required' });
    }

    const existing = await store.getUserByEmail(contactEmail.toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'That contact email is already used by another account' });
    }

    const tempPassword = crypto.randomBytes(5).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const organization = await store.createOrganization({
      name: name.trim(),
      contactEmail: contactEmail.toLowerCase(),
      createdBy: req.user.id,
    });

    const createdUser = await store.createUser({
      name: `${name.trim()} Desk`,
      email: contactEmail.toLowerCase(),
      phone: '',
      role: 'user',
      passwordHash,
    });

    await store.addOrganizationMembership({
      organizationId: organization.id,
      userId: createdUser.id,
      role: 'desk',
    });

    const inviteToken = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await store.createAuthorityInvite({
      organizationId: organization.id,
      userId: createdUser.id,
      token: inviteToken,
      tempPassword,
      expiresAt,
      createdBy: req.user.id,
    });

    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.organization_created',
      entityType: 'organization',
      entityId: organization.id,
      details: organization.name,
      ipAddress: req.ip,
    });

    const origin = String(frontendUrl || '').replace(/\/$/, '');
    return res.status(201).json({
      organization,
      account: {
        email: createdUser.email,
        password: tempPassword,
      },
      inviteLink: `${origin}/invite/${inviteToken}`,
      expiresAt,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/reports/:id/dispatch', async (req, res) => {
  try {
    const report = await store.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const { organizationId, note } = req.body;
    if (!organizationId) {
      return res.status(400).json({ message: 'organizationId is required' });
    }

    let targets = [];
    if (organizationId === 'all') {
      targets = await store.getOrganizations();
      if (!targets.length) return res.status(400).json({ message: 'No organizations available to dispatch' });
    } else {
      const organizations = await store.getOrganizations();
      const match = organizations.find((item) => item.id === organizationId);
      if (!match) return res.status(404).json({ message: 'Organization not found' });
      targets = [match];
    }

    const dispatches = [];
    for (const org of targets) {
      const dispatch = await store.createDispatch({
        reportId: req.params.id,
        organizationId: org.id,
        assignedBy: req.user.id,
        note: note || '',
      });

      await store.addPrivateMessage({
        dispatchId: dispatch.id,
        reportId: req.params.id,
        senderId: req.user.id,
        receiverOrgId: org.id,
        body: note || `New case dispatched: ${report.title}`,
      });

      dispatches.push(dispatch);
    }

    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.report_dispatched',
      entityType: 'report',
      entityId: req.params.id,
      details: organizationId === 'all' ? 'all organizations' : organizationId,
      ipAddress: req.ip,
    });

    return res.status(201).json({ message: 'Case dispatched successfully', dispatches });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/dispatches', async (_req, res) => {
  try {
    const dispatches = await store.getDispatchesForAdmin(300);
    return res.json({ dispatches });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 200;
    const logs = await store.getSiteLogs(limit);
    return res.json({ logs });
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
    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.user_promoted',
      entityType: 'user',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
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
    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.user_demoted',
      entityType: 'user',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
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
    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'admin.user_revoked',
      entityType: 'user',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
    return res.json({ message: 'User account revoked' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
