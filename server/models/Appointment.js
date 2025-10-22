const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  title: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['available', 'pending', 'confirmed', 'rejected', 'cancelled'],
    default: 'available' 
  },
  location: { type: String, default: '' },
  duration: { type: Number, default: 60 },
  participants: [{ type: String }],
  // für Anfragen
  requestMessage: { type: String, default: '' },
  responseMessage: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
