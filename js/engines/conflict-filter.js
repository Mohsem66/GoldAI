// =====================================
// GoldAI — Conflict Filter (Quality v2)
// Final gate — fewer but cleaner signals
// =====================================

function runConflictFilter(score, layers, cfg) {
  let signal = score.signal;
  let confidence = score.confidence;
  const warnings = [...(score.warnings || [])];
  const confirms = [...(score.confirms || [])];

  const minC = (cfg && cfg.MIN_CONFIDENCE) || 72;
  const minEdge = (cfg && cfg.MIN_SCORE_EDGE) || 2.5;

  // EMA conflict
  if (layers.ema) {
    if (signal.includes("BUY") && layers.ema.trend === "BEARISH") {
      confidence -= 18;
      warnings.push("BUY vs EMA bearish");
    }
    if (signal.includes("SELL") && layers.ema.trend === "BULLISH") {
      confidence -= 18;
      warnings.push("SELL vs EMA bullish");
    }
    if (signal.includes("BUY") && layers.ema.trend === "BULLISH") confirms.push("EMA confirms BUY");
    if (signal.includes("SELL") && layers.ema.trend === "BEARISH") confirms.push("EMA confirms SELL");
  }

  // RSI extreme against trade
  if (layers.rsi && layers.rsi.rsi != null) {
    if (signal.includes("BUY") && layers.rsi.rsi >= 75) {
      confidence -= 16;
      warnings.push("BUY into high RSI");
    }
    if (signal.includes("SELL") && layers.rsi.rsi <= 25) {
      confidence -= 16;
      warnings.push("SELL into low RSI");
    }
  }

  // Structure conflict
  if (layers.structure) {
    if (signal.includes("BUY") && layers.structure.trend === "BEARISH" && !layers.structure.choch) {
      confidence -= 14;
      warnings.push("BUY vs bearish structure");
    }
    if (signal.includes("SELL") && layers.structure.trend === "BULLISH" && !layers.structure.choch) {
      confidence -= 14;
      warnings.push("SELL vs bullish structure");
    }
    if (layers.structure.bos) confirms.push("BOS active");
    if (layers.structure.choch) warnings.push("CHoCH — regime shift");
  }

  // ADX range
  if (layers.adx && layers.adx.regime === "RANGE") {
    confidence -= 12;
    warnings.push("Range market");
  }

  // HTF conflict
  if (layers.htf) {
    if (signal.includes("BUY") && layers.htf.trend === "BEARISH") {
      confidence -= 12;
      warnings.push("Against HTF trend");
    }
    if (signal.includes("SELL") && layers.htf.trend === "BULLISH") {
      confidence -= 12;
      warnings.push("Against HTF trend");
    }
  }

  // AI Brain hard conflict (meta only)
  if (layers.aiBrain) {
    const ai = layers.aiBrain.aiSignal || "";
    if (signal.includes("BUY") && ai.includes("SELL")) {
      confidence -= 20;
      warnings.push("AI meta opposite to tech BUY");
    }
    if (signal.includes("SELL") && ai.includes("BUY")) {
      confidence -= 20;
      warnings.push("AI meta opposite to tech SELL");
    }
    if (ai.includes("WAIT") && !signal.includes("WAIT") && confidence < 85) {
      confidence -= 10;
      warnings.push("AI meta prefers wait");
    }
  }

  // Require minimum directional edge
  if (Math.abs(score.buyScore - score.sellScore) < minEdge) {
    signal = "WAIT 🟡";
    warnings.push("Edge too small");
  }

  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  if ((cfg && cfg.STRICT_MODE !== false) && confidence < minC) {
    signal = "WAIT 🟡";
    warnings.push(`Confidence ${confidence} < ${minC}`);
  }

  // Need at least one structural or trend confirmation for active signal
  if (!signal.includes("WAIT")) {
    const hasConfirm =
      (layers.structure && (layers.structure.bos || layers.structure.trend === "BULLISH" || layers.structure.trend === "BEARISH")) ||
      (layers.ema && (layers.ema.trend === "BULLISH" || layers.ema.trend === "BEARISH"));
    if (!hasConfirm) {
      confidence -= 8;
      if (confidence < minC) {
        signal = "WAIT 🟡";
        warnings.push("No structure/EMA confirmation");
      }
    }
  }

  return {
    signal,
    confidence,
    buyScore: score.buyScore,
    sellScore: score.sellScore,
    entryQuality: confidence >= 82 ? "HIGH" : confidence >= 68 ? "MEDIUM" : "LOW",
    reason: score.reason,
    warnings: [...new Set(warnings)],
    confirms: [...new Set(confirms)]
  };
}

window.GoldAI_Conflict = { runConflictFilter };
