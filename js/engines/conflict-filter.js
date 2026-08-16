// =====================================
// GoldAI — Conflict Filter (اصلاح‌شده)
// =====================================

window.GoldAI_Conflict = {

  // ===== آستانه تطبیقی بر اساس ATR =====
  getAdaptiveThreshold(volatility, baseThreshold) {
    if (!volatility) return baseThreshold || 70;
    // اگر نوسان بالا باشد، آستانه بالاتر می‌رود
    const factor = Math.min(1.3, Math.max(0.7, volatility / 2));
    return Math.round(Math.min(85, Math.max(60, (baseThreshold || 70) * factor)));
  },

  runConflictFilter(score, layers, cfg) {
    let signal = score.signal;
    let confidence = score.confidence;
    const warnings = [];
    const confirms = [];

    // ===== ۱. تضاد با EMA =====
    if (layers.ema) {
      if (signal.includes("BUY") && layers.ema.trend === "BEARISH") {
        confidence -= 14;
        warnings.push("BUY vs EMA bearish");
      } else if (signal.includes("SELL") && layers.ema.trend === "BULLISH") {
        confidence -= 14;
        warnings.push("SELL vs EMA bullish");
      } else if (signal.includes("BUY") && layers.ema.trend === "BULLISH") {
        confirms.push("EMA confirms BUY");
      } else if (signal.includes("SELL") && layers.ema.trend === "BEARISH") {
        confirms.push("EMA confirms SELL");
      }
    }

    // ===== ۲. RSI Extreme =====
    if (layers.rsi && layers.rsi.rsi != null) {
      if (signal.includes("BUY") && layers.rsi.rsi >= 78) {
        confidence -= 16;
        warnings.push("BUY into extreme OB RSI");
      }
      if (signal.includes("SELL") && layers.rsi.rsi <= 22) {
        confidence -= 16;
        warnings.push("SELL into extreme OS RSI");
      }
    }

    // ===== ۳. ساختار بازار =====
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

    // ===== ۴. رنج بازار =====
    if (layers.adx && layers.adx.regime === "RANGE") {
      if (confidence < 78) {
        confidence -= 8;
        warnings.push("Range market — reduced confidence");
      }
    }

    // ===== ۵. تضاد با تایم‌فریم بالا =====
    if (layers.htf) {
      if (signal.includes("BUY") && layers.htf.trend === "BEARISH") {
        confidence -= 12;
        warnings.push("Against HTF trend");
      } else if (signal.includes("SELL") && layers.htf.trend === "BULLISH") {
        confidence -= 12;
        warnings.push("Against HTF trend");
      } else if (layers.htf.trend !== "UNKNOWN") {
        confirms.push(`HTF ${layers.htf.trend} aligns`);
      }
    }

    // ===== ۶. اعمال آستانه تطبیقی =====
    const atr = layers.atr ? layers.atr.atr : null;
    const adaptiveThreshold = this.getAdaptiveThreshold(atr, cfg?.MIN_CONFIDENCE || 70);

    if (cfg?.STRICT_MODE && confidence < adaptiveThreshold && !signal.includes("WAIT")) {
      signal = "WAIT 🟡";
      warnings.push(`Confidence ${confidence} < ${adaptiveThreshold} (adaptive)`);
    }

    // ===== ۷. حداقل Edge =====
    const edge = Math.abs((score.buyScore || 0) - (score.sellScore || 0));
    if (edge < 2.2 && !signal.includes("WAIT")) {
      signal = "WAIT 🟡";
      warnings.push("No clear directional edge");
    }

    // ===== نهایی =====
    confidence = Math.min(100, Math.max(0, Math.round(confidence)));

    return {
      signal,
      confidence,
      buyScore: score.buyScore,
      sellScore: score.sellScore,
      entryQuality: confidence >= 78 ? "HIGH" : confidence >= 65 ? "MEDIUM" : "LOW",
      reason: score.reason,
      warnings: warnings.concat(score.warnings || []),
      confirms: confirms.concat(score.confirms || []),
      adaptiveThreshold
    };
  }
};
