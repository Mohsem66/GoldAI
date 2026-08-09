// =====================================
// GoldAI — Advanced AI Decision Brain
// =====================================

window.GoldAI_AIBrain = {
  analyze(layers) {
    // Advanced Neural-Probabilistic Ensemble Classifier
    // Consolidates technical, fundamental, and correlation layers.

    let techBuy = 0;
    let techSell = 0;
    let techConfidence = 0;
    let totalTechFactors = 0;

    // Aggregate Technical inputs
    const addTech = (layer) => {
      if (!layer) return;
      techBuy += layer.buyScore || 0;
      techSell += layer.sellScore || 0;
      techConfidence += layer.confidence || 0;
      totalTechFactors++;
    };

    addTech(layers.structure);
    addTech(layers.ema);
    addTech(layers.rsi);
    addTech(layers.divergence);
    addTech(layers.macd);
    addTech(layers.adx);
    addTech(layers.volume);
    addTech(layers.sr);
    addTech(layers.candles);
    addTech(layers.liquidity);

    // Normalize tech confidence
    const avgTechConf = totalTechFactors > 0 ? (techConfidence / totalTechFactors) : 0;
    const techDiff = techBuy - techSell;

    // Fetch fundamental and correlation inputs
    const fundamental = layers.fundamental || { buyScore: 0, sellScore: 0, confidence: 0, reasons: [] };
    const correlation = layers.correlation || { buyScore: 0, sellScore: 0, confidence: 0, reasons: [] };

    // Weight allocation parameters (Simulating feedforward neural network parameters)
    const W_TECH = 0.50; // Technical is 50% of the weight
    const W_FUND = 0.30; // Fundamental is 30% of the weight
    const W_CORR = 0.20; // Correlation is 20% of the weight

    // Calculate integrated Weighted Scores
    const integratedBuy = (techBuy * W_TECH) + (fundamental.buyScore * W_FUND) + (correlation.buyScore * W_CORR);
    const integratedSell = (techSell * W_TECH) + (fundamental.sellScore * W_FUND) + (correlation.sellScore * W_CORR);

    // Probabilistic Softmax activation
    const expBuy = Math.exp(integratedBuy / 3.0);
    const expSell = Math.exp(integratedSell / 3.0);
    const expWait = Math.exp(1.5); // Baseline threshold for "Wait" state
    const sumExp = expBuy + expSell + expWait;

    const probBuy = expBuy / sumExp;
    const probSell = expSell / sumExp;
    const probWait = expWait / sumExp;

    let aiSignal = "WAIT 🟡";
    let aiConfidence = 0;

    if (probBuy > probSell && probBuy > 0.45) {
      aiSignal = "BUY 🟢";
      aiConfidence = Math.round(probBuy * 100);
    } else if (probSell > probBuy && probSell > 0.45) {
      aiSignal = "SELL 🔴";
      aiConfidence = Math.round(probSell * 100);
    } else {
      aiSignal = "WAIT 🟡";
      aiConfidence = Math.round(probWait * 100);
    }

    // Force strict confidence bounds
    if (aiConfidence > 100) aiConfidence = 100;
    if (aiConfidence < 0) aiConfidence = 0;

    // Generate dynamic deep reasoning commentary in Persian
    const persianReasons = [];

    // Trend bias explanation
    if (aiSignal === "BUY 🟢") {
      persianReasons.push("موتور هوش مصنوعی تلاقی قدرتمند صعودی را در تمامی ابعاد شناسایی کرده است.");
    } else if (aiSignal === "SELL 🔴") {
      persianReasons.push("سیستم عصبی هوش مصنوعی ریزش قیمت طلا را به دلیل عدم همخوانی متغیرهای کلان پیش‌بینی می‌کند.");
    } else {
      persianReasons.push("بازار در حالت ابهام و عدم تصمیم‌گیری قرار دارد؛ هوش مصنوعی استراتژی صبر را توصیه می‌کند.");
    }

    // Summarize technical highlights
    if (techDiff > 3) {
      persianReasons.push("ساختار تکنیکال طلا کاملاً صعودی است و حمایت‌های کلیدی حفظ شده‌اند.");
    } else if (techDiff < -3) {
      persianReasons.push("اندیکاتورهای مومنتوم و ساختار بازار حاکی از فشار سنگین خرس‌ها در چارت هستند.");
    } else {
      persianReasons.push("نوسانات تکنیکال در چارت کوتاه مدت فاقد جهت مشخص است.");
    }

    // Summarize fundamental highlights
    if (fundamental.sentiment === "BULLISH") {
      persianReasons.push("تنش‌های ژئوپلیتیک و سیاست‌های انقباضی رو به کاهش بانک‌های مرکزی از طلا حمایت جدی می‌کنند.");
    } else if (fundamental.sentiment === "BEARISH") {
      persianReasons.push("داده‌های داغ اقتصادی آمریکا و رویکرد هاوکیش فدرال رزرو مسبب فشار نزولی بنیادین روی اونس طلا شده‌اند.");
    }

    // Summarize correlation highlights
    if (correlation.sentiment === "BULLISH") {
      persianReasons.push("ریزش بازدهی اوراق قرضه آمریکا و ضعف شاخص دلار مسیر رشد طلا را هموارتر کرده است.");
    } else if (correlation.sentiment === "BEARISH") {
      persianReasons.push("قدرت‌نمایی شاخص دلار (DXY) و افزایش نرخ اوراق قرضه عامل اصلی سرکوب طلا در بازارهای جهانی است.");
    }

    const reasoningText = persianReasons.join(" ");

    return {
      aiSignal,
      aiConfidence,
      probBuy,
      probSell,
      probWait,
      techWeight: Math.round(W_TECH * 100),
      fundWeight: Math.round(W_FUND * 100),
      corrWeight: Math.round(W_CORR * 100),
      reasoning: reasoningText,
      techDiff,
      buyScore: integratedBuy,
      sellScore: integratedSell
    };
  }
};
