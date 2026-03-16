const mongoose = require('mongoose');

// Minimum support price per crop type (₹/kg)
const fairPriceConfigSchema = new mongoose.Schema(
  {
    cropType: { type: String, required: true, unique: true, lowercase: true },
    minFarmerPayout: { type: Number, required: true }, // ₹/kg
    safeTemperatureMin: { type: Number, default: 2 }, // Celsius
    safeTemperatureMax: { type: Number, default: 25 }, // Celsius
    safeHumidityMin: { type: Number, default: 60 }, // %
    safeHumidityMax: { type: Number, default: 95 }, // %
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FairPriceConfig', fairPriceConfigSchema);
