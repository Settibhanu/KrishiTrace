const express = require('express');
const { auth } = require('../middleware/auth');
const SupplyChainRecord = require('../models/SupplyChainRecord');
const { getRecordFromChain } = require('../utils/blockchain');

const router = express.Router();

// GET /api/ledger — paginated ledger entries
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = req.user.role === 'farmer' ? { farmerId: req.user.id } : {};
    const [records, total] = await Promise.all([
      SupplyChainRecord.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SupplyChainRecord.countDocuments(filter),
    ]);

    res.json({ records, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ledger/:txHash — verify a transaction on chain
router.get('/tx/:txHash', async (req, res) => {
  try {
    const record = await SupplyChainRecord.findOne({ txHash: req.params.txHash });
    if (!record) return res.status(404).json({ message: 'Transaction not found' });

    const chainData = await getRecordFromChain(req.params.txHash);
    res.json({ record, chainVerification: chainData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
