// =====================================
// GoldAI — Score Aggregator
// =====================================

function runScoreEngine(layers) {
  let buy = 0, sell = 0, conf = 0;
  const reasons = [];

  const add = (layer, weight = 1) => {
    if (!layer) return;
    buy += (layer.buyScore || 0) * weight;
    sell += (layer.sellScore || 0) * weight;
    conf += layer.confidence || 0;
    if (layer.reason) reasons.push(layer.reason);
  };

  // Weights: structure & liquidity higher for SMC style
  add(layers.structure, 1.4);
  add(layers.ema, 1.2);
  add(layers.rsi, 1.0);
  add(layers.divergence, 1.1);
  add(layers.macd, 1.0);
  add(layers.adx, 1.0);
  add(layers.volume, 0.8);
  add(layers.sr, 0.9);
  add(layers.candles, 0.9);
  add(layers.liquidity, 1.3);

  // Multi-TF bias
  if (layers.htf) {
    if (layers.htf.trend === "BULLISH") { buy += 3; reasons.push("HTF bullish bias"); }
    if (layers.htf.trend === "BEARISH") { sell += 3; reasons.push("HTF bearish bias"); }
  }

  // ADX range penalty
  if (layers.adx && layers.adx.regime === "RANGE") {
    conf -= 8;
    reasons.push("ADX range → lower confidence");
  }

  buy = Number(buy.toFixed(1));
  sell = Number(sell.toFixed(1));

  let signal = "WAIT 🟡";
  if (buy > sell + 1.5) signal = "BUY 🟢";
  else if (sell > buy + 1.5) signal = "SELL 🔴";

  conf = Math.abs(buy - sell) * 5 + conf;
  if (conf > 100) conf = 100;
  if (conf < 0) conf = 0;
  conf = Math.round(conf);

  let quality = "LOW";
  if (conf >= 78) quality = "HIGH";
  else if (conf >= 58) quality = "MEDIUM";

  // Unique reasons
  const uniq = [...new Set(reasons.filter(Boolean))];

  return {
    signal,
    buyScore: buy,
    sellScore: sell,
    confidence: conf,
    entryQuality: quality,
    reason: uniq.slice(0, 8).join(" · ")
  };
}

window.GoldAI_Score = { runScoreEngine };
