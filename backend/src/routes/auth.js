const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, password, role, language, farmAddress, lat, lng } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ message: 'name, mobile, and password are required' });
    }
    const existing = await User.findOne({ mobile });
    if (existing) return res.status(409).json({ message: 'Mobile number already registered' });

    const user = new User({
      name,
      mobile,
      password,
      role: role || 'farmer',
      language: language || 'en',
      farmAddress: farmAddress || '',
      farmLocation: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
      },
    });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '24h',
    });
    res.status(201).json({ token, user: { id: user._id, name, mobile, role: user.role, language: user.language } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${remaining} minutes.` });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 3) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        user.loginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset on success
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '24h',
    });
    res.json({ token, user: { id: user._id, name: user.name, mobile, role: user.role, language: user.language } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -loginAttempts -lockUntil');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/language
router.patch('/language', auth, async (req, res) => {
  try {
    const { language } = req.body;
    const allowed = ['en', 'hi', 'kn', 'te', 'ta'];
    if (!allowed.includes(language)) return res.status(400).json({ message: 'Unsupported language' });
    await User.findByIdAndUpdate(req.user.id, { language });
    res.json({ message: 'Language updated', language });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { growingCrops, farmAddress } = req.body;
    const updates = {};
    if (growingCrops) updates.growingCrops = growingCrops;
    if (farmAddress) updates.farmAddress = farmAddress;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ message: 'Profile updated', user: { id: user._id, growingCrops: user.growingCrops } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
