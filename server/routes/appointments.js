const express = require('express');
const Appointment = require('../models/Appointment');
const router = express.Router();

// Debug-Log für alle Requests in dieser Route
router.use((req, res, next) => {
  console.log(`[APPT ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { lawyerId, clientId, date, location, duration, participants } = req.body;
    const appointment = await Appointment.create({
      lawyerId,
      clientId,
      date,
      location: location || '',
      duration: duration ? Number(duration) : undefined,
      participants: Array.isArray(participants) ? participants : (participants ? participants : []),
      status: 'booked'
    });
    return res.status(201).json(appointment);
  } catch (err) {
    console.error('Create appointment error', err);
    return res.status(500).json({ error: 'Could not create appointment' });
  }
});

// GET /api/appointments/:userId
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const appointments = await Appointment.find({
      $or: [{ lawyerId: userId }, { clientId: userId }]
    }).populate('lawyerId clientId', 'name email');
    return res.json(appointments);
  } catch (err) {
    console.error('Fetch appointments error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/appointments/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    console.log('[API] PATCH cancel ->', req.params.id);
    const app = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('lawyerId clientId', 'name email');
    if (!app) {
      console.log('[API] appointment not found:', req.params.id);
      return res.status(404).json({ error: 'Appointment not found' });
    }
    return res.json(app);
  } catch (err) {
    console.error('Cancel appointment error', err);
    return res.status(500).json({ error: 'Could not cancel appointment' });
  }
});

module.exports = router;
