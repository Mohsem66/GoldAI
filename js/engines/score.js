// =====================================
// GoldAI — Score Engine v3 (بازطراحی‌شده)
// =====================================

window.GoldAI_Score = {

  // ===== وزن‌های پایه =====
  BASE_WEIGHTS: {
    structure: 1.5,
    ema: 1.3,
    rsi: 1.0,
    divergence: 1.25,
    macd: 0.9,
    adx: 1.2,
    volume: 1.0,
    sr: 0.95,
    candles: 0.8,
    liquidity: 1.4,
    htf: 3.0,
  },

  // ===== محاسبه وزن پویا بر اساس شرایط بازار =====
  calculateDynamicWeights(layers) {
    const weights = { ...this.BASE_WEIGHTS };
    const adx = layers.adx;
    const atr = layers.atr;
    const rsi = layers.rsi;

    // در روند قوی، وزن MACD و ADX افزایش می‌یابد
    if (adx && adx.adx > 35) {
      weights.macd = 1.5;
      weights.adx = 1.8;
      weights.rsi = 0.7;
    }

    // در بازار رنج، وزن RSI و S/R افزایش می‌یابد
    if (adx && adx.regime === "RANGE") {
      weights.rsi = 1.8;
      weights.sr = 1.5;
      weights.macd = 0.6;
      weights.adx = 0.5;
    }

    // در نوسان بالا، وزن ATR افزایش می‌یابد
    if (atr && atr.atr > 2.5) {
      weights.structure = 2.0;
      weights.liquidity = 1.8;
    }

    return weights;
  },

  // ===== موتور اصلی امتیازدهی =====
  runScoreEngine(layers) {
    let buy = 0,
      sell = 0,
      confidence = 0;
    const reasons = [];
    const confirms = [];
    const warnings = [];

    // دریافت وزن‌های پویا
    const weights = this.calculateDynamicWeights(layers);

    // ===== ۱. ساختار بازار =====
    if (layers.structure) {
      const w = weights.structure || 1.5;
      buy += (layers.structure.buyScore || 0) * w;
      sell += (layers.structure.sellScore || 0) * w;
      if (layers.structure.trend === "BULLISH") confirms.push("✅ ساختار صعودی");
      if (layers.structure.trend === "BEARISH") confirms.push("✅ ساختار نزولی");
      if (layers.structure.choch) warnings.push("⚠️ CHoCH - تغییر رژیم");
      if (layers.structure.bos) confirms.push("✅ BOS تایید");
    }

    // ===== ۲. EMA =====
    if (layers.ema) {
      const w = weights.ema || 1.3;
      buy += (layers.ema.buyScore || 0) * w;
      sell += (layers.ema.sellScore || 0) * w;
      if (layers.ema.trend === "BULLISH") confirms.push("✅ EMA صعودی");
      if (layers.ema.trend === "BEARISH") confirms.push("✅ EMA نزولی");
    }

    // ===== ۳. RSI =====
    if (layers.rsi) {
      const w = weights.rsi || 1.0;
      buy += (layers.rsi.buyScore || 0) * w;
      sell += (layers.rsi.sellScore || 0) * w;
      if (layers.rsi.rsi > 70) warnings.push("⚠️ RSI اشباع خرید");
      if (layers.rsi.rsi < 30) warnings.push("⚠️ RSI اشباع فروش");
      if (layers.rsi.rsi > 40 && layers.rsi.rsi < 60) confirms.push("✅ RSI خنثی");
    }

    // ===== ۴. Divergence =====
    if (layers.divergence) {
      const w = weights.divergence || 1.25;
      buy += (layers.divergence.buyScore || 0) * w;
      sell += (layers.divergence.sellScore || 0) * w;
      if (layers.divergence.type === "BULLISH") confirms.push("✅ واگرایی صعودی");
      if (layers.divergence.type === "BEARISH") confirms.push("✅ واگرایی نزولی");
    }

    // ===== ۵. MACD =====
    if (layers.macd) {
      const w = weights.macd || 0.9;
      buy += (layers.macd.buyScore || 0) * w;
      sell += (layers.macd.sellScore || 0) * w;
      if (layers.macd.signal === "BULLISH") confirms.push("✅ MACD صعودی");
      if (layers.macd.signal === "BEARISH") confirms.push("✅ MACD نزولی");
    }

    // ===== ۶. ADX =====
    if (layers.adx) {
      const w = weights.adx || 1.2;
      buy += (layers.adx.buyScore || 0) * w;
      sell += (layers.adx.sellScore || 0) * w;
      if (layers.adx.regime === "TRENDING") confirms.push("✅ روند قوی (ADX)");
      if (layers.adx.regime === "RANGE") warnings.push("⚠️ بازار رنج (ADX)");
    }

    // ===== ۷. Volume =====
    if (layers.volume) {
      const w = weights.volume || 1.0;
      buy += (layers.volume.buyScore || 0) * w;
      sell += (layers.volume.sellScore || 0) * w;
      if (layers.volume.spike) confirms.push("✅ جهش حجم");
    }

    // ===== ۸. S/R =====
    if (layers.sr) {
      const w = weights.sr || 0.95;
      buy += (layers.sr.buyScore || 0) * w;
      sell += (layers.sr.sellScore || 0) * w;
      if (layers.sr.nearSupport) confirms.push("✅ نزدیک حمایت");
      if (layers.sr.nearResistance) confirms.push("✅ نزدیک مقاومت");
    }

    // ===== ۹. Candles =====
    if (layers.candles) {
      const w = weights.candles || 0.8;
      buy += (layers.candles.buyScore || 0) * w;
      sell += (layers.candles.sellScore || 0) * w;
      if (layers.candles.pattern === "BULLISH") confirms.push("✅ الگوی صعودی");
      if (layers.candles.pattern === "BEARISH") confirms.push("✅ الگوی نزولی");
    }

    // ===== ۱۰. Liquidity =====
    if (layers.liquidity) {
      const w = weights.liquidity || 1.4;
      buy += (layers.liquidity.buyScore || 0) * w;
      sell += (layers.liquidity.sellScore || 0) * w;
      if (layers.liquidity.liquidityGrab) confirms.push("✅ شکار نقدینگی");
    }

    // ===== ۱۱. HTF (تایم‌فریم بالا) =====
    if (layers.htf) {
      const w = weights.htf || 3.0;
      if (layers.htf.trend === "BULLISH") {
        buy += 3.5 * w;
        confirms.push("✅ روند تایم‌فریم بالا صعودی");
      } else if (layers.htf.trend === "BEARISH") {
        sell += 3.5 * w;
        confirms.push("✅ روند تایم‌فریم بالا نزولی");
      } else {
        warnings.push("⚠️ روند تایم‌فریم بالا نامشخص");
      }
    }

    // ===== ۱۲. Reversal =====
    if (layers.reversal) {
      if (layers.reversal.signal === "BUY") {
        buy += 2.5;
        confirms.push("✅ برگشت صعودی");
      } else if (layers.reversal.signal === "SELL") {
        sell += 2.5;
        confirms.push("✅ برگشت نزولی");
      }
    }

    // ===== محاسبه امتیاز نهایی =====
    const buyScore = Number(buy.toFixed(1));
    const sellScore = Number(sell.toFixed(1));
    const diff = Math.abs(buyScore - sellScore);

    // ===== تعیین سیگنال =====
    let signal = "WAIT 🟡";
    if (buyScore > sellScore + 2.2) signal = "BUY 🟢";
    else if (sellScore > buyScore + 2.2) signal = "SELL 🔴";

    // ===== محاسبه اعتماد (با در نظر گرفتن ATR) =====
    let baseConf = diff * 5.5 + (confirms.length * 3);
    if (warnings.length > 2) baseConf -= warnings.length * 4;

    // اعمال تطبیق با ATR
    if (layers.atr && layers.atr.atr) {
      const atr = layers.atr.atr;
      const atrFactor = Math.min(1.3, Math.max(0.7, atr / 2));
      baseConf = baseConf * atrFactor;
    }

    let confidence = Math.min(100, Math.max(0, Math.round(baseConf)));

    // اعمال HTF Filter (کاهش اعتماد در صورت تضاد)
    if (layers.htf) {
      if (signal.includes("BUY") && layers.htf.trend === "BEARISH") {
        confidence *= 0.6;
        warnings.push("⚠️ تضاد با روند تایم‌فریم بالا");
      } else if (signal.includes("SELL") && layers.htf.trend === "BULLISH") {
        confidence *= 0.6;
        warnings.push("⚠️ تضاد با روند تایم‌فریم بالا");
      }
    }

    confidence = Math.min(100, Math.max(0, Math.round(confidence)));

    // ===== کیفیت =====
    let quality = "LOW";
    if (confidence >= 80) quality = "EXCELLENT";
    else if (confidence >= 70) quality = "HIGH";
    else if (confidence >= 60) quality = "MEDIUM";

    return {
      signal,
      buyScore,
      sellScore,
      confidence,
      entryQuality: quality,
      reason: [...new Set(reasons)].slice(0, 6).join(" · "),
      confirms: [...new Set(confirms)],
      warnings: [...new Set(warnings)],
      alignment: diff >= 3 ? "STRONG" : diff >= 1.8 ? "MODERATE" : "WEAK",
      dynamicWeights: weights
    };
  }
};
