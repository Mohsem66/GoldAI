// =====================================
// GoldAI — Score Aggregator (Quality v2)
// No double-counting of technical layers
// =====================================

function runScoreEngine(layers) {
  let buy = 0, sell = 0, conf = 0;
  const reasons = [];
  const confirms = [];
  const warnings = [];

  const add = (layer, weight = 1) => {
    if (!layer) return;
    buy += (layer.buyScore || 0) * weight;
    sell += (layer.sellScore || 0) * weight;
    conf += (layer.confidence || 0) * Math.min(weight, 1);
    if (layer.reason) reasons.push(layer.reason);
    if (layer.confirms) confirms.push(...layer.confirms);
    if (layer.warnings) warnings.push(...layer.warnings);
  };

  // Core technical — primary drivers
  add(layers.structure, 1.6);
  add(layers.ema, 1.35);
  add(layers.liquidity, 1.35);
  add(layers.divergence, 1.15);
  add(layers.rsi, 1.05);
  add(layers.macd, 1.0);
  add(layers.adx, 1.15);
  add(layers.volume, 0.95);
  add(layers.sr, 0.9);
  add(layers.candles, 0.8);

  // Simulated macro — reduced weight until live data
  const macroW = (window.GoldAI_Config && window.GoldAI_Config.SIM_MACRO_WEIGHT) || 0.35;
  add(layers.fundamental, macroW);
  add(layers.correlation, macroW * 0.9);

  // AI Brain is META only: soft bias, not full re-score of tech
  if (layers.aiBrain) {
    const ai = layers.aiBrain;
    if (ai.aiSignal && ai.aiSignal.includes("BUY")) {
      buy += 1.5;
      confirms.push("AI meta-bias: BUY");
    } else if (ai.aiSignal && ai.aiSignal.includes("SELL")) {
      sell += 1.5;
      confirms.push("AI meta-bias: SELL");
    } else {
      warnings.push("AI meta: wait / unclear");
    }
    if (ai.reasoning) reasons.push(ai.reasoning);
  }

  // Multi-TF bias
  if (layers.htf) {
    if (layers.htf.trend === "BULLISH") {
      buy += 3.5;
      confirms.push("HTF bullish bias");
    } else if (layers.htf.trend === "BEARISH") {
      sell += 3.5;
      confirms.push("HTF bearish bias");
    }
    if (layers.htf.strength === "WEAK") {
      conf -= 6;
      warnings.push("HTF weak");
    }
  }

  // M1 microstructure — small scalp context only
  if (layers.m1) {
    if (layers.m1.microstructure === "BULLISH") buy += 1;
    if (layers.m1.microstructure === "BEARISH") sell += 1;
  }

  // Range penalty
  if (layers.adx && layers.adx.regime === "RANGE") {
    conf -= 12;
    warnings.push("ADX range → caution");
  }
  if (layers.structure && layers.structure.regime === "RANGE") {
    conf -= 6;
    warnings.push("Structure range");
  }

  const buyScore = Number(buy.toFixed(1));
  const sellScore = Number(sell.toFixed(1));
  const edge = Math.abs(buyScore - sellScore);

  const minEdge = (window.GoldAI_Config && window.GoldAI_Config.MIN_SCORE_EDGE) || 2.5;

  let signal = "WAIT 🟡";
  if (buyScore > sellScore + minEdge) signal = "BUY 🟢";
  else if (sellScore > buyScore + minEdge) signal = "SELL 🔴";

  // Confidence: edge-driven, not inflated by double count
  conf = edge * 6 + (conf / 12);
  if (confirms.length >= 3) conf += 6;
  if (confirms.length >= 5) conf += 4;
  if (edge < minEdge) conf = Math.min(conf, 55);

  conf = Math.max(0, Math.min(100, Math.round(conf)));

  let quality = "LOW";
  if (conf >= 85 && edge >= 4) quality = "EXCELLENT";
  else if (conf >= 75) quality = "HIGH";
  else if (conf >= 62) quality = "MEDIUM";

  const uniq = [...new Set(reasons.filter(Boolean))];
  const uniqConfirms = [...new Set(confirms.filter(Boolean))];
  const uniqWarnings = [...new Set(warnings.filter(Boolean))];

  return {
    signal,
    buyScore,
    sellScore,
    confidence: conf,
    entryQuality: quality,
    reason: uniq.slice(0, 6).join(" · "),
    confirms: uniqConfirms,
    warnings: uniqWarnings,
    alignment: edge >= minEdge + 1 ? "STRONG" : edge >= minEdge ? "OK" : "WEAK"
  };
}

window.GoldAI_Score = { runScoreEngine };
