const express = require('express');
const User = require('../models/User');
const router = express.Router();

// GET /api/lawyers -> listet alle Anwälte (id, name, email)
router.get('/', async (req, res) => {
  try {
    const lawyers = await User.find({ role: 'lawyer' }).select('_id name email');
    res.json(lawyers);
  } catch (err) {
    console.error('Error fetching lawyers', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
