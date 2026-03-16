const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { auth, requireRole } = require('../middleware/auth');
const SupplyChainRecord = require('../models/SupplyChainRecord');
const FairPriceConfig = require('../models/FairPriceConfig');
const User = require('../models/User');
const { writeToLedger, verifyFairPrice } = require('../utils/blockchain');
const { parseHarvestTranscript } = require('../utils/voiceParser');

const router = express.Router();

// POST /api/harvest/voice — parse voice transcript and log harvest
router.post('/voice', auth, requireRole('farmer'), async (req, res) => {
  try {
    const { transcript, language } = req.body;
    if (!transcript) return res.status(400).json({ message: 'transcript is required' });

    const parsed = parseHarvestTranscript(transcript);
    if (!parsed.cropType || !parsed.quantity) {
      return res.status(422).json({
        message: 'Could not extract crop type or quantity from transcript',
        parsed,
        requiresRetry: true,
      });
    }

    res.json({ parsed, transcript, language: language || 'en' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/harvest — create a new supply chain record
router.post('/', auth, requireRole('farmer'), async (req, res) => {
  try {
    const {
      cropType, quantity, unit, harvestDate,
      farmerPayout, transportCost, handlingCost, finalConsumerPrice,
      voiceTranscript, language,
    } = req.body;

    if (!cropType || !quantity || !farmerPayout || !finalConsumerPrice) {
      return res.status(400).json({ message: 'cropType, quantity, farmerPayout, finalConsumerPrice are required' });
    }

    const farmer = await User.findById(req.user.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });

    // Check fair price compliance
    const config = await FairPriceConfig.findOne({ cropType: cropType.toLowerCase() });
    const minPayout = config ? config.minFarmerPayout : 0;
    const fairPriceCompliant = verifyFairPrice(farmerPayout, minPayout);

    const recordId = uuidv4();
    const payoutBreakdown = {
      farmerPayout: parseFloat(farmerPayout),
      transportCost: parseFloat(transportCost) || 0,
      handlingCost: parseFloat(handlingCost) || 0,
      finalConsumerPrice: parseFloat(finalConsumerPrice),
    };

    // Write to simulated blockchain
    const { txHash, blockNumber } = await writeToLedger({
      recordId, farmerId: req.user.id, cropType, quantity, payoutBreakdown,
    });

    // Generate QR code
    const qrData = JSON.stringify({ recordId, txHash, cropType });
    const qrCode = await QRCode.toDataURL(qrData);

    const record = new SupplyChainRecord({
      recordId,
      farmerId: req.user.id,
      farmerName: farmer.name,
      farmLocation: farmer.farmLocation,
      farmAddress: farmer.farmAddress,
      cropType,
      quantity: parseFloat(quantity),
      unit: unit || 'kg',
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      payoutBreakdown,
      txHash,
      blockNumber,
      qrCode,
      fairPriceCompliant,
      voiceTranscript: voiceTranscript || '',
      language: language || 'en',
    });

    await record.save();

    res.status(201).json({
      record,
      fairPriceCompliant,
      violation: !fairPriceCompliant ? `Payout ₹${farmerPayout}/kg is below minimum ₹${minPayout}/kg` : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/harvest — list farmer's own records
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'farmer' ? { farmerId: req.user.id } : {};
    const records = await SupplyChainRecord.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/harvest/:recordId
router.get('/:recordId', async (req, res) => {
  try {
    const record = await SupplyChainRecord.findOne({ recordId: req.params.recordId });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
