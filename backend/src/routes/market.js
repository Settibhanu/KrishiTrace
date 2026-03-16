const express = require('express');
const { auth } = require('../middleware/auth');
const { getMarketAnalysis, answerMarketQuestion } = require('../utils/marketData');

const router = express.Router();

// GET /api/market/analysis?crop=tomato&quantity=50&unit=kg
router.get('/analysis', auth, (req, res) => {
  const { crop, quantity, unit } = req.query;
  if (!crop) return res.status(400).json({ message: 'crop query param required' });
  const analysis = getMarketAnalysis(crop, quantity ? parseFloat(quantity) : null, unit || 'kg');
  res.json(analysis);
});

// POST /api/market/ask
router.post('/ask', auth, (req, res) => {
  const { question, cropContext } = req.body;
  if (!question) return res.status(400).json({ message: 'question is required' });
  const result = answerMarketQuestion(question, cropContext);
  res.json(result);
});

module.exports = router;
