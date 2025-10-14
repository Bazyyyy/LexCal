const express = require('express');
const Appointment = require('../models/Appointment');
const router = express.Router();

// Termin buchen
router.post('/', async (req, res) => {
  const { lawyerId, clientId, date } = req.body;
  try {
    const appointment = await Appointment.create({ lawyerId, clientId, date });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Termine eines Nutzers abrufen
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;
  const appointments = await Appointment.find({
    $or: [{ lawyerId: userId }, { clientId: userId }]
  }).populate('lawyerId clientId', 'name email');
  res.json(appointments);
});

module.exports = router;
