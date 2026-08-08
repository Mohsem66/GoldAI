// =====================================
// GoldAI — RSI Divergence (Reg + Hidden)
// =====================================

function swingPair(arr, back = 5) {
  if (!arr || arr.length < back + 1) return null;
  return { old: arr[arr.length - 1 - back], neu: arr[arr.length - 1] };
}

function strength(pOld, pNew, rOld, rNew) {
  const pd = Math.abs(pNew - pOld);
  const rd = Math.abs(rNew - rOld);
  if (pd >= 1.5 && rd >= 10) return "STRONG";
  if (pd >= 0.6 && rd >= 5) return "MEDIUM";
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

  const p = swingPair(prices, 5);
  const r = swingPair(rsiValues, 5);
  if (!p || !r || r.old == null || r.neu == null) return result;

  const confMap = { STRONG: 22, MEDIUM: 14, WEAK: 7 };

  // Regular Bullish: price LL, RSI HL
  if (p.neu < p.old && r.neu > r.old) {
    const s = strength(p.old, p.neu, r.old, r.neu);
    return {
      type: "REGULAR_BULLISH",
      strength: s,
      buyScore: 5,
      sellScore: 0,
      confidence: confMap[s],
      reason: `Regular Bullish Div (${s})`
    };
  }
  // Regular Bearish: price HH, RSI LH
  if (p.neu > p.old && r.neu < r.old) {
    const s = strength(p.old, p.neu, r.old, r.neu);
    return {
      type: "REGULAR_BEARISH",
      strength: s,
      buyScore: 0,
      sellScore: 5,
      confidence: confMap[s],
      reason: `Regular Bearish Div (${s})`
    };
  }
  // Hidden Bullish: price HL, RSI LL
  if (p.neu > p.old && r.neu < r.old) {
    const s = strength(p.old, p.neu, r.old, r.neu);
    return {
      type: "HIDDEN_BULLISH",
      strength: s,
      buyScore: 3,
      sellScore: 0,
      confidence: confMap[s] - 4,
      reason: `Hidden Bullish Div (${s})`
    };
  }
  // Hidden Bearish: price LH, RSI HH
  if (p.neu < p.old && r.neu > r.old) {
    const s = strength(p.old, p.neu, r.old, r.neu);
    return {
      type: "HIDDEN_BEARISH",
      strength: s,
      buyScore: 0,
      sellScore: 3,
      confidence: confMap[s] - 4,
      reason: `Hidden Bearish Div (${s})`
    };
  }
  return result;
}

window.GoldAI_Divergence = { analyzeDivergence };
