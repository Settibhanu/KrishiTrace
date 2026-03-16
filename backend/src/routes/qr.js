const express = require('express');
const SupplyChainRecord = require('../models/SupplyChainRecord');

const router = express.Router();

// GET /api/qr/:recordId — public QR scan endpoint (no auth required)
router.get('/:recordId', async (req, res) => {
  try {
    const record = await SupplyChainRecord.findOne({ recordId: req.params.recordId })
      .populate('farmerId', 'name mobile farmAddress');

    if (!record) {
      return res.status(404).json({
        verified: false,
        message: 'Product could not be verified. No record found for this QR code.',
      });
    }

    res.json({
      verified: true,
      recordId: record.recordId,
      txHash: record.txHash,
      blockNumber: record.blockNumber,
      farmerName: record.farmerName,
      farmAddress: record.farmAddress,
      farmLocation: record.farmLocation,
      cropType: record.cropType,
      quantity: record.quantity,
      unit: record.unit,
      harvestDate: record.harvestDate,
      status: record.status,
      fairPriceCompliant: record.fairPriceCompliant,
      payoutBreakdown: record.payoutBreakdown,
      scannedAt: new Date(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
