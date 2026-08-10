// =====================================
// GoldAI — RSI Divergence (Swing-based v2)
// =====================================

function findLocalExtremes(arr, kind, order = 3) {
  if (!arr || arr.length < order * 2 + 1) return [];
  const out = [];
  for (let i = order; i < arr.length - order; i++) {
    let ok = true;
    for (let j = 1; j <= order; j++) {
      if (kind === "high") {
        if (arr[i] < arr[i - j] || arr[i] < arr[i + j]) { ok = false; break; }
      } else {
        if (arr[i] > arr[i - j] || arr[i] > arr[i + j]) { ok = false; break; }
      }
    }
    if (ok) out.push({ i, v: arr[i] });
  }
  return out;
}

function strength(pOld, pNew, rOld, rNew) {
  const pd = Math.abs(pNew - pOld);
  const rd = Math.abs(rNew - rOld);
  if (pd >= 2.0 && rd >= 12) return "STRONG";
  if (pd >= 0.8 && rd >= 6) return "MEDIUM";
  return "WEAK";
}

function analyzeDivergence(prices, rsiValues) {
  const result = {
    type: "NONE",
    strength: "NONE",
    buyScore: 0,
    sellScore: 0,
    confidence: 0,
    reason: "No divergence"
  };

  if (!prices || !rsiValues || prices.length < 20 || rsiValues.length < 10) return result;

  // Align lengths: rsiHistory is usually shorter
  const n = Math.min(prices.length, rsiValues.length);
  const p = prices.slice(prices.length - n);
  const r = rsiValues.slice(rsiValues.length - n);

  const pHighs = findLocalExtremes(p, "high", 3);
  const pLows = findLocalExtremes(p, "low", 3);
  const rHighs = findLocalExtremes(r, "high", 3);
  const rLows = findLocalExtremes(r, "low", 3);

  const confMap = { STRONG: 18, MEDIUM: 11, WEAK: 5 };

  // Regular Bullish: price lower low, RSI higher low
  if (pLows.length >= 2 && rLows.length >= 2) {
    const pl1 = pLows[pLows.length - 2];
    const pl2 = pLows[pLows.length - 1];
    const rl1 = rLows[rLows.length - 2];
    const rl2 = rLows[rLows.length - 1];
    if (pl2.v < pl1.v && rl2.v > rl1.v && Math.abs(pl2.i - rl2.i) <= 4) {
      const s = strength(pl1.v, pl2.v, rl1.v, rl2.v);
      if (s !== "WEAK") {
        return {
          type: "REGULAR_BULLISH",
          strength: s,
          buyScore: s === "STRONG" ? 5 : 3.5,
          sellScore: 0,
          confidence: confMap[s],
          reason: `Regular Bullish Div (${s})`
        };
      }
    }
  }

  // Regular Bearish: price higher high, RSI lower high
  if (pHighs.length >= 2 && rHighs.length >= 2) {
    const ph1 = pHighs[pHighs.length - 2];
    const ph2 = pHighs[pHighs.length - 1];
    const rh1 = rHighs[rHighs.length - 2];
    const rh2 = rHighs[rHighs.length - 1];
    if (ph2.v > ph1.v && rh2.v < rh1.v && Math.abs(ph2.i - rh2.i) <= 4) {
      const s = strength(ph1.v, ph2.v, rh1.v, rh2.v);
      if (s !== "WEAK") {
        return {
          type: "REGULAR_BEARISH",
          strength: s,
          buyScore: 0,
          sellScore: s === "STRONG" ? 5 : 3.5,
          confidence: confMap[s],
          reason: `Regular Bearish Div (${s})`
        };
      }
    }
  }

  // Hidden Bullish: price higher low, RSI lower low
  if (pLows.length >= 2 && rLows.length >= 2) {
    const pl1 = pLows[pLows.length - 2];
    const pl2 = pLows[pLows.length - 1];
    const rl1 = rLows[rLows.length - 2];
    const rl2 = rLows[rLows.length - 1];
    if (pl2.v > pl1.v && rl2.v < rl1.v && Math.abs(pl2.i - rl2.i) <= 4) {
      const s = strength(pl1.v, pl2.v, rl1.v, rl2.v);
      if (s === "STRONG" || s === "MEDIUM") {
        return {
          type: "HIDDEN_BULLISH",
          strength: s,
          buyScore: 2.5,
          sellScore: 0,
          confidence: confMap[s] - 3,
          reason: `Hidden Bullish Div (${s})`
        };
      }
    }
  }

  // Hidden Bearish: price lower high, RSI higher high
  if (pHighs.length >= 2 && rHighs.length >= 2) {
    const ph1 = pHighs[pHighs.length - 2];
    const ph2 = pHighs[pHighs.length - 1];
    const rh1 = rHighs[rHighs.length - 2];
    const rh2 = rHighs[rHighs.length - 1];
    if (ph2.v < ph1.v && rh2.v > rh1.v && Math.abs(ph2.i - rh2.i) <= 4) {
      const s = strength(ph1.v, ph2.v, rh1.v, rh2.v);
      if (s === "STRONG" || s === "MEDIUM") {
        return {
          type: "HIDDEN_BEARISH",
          strength: s,
          buyScore: 0,
          sellScore: 2.5,
          confidence: confMap[s] - 3,
          reason: `Hidden Bearish Div (${s})`
        };
      }
    }
  }

  return result;
}

window.GoldAI_Divergence = { analyzeDivergence };
