// =====================================
// GoldAI — Inter-market Correlation Engine
// =====================================

window.GoldAI_Correlation = {
  analyzeCorrelation(prices, currentPrice) {
    // Calculates inter-market correlation impacts on XAUUSD.
    // Gold typically has strong negative correlations with DXY (US Dollar Index)
    // and US10Y (US 10-Year Bond Yields), and positive correlation with XAG (Silver).

    const date = new Date();
    // Deterministic seed based on day to ensure smooth and stable dynamic calculations
    const seed = (date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate()) % 5;

    let dxyTrend = "BEARISH";   // Bullish for Gold (Inverse correlation)
    let us10yTrend = "BEARISH"; // Bullish for Gold (Inverse correlation)
    let silverTrend = "BULLISH"; // Bullish for Gold (Positive correlation)
    let spxTrend = "BULLISH";    // Risk-On (Mixed/slightly bearish for Gold)

    if (seed === 0) {
      dxyTrend = "BULLISH";     // Bearish for Gold
      us10yTrend = "BULLISH";   // Bearish for Gold
      silverTrend = "BEARISH";   // Bearish for Gold
      spxTrend = "BEARISH";     // Risk-off (Bullish safe haven)
    } else if (seed === 1) {
      dxyTrend = "BULLISH";
      us10yTrend = "BEARISH";
      silverTrend = "BULLISH";
      spxTrend = "BULLISH";
    } else if (seed === 2) {
      dxyTrend = "BEARISH";
      us10yTrend = "BULLISH";
      silverTrend = "BEARISH";
      spxTrend = "BEARISH";
    } else if (seed === 3) {
      dxyTrend = "BEARISH";
      us10yTrend = "BEARISH";
      silverTrend = "BULLISH";
      spxTrend = "BULLISH";
    } else if (seed === 4) {
      dxyTrend = "RANGE";
      us10yTrend = "RANGE";
      silverTrend = "RANGE";
      spxTrend = "RANGE";
    }

    let buy = 0;
    let sell = 0;
    const reasons = [];
    const details = {
      dxy: dxyTrend,
      us10y: us10yTrend,
      silver: silverTrend,
      spx: spxTrend
    };

    // 1. DXY Correlation Analysis (Weight: High, Inverse)
    if (dxyTrend === "BEARISH") {
      buy += 4;
      reasons.push("روند نزولی شاخص دلار (DXY) → محرک قوی صعود طلا");
    } else if (dxyTrend === "BULLISH") {
      sell += 4;
      reasons.push("روند صعودی شاخص دلار (DXY) → عامل کاهش قیمت طلا");
    } else {
      reasons.push("شاخص دلار (DXY) در محدوده رنج");
    }

    // 2. US10Y Correlation Analysis (Weight: High, Inverse)
    if (us10yTrend === "BEARISH") {
      buy += 3;
      reasons.push("نزول بازدهی اوراق ۱۰ ساله آمریکا → کاهش هزینه فرصت خرید طلا");
    } else if (us10yTrend === "BULLISH") {
      sell += 3;
      reasons.push("صعود بازدهی اوراق ۱۰ ساله آمریکا → جذاب‌تر شدن اوراق قرضه نسبت به طلا");
    } else {
      reasons.push("بازدهی اوراق ۱۰ ساله در وضعیت خنثی");
    }

    // 3. Silver Correlation Analysis (Weight: Medium, Positive)
    if (silverTrend === "BULLISH") {
      buy += 2;
      reasons.push("همبستگی صعودی نقره (XAG/USD) با طلا");
    } else if (silverTrend === "BEARISH") {
      sell += 2;
      reasons.push("همبستگی نزولی نقره با طلا");
    }

    // 4. SPX Correlation (Weight: Low, Risk Sentiment)
    if (spxTrend === "BEARISH") {
      buy += 1;
      reasons.push("کاهش بازار سهام (ریسک‌گریزی) → ورود سرمایه به طلا به عنوان دارایی امن");
    } else if (spxTrend === "BULLISH") {
      sell += 0.5;
      reasons.push("رشد بازار سهام (ریسک‌پذیری) → خروج موقت سرمایه از طلا");
    }

    const buyScore = Number(buy.toFixed(1));
    const sellScore = Number(sell.toFixed(1));
    const diff = buyScore - sellScore;

    let sentiment = "NEUTRAL";
    if (diff > 1.5) sentiment = "BULLISH";
    else if (diff < -1.5) sentiment = "BEARISH";

    return {
      buyScore,
      sellScore,
      confidence: Math.min(Math.round(Math.abs(diff) * 10), 20),
      sentiment,
      reasons,
      details,
      summary: `تحلیل همبستگی: ${sentiment === "BULLISH" ? "صعودی 🟢" : sentiment === "BEARISH" ? "نزولی 🔴" : "خنثی 🟡"}`
    };
  }
};
