/**
 * Indian Crop Market Price Data & Analysis Engine
 * Based on Agmarknet / data.gov.in mandi price patterns (2023-2025)
 * MSP values from CACP (Commission for Agricultural Costs and Prices)
 */

// Monthly average wholesale prices (₹/kg) — Jan to Dec
// Source pattern: Agmarknet national average, major mandis
const CROP_MARKET_DATA = {
  tomato: {
    name: 'Tomato', emoji: '🍅',
    msp: 8, // No official MSP, floor price used
    monthlyPrices: [18, 22, 28, 35, 30, 20, 15, 12, 14, 18, 22, 20],
    peakMonths: [3, 4], // April-May
    lowMonths: [7, 8],  // Aug-Sep
    unit: 'kg',
    tip: 'Tomato prices peak in summer (Apr-May). Avoid selling in monsoon (Jul-Sep) when prices crash.',
  },
  potato: {
    name: 'Potato', emoji: '🥔',
    msp: 6,
    monthlyPrices: [12, 10, 8, 9, 11, 14, 16, 15, 13, 11, 10, 11],
    peakMonths: [6, 7],
    lowMonths: [2, 3],
    unit: 'kg',
    tip: 'Potato prices are highest in monsoon. Cold storage can help you sell at better prices.',
  },
  onion: {
    name: 'Onion', emoji: '🧅',
    msp: 8,
    monthlyPrices: [20, 18, 15, 12, 14, 25, 40, 35, 28, 22, 18, 20],
    peakMonths: [6, 7],
    lowMonths: [3, 4],
    unit: 'kg',
    tip: 'Onion prices spike in monsoon due to supply shortage. Store if possible and sell Jun-Aug.',
  },
  rice: {
    name: 'Rice', emoji: '🌾',
    msp: 21.83, // Kharif 2024-25 MSP ₹2183/quintal = ₹21.83/kg
    monthlyPrices: [22, 22, 23, 23, 24, 24, 25, 26, 28, 30, 28, 25],
    peakMonths: [9, 10],
    lowMonths: [0, 1],
    unit: 'kg',
    tip: 'Rice MSP is ₹21.83/kg. Sell post-harvest (Oct-Nov) when demand from traders is highest.',
  },
  wheat: {
    name: 'Wheat', emoji: '🌿',
    msp: 22.75, // Rabi 2024-25 MSP ₹2275/quintal
    monthlyPrices: [23, 23, 24, 26, 28, 27, 25, 24, 23, 23, 23, 23],
    peakMonths: [4, 5],
    lowMonths: [0, 1],
    unit: 'kg',
    tip: 'Wheat MSP is ₹22.75/kg. Sell in Apr-May post-harvest for best prices.',
  },
  maize: {
    name: 'Maize / Corn', emoji: '🌽',
    msp: 18.77,
    monthlyPrices: [19, 19, 20, 21, 22, 20, 18, 17, 18, 20, 21, 20],
    peakMonths: [4, 5],
    lowMonths: [7, 8],
    unit: 'kg',
    tip: 'Maize MSP is ₹18.77/kg. Poultry feed demand keeps prices stable most of the year.',
  },
  mango: {
    name: 'Mango', emoji: '🥭',
    msp: 0,
    monthlyPrices: [0, 0, 40, 60, 80, 70, 50, 30, 0, 0, 0, 0],
    peakMonths: [4, 5],
    lowMonths: [0, 1],
    unit: 'kg',
    tip: 'Mango season is Apr-Jul. Sell early in the season (Apr-May) for premium prices.',
  },
  banana: {
    name: 'Banana', emoji: '🍌',
    msp: 0,
    monthlyPrices: [18, 20, 22, 25, 28, 24, 20, 18, 16, 18, 20, 18],
    peakMonths: [4, 5],
    lowMonths: [8, 9],
    unit: 'kg',
    tip: 'Banana prices are highest in summer. Year-round crop but summer fetches 30% more.',
  },
  jackfruit: {
    name: 'Jackfruit', emoji: '🍈',
    msp: 0,
    monthlyPrices: [0, 0, 15, 20, 30, 35, 25, 15, 0, 0, 0, 0],
    peakMonths: [5, 6],
    lowMonths: [0, 1],
    unit: 'kg',
    tip: 'Jackfruit season is Mar-Jul. Peak prices in Jun. Value-added products (chips, curry) fetch 3x more.',
  },
  sugarcane: {
    name: 'Sugarcane', emoji: '🎋',
    msp: 3.40, // FRP 2024-25 ₹340/quintal
    monthlyPrices: [3.4, 3.4, 3.5, 3.5, 3.6, 3.6, 3.5, 3.5, 3.4, 3.4, 3.4, 3.4],
    peakMonths: [4, 5],
    lowMonths: [0, 1],
    unit: 'kg',
    tip: 'Sugarcane FRP (Fair & Remunerative Price) is ₹3.40/kg. Sell to registered sugar mills for guaranteed price.',
  },
  cotton: {
    name: 'Cotton', emoji: '☁️',
    msp: 67.20, // MSP 2024-25 medium staple ₹6720/quintal
    monthlyPrices: [68, 70, 72, 74, 75, 72, 68, 65, 67, 70, 72, 70],
    peakMonths: [4, 5],
    lowMonths: [7, 8],
    unit: 'kg',
    tip: 'Cotton MSP is ₹67.20/kg. Sell through CCI (Cotton Corporation of India) for MSP guarantee.',
  },
  soybean: {
    name: 'Soybean', emoji: '🫘',
    msp: 46.92,
    monthlyPrices: [47, 48, 49, 50, 51, 49, 47, 45, 46, 48, 50, 49],
    peakMonths: [4, 5],
    lowMonths: [7, 8],
    unit: 'kg',
    tip: 'Soybean MSP is ₹46.92/kg. Export demand from China affects prices significantly.',
  },
  groundnut: {
    name: 'Groundnut', emoji: '🥜',
    msp: 64.82,
    monthlyPrices: [65, 66, 67, 68, 70, 68, 65, 63, 64, 66, 68, 67],
    peakMonths: [4, 5],
    lowMonths: [7, 8],
    unit: 'kg',
    tip: 'Groundnut MSP is ₹64.82/kg. Oil extraction demand keeps prices stable.',
  },
  chilli: {
    name: 'Chilli', emoji: '🌶️',
    msp: 0,
    monthlyPrices: [80, 90, 100, 120, 130, 110, 90, 75, 70, 75, 80, 80],
    peakMonths: [4, 5],
    lowMonths: [8, 9],
    unit: 'kg',
    tip: 'Chilli prices peak in Apr-May. Dried chilli fetches 4-5x more than fresh. Consider drying before selling.',
  },
  pineapple: {
    name: 'Pineapple', emoji: '🍍',
    msp: 0,
    monthlyPrices: [25, 28, 35, 45, 50, 40, 30, 25, 22, 24, 26, 25],
    peakMonths: [4, 5],
    lowMonths: [8, 9],
    unit: 'kg',
    tip: 'Pineapple peaks in summer. Kerala and NE India varieties command premium in metro markets.',
  },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * Get market analysis for a crop
 */
function getMarketAnalysis(cropName, quantity = null, unit = 'kg') {
  const key = cropName.toLowerCase().replace(/\s+/g, '');
  const crop = CROP_MARKET_DATA[key] || CROP_MARKET_DATA[cropName.toLowerCase()];

  if (!crop) {
    // Generic fallback
    return {
      found: false,
      cropName,
      message: `Market data not available for "${cropName}". Please check with your local mandi or Agmarknet portal.`,
    };
  }

  const now = new Date();
  const month = now.getMonth(); // 0-11
  const currentPrice = crop.monthlyPrices[month];
  const nextMonth = (month + 1) % 12;
  const nextPrice = crop.monthlyPrices[nextMonth];
  const prevMonth = (month + 11) % 12;
  const prevPrice = crop.monthlyPrices[prevMonth];

  const trend = nextPrice > currentPrice ? 'rising' : nextPrice < currentPrice ? 'falling' : 'stable';
  const trendPct = currentPrice > 0 ? Math.round(((nextPrice - currentPrice) / currentPrice) * 100) : 0;

  // Recommended selling price = current market price * 0.75 (farmer gets ~75% of wholesale)
  const recommendedMin = Math.round(currentPrice * 0.70);
  const recommendedMax = Math.round(currentPrice * 0.82);

  // Best month to sell
  const peakPrice = Math.max(...crop.monthlyPrices.filter(p => p > 0));
  const peakMonthIdx = crop.monthlyPrices.indexOf(peakPrice);

  // Revenue estimate
  let revenueEstimate = null;
  if (quantity) {
    const qtyKg = unit === 'quintal' ? quantity * 100 : unit === 'ton' ? quantity * 1000 : quantity;
    revenueEstimate = {
      min: Math.round(qtyKg * recommendedMin),
      max: Math.round(qtyKg * recommendedMax),
      atMSP: crop.msp > 0 ? Math.round(qtyKg * crop.msp) : null,
    };
  }

  return {
    found: true,
    cropName: crop.name,
    emoji: crop.emoji,
    currentPrice,
    previousPrice: prevPrice,
    nextMonthPrice: nextPrice,
    trend,
    trendPercent: trendPct,
    recommendedMin,
    recommendedMax,
    msp: crop.msp,
    peakMonth: MONTHS[peakMonthIdx],
    peakPrice,
    currentMonth: MONTHS[month],
    monthlyPrices: crop.monthlyPrices,
    months: MONTHS,
    tip: crop.tip,
    revenueEstimate,
    unit: crop.unit,
  };
}

/**
 * Answer farmer Q&A about market prices
 */
function answerMarketQuestion(question, cropContext = null) {
  const q = question.toLowerCase();

  // Detect crop from question or use context
  let detectedCrop = cropContext;
  for (const key of Object.keys(CROP_MARKET_DATA)) {
    if (q.includes(key) || q.includes(CROP_MARKET_DATA[key].name.toLowerCase())) {
      detectedCrop = key;
      break;
    }
  }

  const now = new Date();
  const month = now.getMonth();

  // Price query
  if (q.match(/price|rate|cost|worth|value|how much/)) {
    if (detectedCrop && CROP_MARKET_DATA[detectedCrop]) {
      const d = CROP_MARKET_DATA[detectedCrop];
      const price = d.monthlyPrices[month];
      return {
        answer: `Current wholesale market price for ${d.name} is approximately ₹${price}/kg. As a farmer, you should aim to get ₹${Math.round(price * 0.72)}–₹${Math.round(price * 0.82)}/kg. ${price > d.msp && d.msp > 0 ? `This is above the MSP of ₹${d.msp}/kg ✅` : d.msp > 0 ? `Note: Current price is near MSP of ₹${d.msp}/kg` : ''}`,
        crop: detectedCrop,
      };
    }
    return { answer: 'Please mention the crop name to get current price. E.g. "What is the price of tomato?"' };
  }

  // Best time to sell
  if (q.match(/when|best time|sell|wait|hold/)) {
    if (detectedCrop && CROP_MARKET_DATA[detectedCrop]) {
      const d = CROP_MARKET_DATA[detectedCrop];
      const peakPrice = Math.max(...d.monthlyPrices.filter(p => p > 0));
      const peakIdx = d.monthlyPrices.indexOf(peakPrice);
      const currentPrice = d.monthlyPrices[month];
      const isNowGood = currentPrice >= peakPrice * 0.85;
      return {
        answer: `Best time to sell ${d.name} is ${MONTHS[peakIdx]} when prices reach ₹${peakPrice}/kg. ${isNowGood ? `Current prices (₹${currentPrice}/kg) are near peak — good time to sell! 🟢` : `Current price is ₹${currentPrice}/kg. ${d.tip}`}`,
        crop: detectedCrop,
      };
    }
    return { answer: 'Tell me which crop you want to sell and I\'ll advise the best time.' };
  }

  // MSP query
  if (q.match(/msp|minimum support|government price|support price/)) {
    if (detectedCrop && CROP_MARKET_DATA[detectedCrop]) {
      const d = CROP_MARKET_DATA[detectedCrop];
      if (d.msp > 0) {
        return { answer: `MSP (Minimum Support Price) for ${d.name} is ₹${d.msp}/kg (₹${Math.round(d.msp * 100)}/quintal) as per CACP 2024-25. You can sell to government procurement centers at this guaranteed price.`, crop: detectedCrop };
      }
      return { answer: `${d.name} does not have a government MSP. Sell through local mandis or direct to buyers for best price.`, crop: detectedCrop };
    }
    return { answer: 'Which crop are you asking about? I can tell you the MSP for rice, wheat, maize, cotton, soybean, groundnut, and more.' };
  }

  // Trend query
  if (q.match(/trend|going up|going down|increase|decrease|next month|future/)) {
    if (detectedCrop && CROP_MARKET_DATA[detectedCrop]) {
      const d = CROP_MARKET_DATA[detectedCrop];
      const curr = d.monthlyPrices[month];
      const next = d.monthlyPrices[(month + 1) % 12];
      const dir = next > curr ? `📈 rising to ₹${next}/kg next month` : next < curr ? `📉 falling to ₹${next}/kg next month` : '➡️ stable next month';
      return { answer: `${d.name} price trend: currently ₹${curr}/kg, ${dir}. ${d.tip}`, crop: detectedCrop };
    }
  }

  // Revenue / earnings query
  if (q.match(/earn|revenue|income|profit|how much.*sell|total/)) {
    if (detectedCrop && CROP_MARKET_DATA[detectedCrop]) {
      const d = CROP_MARKET_DATA[detectedCrop];
      const price = d.monthlyPrices[month];
      return {
        answer: `For ${d.name} at current price ₹${price}/kg: 1 quintal (100kg) = ₹${price * 100}, 1 ton (1000kg) = ₹${price * 1000}. Farmer typically receives 70-82% of wholesale price.`,
        crop: detectedCrop,
      };
    }
  }

  // Storage advice
  if (q.match(/store|storage|warehouse|cold storage|hold/)) {
    if (detectedCrop && CROP_MARKET_DATA[detectedCrop]) {
      const d = CROP_MARKET_DATA[detectedCrop];
      const peakPrice = Math.max(...d.monthlyPrices.filter(p => p > 0));
      const peakIdx = d.monthlyPrices.indexOf(peakPrice);
      const curr = d.monthlyPrices[month];
      const gain = peakPrice - curr;
      if (gain > 5) {
        return { answer: `Storing ${d.name} until ${MONTHS[peakIdx]} could earn you ₹${gain}/kg more. Cold storage cost is typically ₹1-3/kg/month. Net gain could be ₹${gain - 3 * ((peakIdx - month + 12) % 12)}/kg.`, crop: detectedCrop };
      }
      return { answer: `Current ${d.name} prices are already near peak. Selling now is advisable.`, crop: detectedCrop };
    }
  }

  // Generic greeting / help
  if (q.match(/hello|hi|help|what can|namaste/)) {
    return {
      answer: `Namaste! 🙏 I'm your Market Price Advisor. Ask me:\n• "What is the price of tomato?"\n• "When should I sell onion?"\n• "What is the MSP for wheat?"\n• "Will potato prices go up next month?"\n• "How much will I earn selling 50kg rice?"`,
    };
  }

  // Fallback
  return {
    answer: `I can help with crop prices, MSP, best selling time, and revenue estimates. Try asking: "What is the current price of ${detectedCrop ? CROP_MARKET_DATA[detectedCrop]?.name : 'tomato'}?"`,
  };
}

module.exports = { getMarketAnalysis, answerMarketQuestion, CROP_MARKET_DATA, MONTHS };
