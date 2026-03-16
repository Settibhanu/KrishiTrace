/**
 * Voice transcript parser — extracts all harvest fields from natural language.
 */

const CROP_ALIASES = {
  tomato: 'Tomato', tomatoes: 'Tomato',
  potato: 'Potato', potatoes: 'Potato',
  onion: 'Onion', onions: 'Onion',
  rice: 'Rice', wheat: 'Wheat',
  corn: 'Corn', maize: 'Corn',
  mango: 'Mango', mangoes: 'Mango',
  banana: 'Banana', bananas: 'Banana',
  jackfruit: 'Jackfruit', sugarcane: 'Sugarcane',
  cotton: 'Cotton', soybean: 'Soybean',
  groundnut: 'Groundnut', chilli: 'Chilli',
  // Hindi
  tamatar: 'Tomato', aloo: 'Potato', pyaz: 'Onion',
  chawal: 'Rice', gehu: 'Wheat', makka: 'Corn',
  aam: 'Mango', kela: 'Banana',
  // Kannada
  eerulli: 'Onion', akki: 'Rice', godhi: 'Wheat',
  // Telugu
  bangaladumpa: 'Potato', ullipaya: 'Onion', biyyam: 'Rice', goduma: 'Wheat',
  // Tamil
  thakkali: 'Tomato', urulaikizhangu: 'Potato',
  vengayam: 'Onion', arisi: 'Rice', godhumai: 'Wheat',
};

const UNIT_ALIASES = {
  kg: 'kg', kgs: 'kg', kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  quintal: 'quintal', quintals: 'quintal',
  ton: 'ton', tons: 'ton', tonne: 'ton', tonnes: 'ton',
  g: 'g', gram: 'g', grams: 'g',
};

const MONTH_MAP = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7,
  sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Extract a number that follows a given phrase pattern */
function extractNumberAfter(lower, patterns) {
  for (const pattern of patterns) {
    // Escape regex special chars in the phrase, then match optional "Rs/₹" before the number
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped + '[\\s:]*(?:rs\\.?|₹)?\\s*(\\d+(?:\\.\\d+)?)', 'i');
    const m = lower.match(re);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

/** Parse "15th February 2026" or "15 february 2026" → ISO date string */
function parseSpokenDate(lower) {
  // Build ISO string directly to avoid UTC timezone shift
  const toISO = (day, month, year) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Match: <day> <month> <year>
  const re = /(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})/i;
  const m = lower.match(re);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = MONTH_MAP[m[2].toLowerCase()];
    const year = parseInt(m[3], 10);
    if (month !== undefined && day >= 1 && day <= 31) {
      return toISO(day, month, year);
    }
  }
  // Match: <month> <day> <year>
  const re2 = /([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(\d{4})/i;
  const m2 = lower.match(re2);
  if (m2) {
    const month = MONTH_MAP[m2[1].toLowerCase()];
    const day = parseInt(m2[2], 10);
    const year = parseInt(m2[3], 10);
    if (month !== undefined) {
      return toISO(day, month, year);
    }
  }
  return null;
}

/**
 * Parse a voice transcript and extract all harvest fields.
 */
function parseHarvestTranscript(transcript) {
  if (!transcript) return { cropType: null, quantity: null, unit: 'kg', confidence: 0 };

  const lower = transcript.toLowerCase().replace(/[,।]/g, ' ');
  const tokens = lower.split(/\s+/);

  // --- Crop type ---
  let cropType = null;

  // Try "crop type is X" or "crop is X" first
  const cropPhraseMatch = lower.match(/crop(?:\s+type)?\s+is\s+([a-z]+)/i);
  if (cropPhraseMatch) {
    const word = cropPhraseMatch[1].toLowerCase();
    cropType = CROP_ALIASES[word] || (word.charAt(0).toUpperCase() + word.slice(1));
  }

  // Fallback: scan tokens against alias map
  if (!cropType) {
    for (const token of tokens) {
      if (CROP_ALIASES[token]) { cropType = CROP_ALIASES[token]; break; }
    }
  }
  if (!cropType) {
    for (const [alias, crop] of Object.entries(CROP_ALIASES)) {
      if (lower.includes(alias)) { cropType = crop; break; }
    }
  }

  // --- Quantity & unit ---
  let quantity = null;
  let unit = 'kg';

  // Look for "<number> <unit>" pattern
  const qtyUnitMatch = lower.match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|quintal|quintals|ton|tons|tonne|tonnes|gram|grams|g)\b/i);
  if (qtyUnitMatch) {
    quantity = parseFloat(qtyUnitMatch[1]);
    unit = UNIT_ALIASES[qtyUnitMatch[2].toLowerCase()] || 'kg';
  } else {
    // Fallback: first standalone number
    for (const token of tokens) {
      const num = parseFloat(token.replace(/[^\d.]/g, ''));
      if (!isNaN(num) && num > 0) { quantity = num; break; }
    }
    for (const token of tokens) {
      if (UNIT_ALIASES[token]) { unit = UNIT_ALIASES[token]; break; }
    }
  }

  // --- Farmer payout ---
  const farmerPayout = extractNumberAfter(lower, [
    'farmer payout per kg is', 'farmer payout per kg', 'farmer payout is', 'farmer payout', 'payout is', 'farmer price is',
  ]);

  // --- Transport cost ---
  const transportCost = extractNumberAfter(lower, [
    'transport charge is', 'transport charge', 'transport cost is', 'transport cost', 'transport is', 'transportation cost is',
  ]);

  // --- Final consumer price ---
  const finalConsumerPrice = extractNumberAfter(lower, [
    'final consumer price is', 'consumer price is', 'final price is', 'final consumer price',
  ]);

  // --- Harvest date ---
  let harvestDate = null;
  const datePhraseMatch = lower.match(/harvest date is\s+(.+)/i);
  if (datePhraseMatch) {
    harvestDate = parseSpokenDate(datePhraseMatch[1]);
  }
  if (!harvestDate) harvestDate = parseSpokenDate(lower);

  const confidence = cropType && quantity ? 0.9 : cropType || quantity ? 0.5 : 0.1;

  return { cropType, quantity, unit, farmerPayout, transportCost, finalConsumerPrice, harvestDate, confidence };
}

module.exports = { parseHarvestTranscript };
