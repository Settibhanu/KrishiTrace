/**
 * Blockchain utility — simulates Ethereum smart contract interactions.
 * In production, replace with actual ethers.js calls to a deployed contract.
 */
const crypto = require('crypto');

/**
 * Simulate writing a supply chain record to the blockchain.
 * Returns a fake transaction hash and block number.
 */
async function writeToLedger(recordData) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 200));

  const payload = JSON.stringify(recordData);
  const txHash =
    '0x' + crypto.createHash('sha256').update(payload + Date.now()).digest('hex');
  const blockNumber = Math.floor(Math.random() * 1000000) + 18000000;

  return { txHash, blockNumber, success: true };
}

/**
 * Verify fair price compliance.
 * Returns true if farmerPayout >= minFarmerPayout for the crop.
 */
function verifyFairPrice(farmerPayout, minFarmerPayout) {
  return farmerPayout >= minFarmerPayout;
}

/**
 * Simulate fetching a record from the blockchain by txHash.
 */
async function getRecordFromChain(txHash) {
  await new Promise((r) => setTimeout(r, 100));
  return { txHash, verified: true, timestamp: Date.now() };
}

module.exports = { writeToLedger, verifyFairPrice, getRecordFromChain };
