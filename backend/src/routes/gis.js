const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { auth, requireRole } = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const SupplyChainRecord = require('../models/SupplyChainRecord');
const { computeRoute, haversineDistance, estimateETA, checkDeviation } = require('../utils/routeOptimizer');

const router = express.Router();

// POST /api/gis/shipments — create a new shipment
router.post('/shipments', auth, requireRole('operator', 'farmer', 'fpo_admin'), async (req, res) => {
  try {
    const { recordIds, originLng, originLat, originAddress, destLng, destLat, destAddress } = req.body;

    const origin = [parseFloat(originLng), parseFloat(originLat)];
    const destination = [parseFloat(destLng), parseFloat(destLat)];
    const plannedRoute = computeRoute(origin, destination);
    const distKm = haversineDistance(origin, destination);
    const eta = estimateETA(distKm);

    const shipment = new Shipment({
      shipmentId: uuidv4(),
      recordIds: recordIds || [],
      operatorId: req.user.id,
      origin: { coordinates: origin, address: originAddress || '' },
      destination: { coordinates: destination, address: destAddress || '' },
      plannedRoute,
      currentLocation: origin,
      eta,
      etaUpdatedAt: new Date(),
      status: 'pending',
    });
    await shipment.save();

    // Link records to shipment
    if (recordIds && recordIds.length > 0) {
      await SupplyChainRecord.updateMany(
        { _id: { $in: recordIds } },
        { shipmentId: shipment._id, status: 'in_transit' }
      );
    }

    res.status(201).json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gis/shipments — list all active shipments
router.get('/shipments', auth, async (req, res) => {
  try {
    const shipments = await Shipment.find({ status: { $in: ['pending', 'in_transit', 'delayed'] } })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gis/shipments/:id
router.get('/shipments/:id', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate('recordIds');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/gis/shipments/:id/location — update GPS location
router.patch('/shipments/:id/location', auth, async (req, res) => {
  try {
    const { lng, lat } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const currentCoords = [parseFloat(lng), parseFloat(lat)];
    const { deviated, minDistKm } = checkDeviation(currentCoords, shipment.plannedRoute);

    // Append to actual path
    shipment.actualPath.push({ coordinates: currentCoords, timestamp: new Date() });
    shipment.currentLocation = currentCoords;
    shipment.deviationAlert = deviated;
    shipment.deviationKm = minDistKm;

    // Recalculate ETA
    const distToDestKm = haversineDistance(currentCoords, shipment.destination.coordinates);
    shipment.eta = estimateETA(distToDestKm);
    shipment.etaUpdatedAt = new Date();

    if (deviated) shipment.status = 'delayed';
    await shipment.save();

    res.json({ shipment, deviationAlert: deviated, deviationKm: minDistKm });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/gis/shipments/:id/deliver
router.patch('/shipments/:id/deliver', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status: 'delivered', deliveredAt: new Date() },
      { new: true }
    );
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    await SupplyChainRecord.updateMany(
      { _id: { $in: shipment.recordIds } },
      { status: 'delivered' }
    );

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
