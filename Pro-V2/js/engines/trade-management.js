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

  // Symbol specific lot calculations (Approx standard lot weight)
  const sym = (window.GoldAI_Config.SYMBOL || "XAU/USD").toUpperCase();
  let baseMultiplier = 100; // default Gold
  if (sym.includes("EUR/USD") || sym.includes("GBP/USD") || sym.includes("AUD/USD")) {
    baseMultiplier = 100000; // standard Forex lot unit
  } else if (sym.includes("JPY")) {
    baseMultiplier = 1000; // Yen standard point unit
  }

  let lot = stopDist > 0 ? riskMoney / (stopDist * baseMultiplier) : 0.01;
  if (lot < 0.01) lot = 0.01;
  lot = Number(lot.toFixed(2));

  let vol = "MEDIUM";

  // Custom volatility indexes per symbol
  if (sym.includes("XAU") || sym.includes("GOLD")) {
    if (atr >= 8) vol = "HIGH";
    else if (atr < 3) vol = "LOW";
  } else {
    // Forex
    if (atr >= 0.0030) vol = "HIGH";
    else if (atr < 0.0008) vol = "LOW";
  }

  return {
    entry: Number(entry),
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
