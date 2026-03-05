const express = require('express');
const { authRequired, allowAnonymousAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const store = require('../utils/dbStore');

const router = express.Router();

const toNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

router.get('/', async (req, res) => {
  try {
    const nearLat = toNumber(req.query.nearLat);
    const nearLng = toNumber(req.query.nearLng);
    const radiusKm = toNumber(req.query.radiusKm) || 1;

    const filters = {};
    if (nearLat !== null && nearLng !== null) {
      filters.nearLat = nearLat;
      filters.nearLng = nearLng;
      filters.radiusKm = radiusKm;
    }

    const reports = await store.getReports(filters);
    return res.json({ reports });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/mine', authRequired, async (req, res) => {
  try {
    const reports = await store.getReportsByUserId(req.user.id);
    return res.json({ reports });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const report = await store.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    return res.json({ report });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/', allowAnonymousAuth, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least 1 image is required (max 5)' });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ message: 'Maximum 5 images allowed' });
    }

    const { title, description, category, severity, latitude, longitude, locationText, anonymous, contactPhone } =
      req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const lat = toNumber(latitude);
    const lng = toNumber(longitude);
    if (lat === null || lng === null) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    const report = await store.createReport({
      title,
      description,
      category: category || 'general',
      severity: severity || 'medium',
      location: {
        latitude: lat,
        longitude: lng,
        locationText: locationText || '',
      },
      status: 'submitted',
      anonymous: String(anonymous) === 'true',
      contactPhone: contactPhone || '',
      reportedBy: req.user?.id || null,
      reporterName: String(anonymous) === 'true' || !req.user ? 'Anonymous' : req.user.name,
    });

    for (const file of req.files) {
      await store.addReportImage(report.id, `/uploads/${file.filename}`);
    }

    const images = (req.files || []).map((file) => `/uploads/${file.filename}`);

    await store.addSiteLog({
      actorId: req.user?.id || null,
      actorName: req.user?.name || 'Anonymous',
      actorRole: req.user?.role || 'guest',
      action: 'report.created',
      entityType: 'report',
      entityId: report.id,
      details: `severity=${report.severity}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ report: { ...report, images } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comments', authRequired, async (req, res) => {
  try {
    const report = await store.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const comment = await store.addComment(req.params.id, req.user.id, req.user.name, text);
    const updated = await store.getReportById(req.params.id);
    await store.addSiteLog({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'report.comment_added',
      entityType: 'report',
      entityId: req.params.id,
      ipAddress: req.ip,
    });

    return res.status(201).json({ comment, report: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
