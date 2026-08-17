// =====================================
// GoldAI — Fundamental & Sentiment Engine
// =====================================

window.GoldAI_Fundamental = {
  analyzeFundamentals(cfg) {
    // SIMULATED ONLY — not live economic data.
    // In production this must be replaced with a real economic calendar / news feed.
    // Current implementation uses a deterministic date-seed so results are stable per day.

    const date = new Date();

    // Create a deterministic but dynamically shifting state based on date
    const seed = (date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate()) % 7;

    let cpiStatus = "COOLING";
    let nfpStatus = "WEAK_GROWTH";
    let fedStance = "DOVISH";
    let geoRisk = 8.2;
    let centralBankDemand = 9.0;

    if (seed === 0) {
      cpiStatus = "HOT";
      fedStance = "HAWKISH";
      geoRisk = 5.1;
    } else if (seed === 1) {
      nfpStatus = "STRONG";
      geoRisk = 4.3;
    } else if (seed === 2) {
      cpiStatus = "IN_LINE";
      nfpStatus = "IN_LINE";
      fedStance = "NEUTRAL";
      geoRisk = 6.8;
    } else if (seed === 3) {
      cpiStatus = "COOLING";
      fedStance = "DOVISH";
      geoRisk = 7.5;
    } else if (seed === 4) {
      geoRisk = 9.5;
      fedStance = "HAWKISH";
    } else if (seed === 5) {
      centralBankDemand = 5.5;
      fedStance = "DOVISH";
    } else if (seed === 6) {
      cpiStatus = "STAGFLATION";
      fedStance = "NEUTRAL";
    }

    let buy = 0;
    let sell = 0;
    const reasons = [];
    const details = {};

    if (cpiStatus === "COOLING") {
      buy += 3;
      reasons.push("کاهش تورم آمریکا (فرصت کاهش نرخ بهره)");
      details.cpi = "Cooling (Bullish)";
    } else if (cpiStatus === "HOT") {
      sell += 4;
      reasons.push("تورم بالای آمریکا (احتمال بالای حفظ نرخ بهره بالا)");
      details.cpi = "Hot (Bearish)";
    } else if (cpiStatus === "STAGFLATION") {
      buy += 4;
      reasons.push("رکود تورمی در آمریکا (تقاضای سنتی طلا به عنوان پناهگاه تورمی)");
      details.cpi = "Stagflation (Bullish)";
    } else {
      buy += 1;
      reasons.push("تورم مطابق با انتظارات");
      details.cpi = "In-Line (Neutral/Bullish)";
    }

    if (nfpStatus === "WEAK_GROWTH") {
      buy += 3;
      reasons.push("ضعف در بازار کار آمریکا (فشار بر فدرال رزرو برای کاهش نرخ)");
      details.nfp = "Weak Growth (Bullish)";
    } else if (nfpStatus === "STRONG") {
      sell += 4;
      reasons.push("رشد قوی اشتغال آمریکا (رشد شاخص دلار)");
      details.nfp = "Strong Jobs (Bearish)";
    } else {
      details.nfp = "In-Line (Neutral)";
    }

    if (fedStance === "DOVISH") {
      buy += 4;
      reasons.push("رویکرد انبساطی فدرال رزرو (کاهش هزینه فرصت نگهداری طلا)");
      details.fed = "Dovish / Stimulative (Bullish)";
    } else if (fedStance === "HAWKISH") {
      sell += 4;
      reasons.push("سیاست انقباضی و لحن شاهینی فدرال رزرو (فشار کاهشی بر طلا)");
      details.fed = "Hawkish / Tightening (Bearish)";
    } else {
      details.fed = "Neutral";
    }

    details.geoRisk = geoRisk;
    if (geoRisk >= 8.0) {
      buy += 4;
      reasons.push("بحران‌های ژئوپلیتیک فعال در جهان (تقویت تقاضای امن طلا)");
    } else if (geoRisk >= 6.0) {
      buy += 2;
      reasons.push("تنش‌های متوسط ژئوپلیتیکی");
    }

    details.cbDemand = centralBankDemand;
    if (centralBankDemand >= 8.0) {
      buy += 3;
      reasons.push("خرید مداوم و تهاجمی طلا توسط بانک‌های مرکزی بزرگ");
    } else {
      buy += 1;
    }

    const buyScore = Number(buy.toFixed(1));
    const sellScore = Number(sell.toFixed(1));
    const diff = buyScore - sellScore;

    let sentiment = "NEUTRAL";
    if (diff > 2) sentiment = "BULLISH";
    else if (diff < -2) sentiment = "BEARISH";

    return {
      buyScore,
      sellScore,
      confidence: Math.min(Math.round(Math.abs(diff) * 10), 30),
      sentiment,
      reasons,
      details,
      simulated: true,
      warnings: ["Fundamental is simulated (not live data)"],
      summary: `تحلیل بنیادی (شبیه‌سازی): ${sentiment === "BULLISH" ? "صعودی 🟢" : sentiment === "BEARISH" ? "نزولی 🔴" : "خنثی 🟡"}`
    };
  }
};
