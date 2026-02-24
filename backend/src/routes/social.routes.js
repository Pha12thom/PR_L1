const express = require('express');
const { authRequired } = require('../middleware/auth');
const store = require('../utils/dbStore');

const router = express.Router();

router.post('/reports/:id/like', authRequired, async (req, res) => {
  try {
    const report = await store.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const result = await store.toggleLike(req.params.id, req.user.id);
    const updated = await store.getReportById(req.params.id);

    return res.json({ likesCount: updated.likes.length, liked: result.liked });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
