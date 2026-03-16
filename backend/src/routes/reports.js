const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const SupplyChainRecord = require('../models/SupplyChainRecord');
const FairPriceConfig = require('../models/FairPriceConfig');

const router = express.Router();

// GET /api/reports/summary — FPO admin dashboard summary
router.get('/summary', auth, requireRole('fpo_admin', 'operator'), async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const filter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [total, compliant, violations, bycrops] = await Promise.all([
      SupplyChainRecord.countDocuments(filter),
      SupplyChainRecord.countDocuments({ ...filter, fairPriceCompliant: true }),
      SupplyChainRecord.find({ ...filter, fairPriceCompliant: false })
        .select('farmerName cropType payoutBreakdown createdAt txHash')
        .sort({ createdAt: -1 })
        .limit(100),
      SupplyChainRecord.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$cropType',
            avgPayout: { $avg: '$payoutBreakdown.farmerPayout' },
            totalQuantity: { $sum: '$quantity' },
            count: { $sum: 1 },
            compliantCount: { $sum: { $cond: ['$fairPriceCompliant', 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      total,
      compliant,
      violations: total - compliant,
      complianceRate: total > 0 ? ((compliant / total) * 100).toFixed(1) : '0',
      violationsList: violations,
      byCrop: bycrops,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/trends — payout trends over time
router.get('/trends', auth, requireRole('fpo_admin', 'operator'), async (req, res) => {
  try {
    const trends = await SupplyChainRecord.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            cropType: '$cropType',
          },
          avgPayout: { $avg: '$payoutBreakdown.farmerPayout' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/fair-prices — list configured fair prices
router.get('/fair-prices', auth, async (req, res) => {
  try {
    const configs = await FairPriceConfig.find().sort({ cropType: 1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reports/fair-prices — set/update fair price for a crop
router.post('/fair-prices', auth, requireRole('fpo_admin'), async (req, res) => {
  try {
    const { cropType, minFarmerPayout, safeTemperatureMin, safeTemperatureMax, safeHumidityMin, safeHumidityMax } = req.body;
    if (!cropType || !minFarmerPayout) return res.status(400).json({ message: 'cropType and minFarmerPayout required' });

    const config = await FairPriceConfig.findOneAndUpdate(
      { cropType: cropType.toLowerCase() },
      { minFarmerPayout, safeTemperatureMin, safeTemperatureMax, safeHumidityMin, safeHumidityMax, updatedBy: req.user.id },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
