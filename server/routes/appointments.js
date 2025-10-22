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
    const { lawyerId, clientId, date, title, location, duration, participants, status } = req.body;
    const appointment = await Appointment.create({
      lawyerId,
      clientId,
      date: date ? new Date(date) : new Date(),
      title: title || '',
      location: location || '',
      duration: duration ? Number(duration) : 60,
      participants: Array.isArray(participants) ? participants : (participants ? [participants] : []),
      status: status || 'confirmed' // Anwälte erstellen standardmäßig bestätigte Termine
    });
    
    const populated = await Appointment.findById(appointment._id).populate('lawyerId clientId', 'name email');
    return res.status(201).json(populated);
  } catch (err) {
    console.error('Create appointment error', err);
    return res.status(500).json({ error: 'Could not create appointment', details: err.message });
  }
});

// POST /api/appointments/request - Client sendet Anfrage
router.post('/request', async (req, res) => {
  try {
    const { lawyerId, clientId, date, title, location, duration, participants, requestMessage } = req.body;
    
    // prüfe, ob Slot bereits belegt
    const existing = await Appointment.findOne({
      lawyerId,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Slot bereits belegt oder angefragt' });
    }

    const appointment = await Appointment.create({
      lawyerId,
      clientId,
      date: new Date(date),
      title: title || '',
      location: location || '',
      duration: Number(duration) || 60,
      participants: Array.isArray(participants) ? participants : [],
      status: 'pending',
      requestMessage: requestMessage || '',
      requestedAt: new Date()
    });

    const populated = await Appointment.findById(appointment._id).populate('lawyerId clientId', 'name email');
    return res.status(201).json(populated);
  } catch (err) {
    console.error('Create request error', err);
    return res.status(500).json({ error: 'Could not create request' });
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

// GET /api/appointments/:userId/pending - hole offene Anfragen für Anwalt
router.get('/:userId/pending', async (req, res) => {
  try {
    const pending = await Appointment.find({
      lawyerId: req.params.userId,
      status: 'pending'
    }).populate('clientId', 'name email').sort({ requestedAt: -1 });
    return res.json(pending);
  } catch (err) {
    console.error('Fetch pending requests error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/appointments/lawyer/:lawyerId -> alle Termine eines Anwalts (für Mandanten zum Anzeigen belegter Slots)
router.get('/lawyer/:lawyerId', async (req, res) => {
  try {
    const lawyerId = req.params.lawyerId;
    const appointments = await Appointment.find({ 
      lawyerId,
      status: { $in: ['confirmed', 'pending'] } // nur bestätigte und offene Anfragen
    }).populate('lawyerId clientId', 'name email');
    
    // Für Mandanten: entferne sensible Daten
    const sanitized = appointments.map(app => ({
      _id: app._id,
      date: app.date,
      duration: app.duration,
      status: app.status,
      lawyerId: app.lawyerId
    }));
    
    res.json(sanitized);
  } catch (err) {
    console.error('Fetch lawyer appointments error', err);
    res.status(500).json({ error: 'Server error' });
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

// PATCH /api/appointments/:id/respond - Anwalt bestätigt/lehnt ab
router.patch('/:id/respond', async (req, res) => {
  try {
    const { status, responseMessage } = req.body; // status: 'confirmed' oder 'rejected'
    
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be confirmed or rejected' });
    }

    const app = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        responseMessage: responseMessage || '',
        respondedAt: new Date()
      },
      { new: true }
    ).populate('lawyerId clientId', 'name email');

    if (!app) return res.status(404).json({ error: 'Appointment not found' });
    return res.json(app);
  } catch (err) {
    console.error('Respond to request error', err);
    return res.status(500).json({ error: 'Could not respond to request' });
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
