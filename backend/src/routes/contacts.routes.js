const express = require('express');
const store = require('../utils/dbStore');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const contacts = await store.getContacts();
    return res.json({ contacts });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
