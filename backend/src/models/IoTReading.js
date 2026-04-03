const mongoose = require('mongoose');

const iotReadingSchema = new mongoose.Schema(
  {
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
    temperature: { type: Number, required: false }, // Celsius (Optional for hardware resilience)
    humidity: { type: Number, required: false }, // percentage (Optional)
    animalDetected: { type: Boolean, default: false }, // Ultrasonic Intrusion detector
    timestamp: { type: Date, default: Date.now },
    alert: { type: Boolean, default: false },
    alertType: { type: String, enum: ['temperature', 'humidity', 'intrusion', 'connectivity', null], default: null },
    alertMessage: { type: String, default: '' },
  },
  { timestamps: false }
);

iotReadingSchema.index({ shipmentId: 1, timestamp: -1 });

module.exports = mongoose.model('IoTReading', iotReadingSchema);
