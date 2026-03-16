const mongoose = require('mongoose');

const payoutBreakdownSchema = new mongoose.Schema(
  {
    farmerPayout: { type: Number, required: true }, // ₹/kg
    transportCost: { type: Number, default: 0 },
    handlingCost: { type: Number, default: 0 },
    finalConsumerPrice: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },
  { _id: false }
);

const supplyChainRecordSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, unique: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmerName: { type: String, required: true },
    farmLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    farmAddress: { type: String, default: '' },
    cropType: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    harvestDate: { type: Date, default: Date.now },
    payoutBreakdown: { type: payoutBreakdownSchema, required: true },
    txHash: { type: String, default: null }, // blockchain tx hash
    blockNumber: { type: Number, default: null },
    qrCode: { type: String, default: null }, // base64 QR image
    status: {
      type: String,
      enum: ['harvested', 'in_transit', 'delivered', 'sold'],
      default: 'harvested',
    },
    fairPriceCompliant: { type: Boolean, default: true },
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null },
    voiceTranscript: { type: String, default: '' },
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

supplyChainRecordSchema.index({ farmLocation: '2dsphere' });

module.exports = mongoose.model('SupplyChainRecord', supplyChainRecordSchema);
