
const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/', async (req, res) => {
  const lawyers = await User.find({ role: 'lawyer' }, 'name email');
  res.json(lawyers);
});

module.exports = router;
