const express = require('express');
const { authRequired } = require('../middleware/auth');
const store = require('../utils/dbStore');

const router = express.Router();

router.get('/invite/:token', async (req, res) => {
  try {
    const invite = await store.getAuthorityInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ message: 'Invite link has expired' });
    }

    return res.json({
      invite: {
        organizationName: invite.organization_name,
        email: invite.user_email,
        password: invite.temp_password,
        expiresAt: invite.expires_at,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.use(authRequired);

router.get('/inbox', async (req, res) => {
  try {
    const dispatches = req.user.role === 'admin'
      ? await store.getDispatchesForAdmin(300)
      : await store.getDispatchesForUser(req.user.id, 300);
    return res.json({ dispatches });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/dispatches/:id/messages', async (req, res) => {
  try {
    const dispatch = await store.getDispatchById(req.params.id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

    if (req.user.role !== 'admin') {
      const organization = await store.getOrganizationForUser(req.user.id);
      if (!organization || organization.id !== dispatch.organization_id) {
        return res.status(403).json({ message: 'You are not allowed to view this conversation' });
      }
    }

    const messages = await store.getPrivateMessagesByDispatch(req.params.id);
    return res.json({ dispatch, messages });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/dispatches/:id/messages', async (req, res) => {
  try {
    const dispatch = await store.getDispatchById(req.params.id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message text is required' });

    let receiverUserId = null;
    let receiverOrgId = null;

    if (req.user.role === 'admin') {
      receiverOrgId = dispatch.organization_id;
    } else {
      const organization = await store.getOrganizationForUser(req.user.id);
      if (!organization || organization.id !== dispatch.organization_id) {
        return res.status(403).json({ message: 'You are not allowed to send to this conversation' });
      }
      receiverUserId = dispatch.assigned_by;
    }

    await store.addPrivateMessage({
      dispatchId: dispatch.id,
      reportId: dispatch.report_id,
      senderId: req.user.id,
      receiverUserId,
      receiverOrgId,
      body: text,
    });

    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'message.sent',
      entityType: 'dispatch',
      entityId: dispatch.id,
      ipAddress: req.ip,
    });

    const messages = await store.getPrivateMessagesByDispatch(req.params.id);
    return res.status(201).json({ messages });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/dispatches/:id/status', async (req, res) => {
  try {
    const dispatch = await store.getDispatchById(req.params.id);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });

    const status = String(req.body.status || '').trim();
    const message = String(req.body.message || '').trim();
    if (!status) return res.status(400).json({ message: 'Status is required' });

    if (req.user.role !== 'admin') {
      const organization = await store.getOrganizationForUser(req.user.id);
      if (!organization || organization.id !== dispatch.organization_id) {
        return res.status(403).json({ message: 'You are not allowed to update this dispatch' });
      }
    }

    await store.updateDispatchStatus(dispatch.id, status);

    await store.addAdminUpdate(
      dispatch.report_id,
      req.user.id,
      req.user.name,
      status,
      message || `Status updated to ${status}`
    );

    if (message) {
      await store.addPrivateMessage({
        dispatchId: dispatch.id,
        reportId: dispatch.report_id,
        senderId: req.user.id,
        receiverUserId: req.user.role === 'admin' ? null : dispatch.assigned_by,
        receiverOrgId: req.user.role === 'admin' ? dispatch.organization_id : null,
        body: message,
      });
    }

    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'dispatch.status_updated',
      entityType: 'dispatch',
      entityId: dispatch.id,
      details: status,
      ipAddress: req.ip,
    });

    const updatedDispatch = await store.getDispatchById(dispatch.id);
    return res.json({ dispatch: updatedDispatch });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
