// =====================================
// GoldAI — Trade Management
// =====================================

function createTradePlan(signal, entry, atr, capital, riskPercent, cfg) {
  if (!signal || signal.includes("WAIT") || !atr) {
    return {
      entry: entry || "-",
      stopLoss: "-",
      tp1: "-", tp2: "-", tp3: "-",
      lot: "-",
      riskMoney: "-",
      riskReward: "-",
      volatility: "-"
    };
  }

  const levels = window.GoldAI_ATR.buildRiskLevels(entry, signal, atr, cfg);
  const riskPct = riskPercent || cfg.DEFAULT_RISK_PERCENT || 2;
  const riskMoney = Number(((capital * riskPct) / 100).toFixed(2));
  const stopDist = Math.abs(entry - levels.stopLoss);

  // XAUUSD approx: $1 move ≈ $1 per 0.01 lot on mini — simplified
  let lot = stopDist > 0 ? riskMoney / (stopDist * 100) : 0.01;
  if (lot < 0.01) lot = 0.01;
  lot = Number(lot.toFixed(2));

  let vol = "MEDIUM";
  if (atr >= 8) vol = "HIGH";
  else if (atr < 3) vol = "LOW";

  return {
    entry: Number(entry.toFixed(2)),
    stopLoss: levels.stopLoss,
    tp1: levels.tp1,
    tp2: levels.tp2,
    tp3: levels.tp3,
    lot,
    riskMoney,
    riskPercent: riskPct,
    riskReward: levels.riskReward,
    volatility: vol,
    atr
  };
}

window.GoldAI_Trade = { createTradePlan };
