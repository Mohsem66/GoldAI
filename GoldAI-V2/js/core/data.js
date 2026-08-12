// =====================================
// GoldAI — Data Layer (Multi-TF & Multi-Symbol)
// =====================================

window.GoldAI_Data = {

  goldPrice: 0,
  candles: { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  closes: { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  highs:  { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  lows:   { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  volumes:{ m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },

  mapTF(tf) {
    const m = { "1min": "m1", "5min": "m5", "15min": "m15", "1h": "h1", "4h": "h4", "1day": "daily" };
    return m[tf] || "m5";
  },

  lastFetchTime: {},
  cache: {},
  lastPriceFetchTime: 0,

  async fetchSeries(interval) {
    const cfg = window.GoldAI_Config;
    if (!cfg.API_KEY || cfg.API_KEY === "YOUR_TWELVE_DATA_API_KEY") {
      return null;
    }

    const cacheKey = `${cfg.SYMBOL}_${interval}`;
    const now = Date.now();
    // Cache for 30 seconds to bypass rate-limiting limits and optimize performance speeds
    if (this.cache[cacheKey] && this.lastFetchTime[cacheKey] && (now - this.lastFetchTime[cacheKey] < 30000)) {
      console.log(`[Cache Hit] Returning cached series for ${cacheKey}`);
      return this.cache[cacheKey];
    }

    const url =
      `https://api.twelvedata.com/time_series?symbol=${cfg.SYMBOL}` +
      `&interval=${interval}&outputsize=${cfg.CANDLE_COUNT}&apikey=${cfg.API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.values) return this.cache[cacheKey] || null;
      const values = data.values.reverse();

      this.cache[cacheKey] = values;
      this.lastFetchTime[cacheKey] = now;
      return values;
    } catch (e) {
      console.error(`Error fetching ${cacheKey}:`, e);
      return this.cache[cacheKey] || null;
    }
  },

  store(key, values) {
    this.candles[key] = values;
    this.closes[key]  = values.map(c => Number(c.close));
    this.highs[key]   = values.map(c => Number(c.high));
    this.lows[key]    = values.map(c => Number(c.low));
    this.volumes[key] = values.map(c => Number(c.volume || 0));
  },

  async loadAll() {
    const cfg = window.GoldAI_Config;
    try {
      const [m1, m5, m15, h1, h4, daily] = await Promise.all([
        this.fetchSeries(cfg.TF_SCALP),
        this.fetchSeries(cfg.TF_ENTRY),
        this.fetchSeries(cfg.TF_SWING),
        this.fetchSeries(cfg.TF_TREND),
        this.fetchSeries(cfg.TF_H4),
        this.fetchSeries(cfg.TF_DAILY)
      ]);
      if (m1) this.store("m1", m1);
      if (m5) this.store("m5", m5);
      if (m15) this.store("m15", m15);
      if (h1) this.store("h1", h1);
      if (h4) this.store("h4", h4);
      if (daily) this.store("daily", daily);

      const primary = this.closes.m5.length ? this.closes.m5 : this.closes.m1;
      if (primary.length) this.goldPrice = primary[primary.length - 1];
    } catch (e) {
      console.error("Data load error:", e);
    }
    return this;
  },

  async loadPrice() {
    const cfg = window.GoldAI_Config;
    if (!cfg.API_KEY || cfg.API_KEY === "YOUR_TWELVE_DATA_API_KEY") {
      return this.goldPrice;
    }
    const now = Date.now();
    if (this.goldPrice > 0 && (now - this.lastPriceFetchTime < 5000)) {
      return this.goldPrice;
    }
    try {
      const url = `https://api.twelvedata.com/price?symbol=${cfg.SYMBOL}&apikey=${cfg.API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.price) {
        this.goldPrice = Number(data.price);
        this.lastPriceFetchTime = now;
      }
    } catch (e) {
      console.error("Price error:", e);
    }
    return this.goldPrice;
  },

  getCapital() {
    return Number(localStorage.getItem("goldai_capital") || window.GoldAI_Config.DEFAULT_CAPITAL);
  },

  setCapital(v) {
    localStorage.setItem("goldai_capital", String(Number(v)));
  },

  resetData() {
    this.goldPrice = 0;
    this.candles = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.closes = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.highs = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.lows = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.volumes = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
  },

  // Demo fallback when no API key - Enhanced to generate realistic values per currency pair
  seedDemo() {
    this.resetData();
    const cfg = window.GoldAI_Config;
    let basePrice = 2350;
    let volatilityScale = 1.0;

    const sym = (cfg.SYMBOL || "XAU/USD").toUpperCase();

    if (sym.includes("EUR/USD")) {
      basePrice = 1.0850;
      volatilityScale = 0.0008;
    } else if (sym.includes("GBP/USD")) {
      basePrice = 1.2720;
      volatilityScale = 0.0010;
    } else if (sym.includes("USD/JPY")) {
      basePrice = 156.40;
      volatilityScale = 0.12;
    } else if (sym.includes("AUD/USD")) {
      basePrice = 0.6650;
      volatilityScale = 0.0007;
    } else if (sym.includes("USD/CAD")) {
      basePrice = 1.3680;
      volatilityScale = 0.0008;
    } else if (sym.includes("GBP/JPY")) {
      basePrice = 198.80;
      volatilityScale = 0.18;
    } else if (sym.includes("EUR/JPY")) {
      basePrice = 169.50;
      volatilityScale = 0.15;
    } else {
      // Default Gold (XAUUSD)
      basePrice = 2350;
      volatilityScale = 1.2;
    }

    let p = basePrice;
    const gen = (n, vol) => {
      const c = [], h = [], l = [], cl = [], v = [];
      for (let i = 0; i < n; i++) {
        const d = (Math.random() - 0.48) * vol;
        const o = p;
        p = p + d;
        const hi = Math.max(o, p) + Math.random() * vol * 0.3;
        const lo = Math.min(o, p) - Math.random() * vol * 0.3;
        c.push({ open: o, high: hi, low: lo, close: p, volume: 800 + Math.random() * 400 });
        cl.push(p); h.push(hi); l.push(lo); v.push(800 + Math.random() * 400);
      }
      return { c, cl, h, l, v };
    };

    ["m1", "m5", "m15", "h1", "h4", "daily"].forEach((k, i) => {
      const g = gen(100, volatilityScale * (0.8 + i * 0.4));
      this.candles[k] = g.c;
      this.closes[k] = g.cl;
      this.highs[k] = g.h;
      this.lows[k] = g.l;
      this.volumes[k] = g.v;
    });

    this.goldPrice = this.closes.m5[this.closes.m5.length - 1];
  }
};
