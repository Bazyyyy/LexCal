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
    const { lawyerId, clientId, date, title, location, duration, participants } = req.body;
    const appointment = await Appointment.create({
      lawyerId,
      clientId,
      date: date ? new Date(date) : new Date(),
      title: title || '',
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

// PATCH /api/appointments/:id  (update appointment fields)
router.patch('/:id', async (req, res) => {
  try {
    console.log('[API] PATCH update ->', req.params.id, req.body);
    const allowed = ['date', 'title', 'location', 'duration', 'participants', 'status', 'lawyerId', 'clientId'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.date) update.date = new Date(update.date);
    const app = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true }).populate('lawyerId clientId', 'name email');
    if (!app) return res.status(404).json({ error: 'Appointment not found' });
    return res.json(app);
  } catch (err) {
    console.error('Update appointment error', err);
    return res.status(500).json({ error: 'Could not update appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    console.log('[API] DELETE ->', req.params.id);
    const app = await Appointment.findByIdAndDelete(req.params.id);
    if (!app) return res.status(404).json({ error: 'Appointment not found' });
    return res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Delete appointment error', err);
    return res.status(500).json({ error: 'Could not delete appointment' });
  }
});

module.exports = router;
