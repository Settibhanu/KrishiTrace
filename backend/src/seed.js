/**
 * Seed script — populates the database with demo data.
 * Run: node src/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const FairPriceConfig = require('./models/FairPriceConfig');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/krishi_trace';

const CROPS = [
  { cropType: 'tomato', minFarmerPayout: 25, safeTemperatureMin: 10, safeTemperatureMax: 25, safeHumidityMin: 65, safeHumidityMax: 90 },
  { cropType: 'potato', minFarmerPayout: 15, safeTemperatureMin: 4, safeTemperatureMax: 12, safeHumidityMin: 85, safeHumidityMax: 95 },
  { cropType: 'onion', minFarmerPayout: 20, safeTemperatureMin: 0, safeTemperatureMax: 25, safeHumidityMin: 65, safeHumidityMax: 75 },
  { cropType: 'rice', minFarmerPayout: 22, safeTemperatureMin: 10, safeTemperatureMax: 30, safeHumidityMin: 60, safeHumidityMax: 80 },
  { cropType: 'wheat', minFarmerPayout: 20, safeTemperatureMin: 5, safeTemperatureMax: 25, safeHumidityMin: 60, safeHumidityMax: 75 },
  { cropType: 'mango', minFarmerPayout: 40, safeTemperatureMin: 8, safeTemperatureMax: 20, safeHumidityMin: 85, safeHumidityMax: 95 },
  { cropType: 'banana', minFarmerPayout: 18, safeTemperatureMin: 12, safeTemperatureMax: 22, safeHumidityMin: 85, safeHumidityMax: 95 },
];

const DEMO_USERS = [
  { name: 'Demo Farmer', mobile: '9000000001', password: 'demo1234', role: 'farmer', language: 'en', farmAddress: 'Kolar, Karnataka' },
  { name: 'Demo Operator', mobile: '9000000002', password: 'demo1234', role: 'operator', language: 'en', farmAddress: '' },
  { name: 'Demo FPO Admin', mobile: '9000000003', password: 'demo1234', role: 'fpo_admin', language: 'en', farmAddress: '' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  for (const crop of CROPS) {
    await FairPriceConfig.findOneAndUpdate({ cropType: crop.cropType }, crop, { upsert: true });
    console.log(`Seeded fair price config for ${crop.cropType}`);
  }

  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ mobile: u.mobile });
    if (!existing) {
      await new User(u).save(); // use .save() so bcrypt pre-save hook hashes the password
      console.log(`Created demo user: ${u.name} (${u.mobile}) — role: ${u.role}`);
    } else {
      console.log(`User already exists: ${u.mobile}`);
    }
  }

  console.log('\nDemo login credentials:');
  console.log('  Farmer   → mobile: 9000000001  password: demo1234');
  console.log('  Operator → mobile: 9000000002  password: demo1234');
  console.log('  FPO Admin→ mobile: 9000000003  password: demo1234');
  console.log('\nSeed complete');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
