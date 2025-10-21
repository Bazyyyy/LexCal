// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.originalUrl);
  next();
});

// Mongo verbinden
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lexcal';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected', mongoUri))
  .catch(err => console.error('Mongo connection error', err));

// Routes (stelle sicher, dass die Dateien existieren)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const appointmentRoutes = require('./routes/appointments');
app.use('/api/appointments', appointmentRoutes);

const lawyersRoutes = require('./routes/Lawyers');
app.use('/api/lawyers', lawyersRoutes);

// Health
app.get('/', (req, res) => res.send('LexCal backend running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
