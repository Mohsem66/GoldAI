// =====================================
// GoldAI Pro — Config (بدون کلید API)
// =====================================

window.GoldAI_Config = {

  // 🔐 کلید API به backend/server.js منتقل شده است
  // از این پس از BACKEND_URL برای دریافت داده استفاده می‌شود

  BACKEND_URL: "http://localhost:5000/api",  // آدرس بک‌اند

  SYMBOL: "XAU/USD",

  TF_SCALP: "1min",
  TF_ENTRY: "5min",
  TF_SWING: "15min",
  TF_TREND: "1h",
  TF_H4: "4h",
  TF_DAILY: "1day",

  CANDLE_COUNT: 120,

  DEFAULT_CAPITAL: 10000,
  DEFAULT_RISK_PERCENT: 1.0,
  MAX_TRADES_PER_DAY: 5,

  STRATEGY_MODE: "scalp",

  TP_COUNT: 3,

  ATR_SL_MULT: 1.5,
  ATR_TP1_MULT: 2.0,
  ATR_TP2_MULT: 3.5,
  ATR_TP3_MULT: 5.0,

  EMA_FAST: 20,
  EMA_MID: 50,
  EMA_SLOW: 200,

  RSI_PERIOD: 14,
  RSI_OB: 70,
  RSI_OS: 30,

  ATR_PERIOD: 14,

  ADX_PERIOD: 14,
  ADX_TREND_MIN: 25,

  SWING_LOOKBACK: 5,
  MIN_BREAK_STRENGTH: 0.15,

  MIN_CONFIDENCE: 68,
  STRICT_MODE: true,

  PRICE_REFRESH_MS: 5000,

  // تنظیمات اعلان (اختیاری)
  NTFY_TOPIC: "goldai_signals",  // برای اعلان به گوشی
};
