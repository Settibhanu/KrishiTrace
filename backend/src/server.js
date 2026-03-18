/**
 * Krishi-Trace AI — Express server entry point.
 *
 * Deployment notes:
 *  - Local dev  : MongoDB + app.listen() on PORT (default 5000)
 *  - Vercel     : Vercel sets VERCEL=1 automatically; app.listen() is skipped
 *                 and the module export is used as a serverless handler instead.
 *
 * Environment variables (see .env.example):
 *  PORT          TCP port for local dev (ignored by Vercel)
 *  MONGO_URI     MongoDB connection string (Atlas recommended for production)
 *  JWT_SECRET    Secret for signing JWTs
 *  FRONTEND_URL  Comma-separated allowed CORS origins (production only)
 *  VERCEL        Set automatically by Vercel — do NOT set manually
 */

'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// ── Route modules ──────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const harvestRoutes = require('./routes/harvest');
const ledgerRoutes = require('./routes/ledger');
const qrRoutes = require('./routes/qr');
const gisRoutes = require('./routes/gis');
const iotRoutes = require('./routes/iot');
const reportRoutes = require('./routes/reports');
const marketRoutes = require('./routes/market');

// ── App setup ──────────────────────────────────────────────────────────────────
const app = express();

/**
 * CORS configuration.
 * In production (FRONTEND_URL is set), only the listed origins are allowed.
 * In development (no FRONTEND_URL), all origins are permitted for convenience.
 */
const corsOptions = process.env.FRONTEND_URL
  ? {
      origin: process.env.FRONTEND_URL.split(',').map((o) => o.trim()),
      credentials: true,
    }
  : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/gis', gisRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/market', marketRoutes);

/** Health-check endpoint — used by Vercel and uptime monitors. */
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'Krishi-Trace AI', timestamp: new Date().toISOString() })
);

// ── Database + server start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/krishi_trace';

/**
 * Connect to MongoDB.
 * On Vercel, the connection is established on the first request and reused
 * across warm invocations (connection pooling via Mongoose).
 * On local dev, the server starts listening only after a successful connection.
 */
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    // Only call app.listen() in non-serverless environments.
    // Vercel sets process.env.VERCEL = "1" automatically.
    if (!process.env.VERCEL) {
      app.listen(PORT, () =>
        console.log(`Server running on http://localhost:${PORT}`)
      );
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    // In serverless environments, don't exit the process — let the request fail gracefully.
    if (!process.env.VERCEL) process.exit(1);
  });

// Export the Express app so Vercel can use it as a serverless handler.
module.exports = app;
