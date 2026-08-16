// =====================================
// GoldAI — AI Brain (Meta Only)
// فقط به‌عنوان Meta-Filter و بدون امتیازدهی مجدد
// =====================================

window.GoldAI_AIBrain = {
  analyze(layers) {
    // دریافت امتیاز از Score Engine (بدون دابل‌کاتینگ)
    const score = window.GoldAI_Score.runScoreEngine(layers);

    // فقط به‌عنوان Meta-Filter عمل می‌کند
    // بدون امتیازدهی مجدد
    return {
      signal: score.signal,
      confidence: score.confidence,
      reasoning: score.reason || "تحلیل تکنیکال انجام شد",
      // صفر کردن امتیازها برای جلوگیری از دابل‌کاتینگ
      buyScore: 0,
      sellScore: 0,
      aiConfidence: 0
    };
  }
};
