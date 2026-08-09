// =====================================
// GoldAI Pro — Config
// =====================================

window.GoldAI_Config = {

  // Twelve Data API key
  API_KEY: "3302af6a7da54960b1dcef8db0edf78b",

  SYMBOL: "XAU/USD",

  // Timeframes
  TF_SCALP: "1min",
  TF_ENTRY: "5min",
  TF_SWING: "15min",
  TF_TREND: "1h",
  TF_H4: "4h",
  TF_DAILY: "1day",

  CANDLE_COUNT: 120,

  // Risk & Trade Settings (Professional Defaults)
  DEFAULT_CAPITAL: 10000,
  DEFAULT_RISK_PERCENT: 1.0, // Professional risk is typically 1%
  MAX_TRADES_PER_DAY: 5,

  // Preset Strategy Mode
  // "scalp" = M1/M5 with M15 confirmation
  // "swing" = H1/H4 with Daily confirmation
  STRATEGY_MODE: "scalp",

  // Target Take Profit Count (1, 2, or 3)
  TP_COUNT: 3,

  // Customizable multipliers for SL / TP
  ATR_SL_MULT: 1.5,
  ATR_TP1_MULT: 2.0,
  ATR_TP2_MULT: 3.5,
  ATR_TP3_MULT: 5.0,

  // EMA
  EMA_FAST: 20,
  EMA_MID: 50,
  EMA_SLOW: 200,

  // RSI
  RSI_PERIOD: 14,
  RSI_OB: 70,
  RSI_OS: 30,

  // ATR
  ATR_PERIOD: 14,

  // ADX
  ADX_PERIOD: 14,
  ADX_TREND_MIN: 25,

  // Structure
  SWING_LOOKBACK: 5,
  MIN_BREAK_STRENGTH: 0.15, // % of price

  // Decision
  MIN_CONFIDENCE: 62,
  STRICT_MODE: true,

  // Refresh
  PRICE_REFRESH_MS: 10000
};
