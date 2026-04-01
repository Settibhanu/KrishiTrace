const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const harvestRoutes = require('./routes/harvest');
const ledgerRoutes = require('./routes/ledger');
const qrRoutes = require('./routes/qr');
const gisRoutes = require('./routes/gis');
const iotRoutes = require('./routes/iot');
const reportRoutes = require('./routes/reports');
const marketRoutes = require('./routes/market');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/market', marketRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Krishi-Trace AI' }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/krishi_trace';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`MongoDB connected to: ${MONGO_URI}`);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
