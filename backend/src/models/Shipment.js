const mongoose = require('mongoose');

const waypointSchema = new mongoose.Schema(
  {
    coordinates: { type: [Number], required: true }, // [lng, lat]
    timestamp: { type: Date, default: Date.now },
    speed: { type: Number, default: 0 }, // km/h
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true, unique: true },
    recordIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SupplyChainRecord' }],
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    origin: {
      coordinates: { type: [Number], required: true },
      address: { type: String, default: '' },
    },
    destination: {
      coordinates: { type: [Number], required: true },
      address: { type: String, default: '' },
    },
    plannedRoute: { type: [[Number]], default: [] }, // array of [lng, lat]
    actualPath: { type: [waypointSchema], default: [] },
    currentLocation: { type: [Number], default: null }, // [lng, lat]
    eta: { type: Date, default: null },
    etaUpdatedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'delayed'],
      default: 'pending',
    },
    deviationAlert: { type: Boolean, default: false },
    deviationKm: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
