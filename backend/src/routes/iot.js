const express = require('express');
const { auth } = require('../middleware/auth');
const IoTReading = require('../models/IoTReading');
const Shipment = require('../models/Shipment');
const FairPriceConfig = require('../models/FairPriceConfig');
const SupplyChainRecord = require('../models/SupplyChainRecord');

const router = express.Router();

// POST /api/iot/readings — ingest a sensor reading
router.post('/readings', async (req, res) => {
  try {
    const { shipmentId, temperature, humidity } = req.body;
    if (!shipmentId || temperature == null || humidity == null) {
      return res.status(400).json({ message: 'shipmentId, temperature, humidity are required' });
    }

    const shipment = await Shipment.findById(shipmentId).populate({
      path: 'recordIds',
      select: 'cropType',
    });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    // Determine crop type for threshold lookup
    const cropType = shipment.recordIds?.[0]?.cropType?.toLowerCase() || 'default';
    const config = await FairPriceConfig.findOne({ cropType }) ||
      { safeTemperatureMin: 2, safeTemperatureMax: 25, safeHumidityMin: 60, safeHumidityMax: 95 };

    let alert = false;
    let alertType = null;
    let alertMessage = '';

    if (temperature < config.safeTemperatureMin || temperature > config.safeTemperatureMax) {
      alert = true;
      alertType = 'temperature';
      alertMessage = `Temperature ${temperature}°C is outside safe range (${config.safeTemperatureMin}–${config.safeTemperatureMax}°C)`;
    } else if (humidity < config.safeHumidityMin || humidity > config.safeHumidityMax) {
      alert = true;
      alertType = 'humidity';
      alertMessage = `Humidity ${humidity}% is outside safe range (${config.safeHumidityMin}–${config.safeHumidityMax}%)`;
    }

    const reading = new IoTReading({
      shipmentId,
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      alert,
      alertType,
      alertMessage,
    });
    await reading.save();

    res.status(201).json({ reading, alert, alertMessage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/iot/readings/:shipmentId — time-series data for a shipment
router.get('/readings/:shipmentId', auth, async (req, res) => {
  try {
    const readings = await IoTReading.find({ shipmentId: req.params.shipmentId })
      .sort({ timestamp: 1 })
      .limit(200);
    res.json(readings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/iot/alerts — active alerts across all shipments
router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = await IoTReading.find({ alert: true })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('shipmentId', 'shipmentId status');
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/iot/simulate/:shipmentId — generate fake sensor data for demo
router.post('/simulate/:shipmentId', auth, async (req, res) => {
  try {
    const readings = [];
    const now = Date.now();
    for (let i = 0; i < 20; i++) {
      const temp = parseFloat((15 + Math.random() * 15).toFixed(1));
      const hum = parseFloat((65 + Math.random() * 20).toFixed(1));
      readings.push({
        shipmentId: req.params.shipmentId,
        temperature: temp,
        humidity: hum,
        timestamp: new Date(now - (20 - i) * 5 * 60 * 1000), // every 5 min
        alert: temp > 28 || hum > 90,
        alertType: temp > 28 ? 'temperature' : hum > 90 ? 'humidity' : null,
        alertMessage: temp > 28 ? `High temp: ${temp}°C` : hum > 90 ? `High humidity: ${hum}%` : '',
      });
    }
    await IoTReading.insertMany(readings);
    res.json({ inserted: readings.length, readings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
