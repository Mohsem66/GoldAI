// =====================================
// GoldAI — Enhanced Score Aggregator with AI
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
    conf += layer.confidence || 0;
    if (layer.reason) reasons.push(layer.reason);
    if (layer.confirms) confirms.push(...layer.confirms);
    if (layer.warnings) warnings.push(...layer.warnings);
  };

  // Enhanced Weights: structure & liquidity + fundamentals
  add(layers.structure, 1.5);
  add(layers.ema, 1.3);
  add(layers.rsi, 1.1);
  add(layers.divergence, 1.2);
  add(layers.macd, 1.0);
  add(layers.adx, 1.2);
  add(layers.volume, 1.1);
  add(layers.sr, 0.95);
  add(layers.candles, 0.85);
  add(layers.liquidity, 1.4);
  add(layers.fundamental, 1.5);
  add(layers.correlation, 1.2);

  if (layers.aiBrain) {
    if (layers.aiBrain.aiSignal.includes("BUY")) {
      buy += 6.0;
      confirms.push("تایید روند صعودی توسط هوش مصنوعی (AI Consensus)");
    } else if (layers.aiBrain.aiSignal.includes("SELL")) {
      sell += 6.0;
      confirms.push("تایید روند نزولی توسط هوش مصنوعی (AI Consensus)");
    } else {
      warnings.push("توصیه به صبر و تماشا توسط هوش مصنوعی");
    }
    if (layers.aiBrain.reasoning) {
      reasons.push(layers.aiBrain.reasoning);
    }
  }

  if (layers.htf) {
    if (layers.htf.trend === "BULLISH") { 
      buy += 4; 
      confirms.push("HTF bullish bias"); 
    }
    if (layers.htf.trend === "BEARISH") { 
      sell += 4; 
      confirms.push("HTF bearish bias"); 
    }
    if (layers.htf.strength === "WEAK") {
      conf -= 5;
      warnings.push("HTF weak momentum");
    }
  }

  if (layers.m1) {
    if (layers.m1.microstructure === "BULLISH") buy += 1.5;
    if (layers.m1.microstructure === "BEARISH") sell += 1.5;
  }

  if (layers.adx && layers.adx.regime === "RANGE") {
    conf -= 10;
    warnings.push("ADX range → lower confidence");
  }

  const buyScore = Number(buy.toFixed(1));
  const sellScore = Number(sell.toFixed(1));
  const diff = Math.abs(buyScore - sellScore);

  if (diff < 0.5) {
    warnings.push("Conflicting signals");
  }

  let signal = "WAIT 🟡";
  if (buyScore > sellScore + 1.5) signal = "BUY 🟢";
  else if (sellScore > buyScore + 1.5) signal = "SELL 🔴";

  let aiBrainConf = layers.aiBrain ? layers.aiBrain.aiConfidence : 0;
  conf = Math.abs(buyScore - sellScore) * 5 + (conf / 14);
  if (aiBrainConf > 0) {
    conf = (conf * 0.4) + (aiBrainConf * 0.6);
  }
  
  if (confirms.length >= 3) conf += 8;
  if (confirms.length >= 5) conf += 5;
  
  if (conf > 100) conf = 100;
  if (conf < 0) conf = 0;
  conf = Math.round(conf);

  let quality = "LOW";
  if (conf >= 85) quality = "EXCELLENT";
  else if (conf >= 75) quality = "HIGH";
  else if (conf >= 60) quality = "MEDIUM";

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
    alignment: diff > 1.5 ? "STRONG" : diff > 0.5 ? "WEAK" : "CONFLICTING"
  };
}

window.GoldAI_Score = { runScoreEngine };
