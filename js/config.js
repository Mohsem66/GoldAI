// =====================================
// GoldAI Pro — Config (بدون کلید API)
// =====================================

window.GoldAI_Config = {

  // 🔐 کلید API به backend/server.js منتقل شده است
  BACKEND_URL: "http://localhost:5000/api",

  SYMBOL: "XAU/USD",

  // ===== تایم‌فریم‌ها =====
  TF_SCALP: "1min",
  TF_ENTRY: "5min",
  TF_SWING: "15min",
  TF_TREND: "1h",
  TF_H4: "4h",
  TF_DAILY: "1day",

  CANDLE_COUNT: 120,

  // ===== مدیریت سرمایه =====
  DEFAULT_CAPITAL: 10000,
  DEFAULT_RISK_PERCENT: 1.0,
  MAX_TRADES_PER_DAY: 5,

  // ===== استراتژی =====
  STRATEGY_MODE: "scalp", // "scalp" | "swing"

  // ===== تعداد TP =====
  TP_COUNT: 3,

  // ===== ATR Multipliers =====
  ATR_SL_MULT: 1.5,
  ATR_TP1_MULT: 2.0,
  ATR_TP2_MULT: 3.5,
  ATR_TP3_MULT: 5.0,

  // ===== EMA =====
  EMA_FAST: 20,
  EMA_MID: 50,
  EMA_SLOW: 200,

  // ===== RSI =====
  RSI_PERIOD: 14,
  RSI_OB: 70,
  RSI_OS: 30,

  // ===== ATR =====
  ATR_PERIOD: 14,

  // ===== ADX =====
  ADX_PERIOD: 14,
  ADX_TREND_MIN: 25,

  // ===== SWING (پویا خواهد شد) =====
  SWING_LOOKBACK: 5,
  MIN_BREAK_STRENGTH: 0.15,

  // ===== آستانه اعتماد (تطبیقی) =====
  MIN_CONFIDENCE: 68,
  STRICT_MODE: true,

  // ===== بروکر =====
  BROKER_SPREAD_PIPS: 0.5,
  BROKER_COMMISSION: 0.0,
  BROKER_SLIPPAGE: 0.2,

  // ===== اخبار =====
  NEWS_BLACKOUT_MINUTES: 30,
  NEWS_API_KEY: "",

  // ===== قیمت =====
  PRICE_REFRESH_MS: 5000,

  // ===== اعلان =====
  NTFY_TOPIC: "goldai_signals",

  // ===== لات دستی =====
  USER_LOT: 0,

  // ===== اعتبارسنجی =====
  TRAIN_SPLIT: 0.7,
};
