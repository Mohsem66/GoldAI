// =====================================
// GoldAI — Conflict Filter (final gate)
// =====================================

function runConflictFilter(score, layers, cfg) {
  let signal = score.signal;
  let confidence = score.confidence;
  const warnings = [];
  const confirms = [];

  // EMA vs Signal
  if (layers.ema) {
    if (signal.includes("BUY") && layers.ema.trend === "BEARISH") {
      confidence -= 15;
      warnings.push("BUY vs EMA bearish");
    }
    if (signal.includes("SELL") && layers.ema.trend === "BULLISH") {
      confidence -= 15;
      warnings.push("SELL vs EMA bullish");
    }
    if (signal.includes("BUY") && layers.ema.trend === "BULLISH") confirms.push("EMA confirms BUY");
    if (signal.includes("SELL") && layers.ema.trend === "BEARISH") confirms.push("EMA confirms SELL");
  }

  // RSI extreme against trade
  if (layers.rsi && layers.rsi.rsi != null) {
    if (signal.includes("BUY") && layers.rsi.rsi >= 78) {
      confidence -= 18;
      warnings.push("BUY into extreme OB RSI");
    }
    if (signal.includes("SELL") && layers.rsi.rsi <= 22) {
      confidence -= 18;
      warnings.push("SELL into extreme OS RSI");
    }
  }

  // Structure conflict
  if (layers.structure) {
    if (signal.includes("BUY") && layers.structure.trend === "BEARISH" && !layers.structure.choch) {
      confidence -= 12;
      warnings.push("BUY vs bearish structure");
    }
    if (signal.includes("SELL") && layers.structure.trend === "BULLISH" && !layers.structure.choch) {
      confidence -= 12;
      warnings.push("SELL vs bullish structure");
    }
    if (layers.structure.bos) confirms.push("BOS active");
    if (layers.structure.choch) warnings.push("CHoCH — regime shift");
  }

  // ADX range → force caution
  if (layers.adx && layers.adx.regime === "RANGE" && confidence < 80) {
    confidence -= 10;
    warnings.push("Range market — avoid force entry");
  }

  // HTF conflict
  if (layers.htf) {
    if (signal.includes("BUY") && layers.htf.trend === "BEARISH") {
      confidence -= 10;
      warnings.push("Against HTF trend");
    }
    if (signal.includes("SELL") && layers.htf.trend === "BULLISH") {
      confidence -= 10;
      warnings.push("Against HTF trend");
    }
  }

  // تضاد بین تکنیکال و هوش مصنوعی / فاندامنتال (AI Brain Conflict)
  if (layers.aiBrain) {
    if (signal.includes("BUY") && layers.aiBrain.aiSignal.includes("SELL")) {
      confidence -= 22;
      warnings.push("تضاد شدید: تحلیل تکنیکال خرید، اما هوش مصنوعی و فاندامنتال ریزش پیش‌بینی می‌کند");
    }
    if (signal.includes("SELL") && layers.aiBrain.aiSignal.includes("BUY")) {
      confidence -= 22;
      warnings.push("تضاد شدید: تحلیل تکنیکال فروش، اما هوش مصنوعی و فاندامنتال صعود پیش‌بینی می‌کند");
    }
    if (layers.aiBrain.aiSignal.includes("WAIT") && !signal.includes("WAIT") && confidence < 80) {
      confidence -= 12;
      warnings.push("سیستم عصبی هوش مصنوعی احتیاط و خروج از معامله را به علت ابهامات فاندامنتال توصیه می‌کند");
    }
  }

  if (confidence > 100) confidence = 100;
  if (confidence < 0) confidence = 0;
  confidence = Math.round(confidence);

  const minC = cfg.MIN_CONFIDENCE || 62;
  if (cfg.STRICT_MODE && confidence < minC) {
    signal = "WAIT 🟡";
    warnings.push(`Confidence ${confidence} < ${minC}`);
  }

  // Score too close
  if (Math.abs(score.buyScore - score.sellScore) < 2) {
    signal = "WAIT 🟡";
    warnings.push("No clear directional edge");
  }

  return {
    signal,
    confidence,
    buyScore: score.buyScore,
    sellScore: score.sellScore,
    entryQuality: confidence >= 78 ? "HIGH" : confidence >= 58 ? "MEDIUM" : "LOW",
    reason: score.reason,
    warnings,
    confirms
  };
}

window.GoldAI_Conflict = { runConflictFilter };
