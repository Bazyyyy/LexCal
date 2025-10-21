const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  title: { type: String, default: '' },
  status: { type: String, default: 'booked' },
  location: { type: String, default: '' },
  duration: { type: Number },
  participants: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
