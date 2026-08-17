// =====================================
// GoldAI — Data Layer
// Prefers backend; tracks dataMode + manual price lock
// =====================================

window.GoldAI_Data = {
  goldPrice: 0,
  capital: 10000,
  closes: { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  highs: { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  lows: { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  volumes: { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },
  candles: { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] },

  dataMode: "demo",
  manualPriceLock: false,
  livePriceOk: false,
  lastPriceFetchTime: 0,

  getCapital() { return this.capital || 10000; },
  setCapital(v) { this.capital = Number(v) || 10000; },

  isLiveReady() {
    return this.dataMode === "live" && this.livePriceOk;
  },

  async loadAll() {
    const cfg = window.GoldAI_Config || {};
    const backend = (cfg.BACKEND_URL || "http://localhost:5000/api").replace(/\/$/, "");
    let gotHistory = false;

    // Prefer backend historical
    try {
      const symbol = encodeURIComponent(cfg.SYMBOL || "XAU/USD");
      const intervals = [
        ["m5", "5min"], ["m1", "1min"], ["m15", "15min"],
        ["h1", "1h"], ["h4", "4h"], ["daily", "1day"]
      ];
      for (const [key, interval] of intervals) {
        try {
          const res = await fetch(`${backend}/historical?symbol=${symbol}&interval=${interval}&outputsize=${cfg.CANDLE_COUNT || 120}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.values && data.values.length) {
            this._applySeries(key, data.values);
            gotHistory = true;
          }
        } catch (_) {}
      }
      if (gotHistory) {
        this.dataMode = this.livePriceOk ? "live" : "mixed";
      }
    } catch (_) {}

    if (!gotHistory) {
      // try frontend twelve-data style if any config
      try {
        // fallback seed handled by caller
      } catch (_) {}
    }

    await this.loadPrice(true);
    if (!this.closes.m5.length) {
      // leave empty; app may seedDemo
    } else if (!this.goldPrice) {
      const primary = this.closes.m5;
      if (primary && primary.length) this.goldPrice = primary[primary.length - 1];
    }
  },

  _applySeries(key, values) {
    // Twelve Data returns newest first
    const rows = values.slice().reverse();
    this.closes[key] = rows.map(r => Number(r.close));
    this.highs[key] = rows.map(r => Number(r.high));
    this.lows[key] = rows.map(r => Number(r.low));
    this.volumes[key] = rows.map(r => Number(r.volume || 0));
    this.candles[key] = rows.map(r => ({
      open: Number(r.open), high: Number(r.high),
      low: Number(r.low), close: Number(r.close),
      volume: Number(r.volume || 0)
    }));
  },

  async loadPrice(force) {
    if (this.manualPriceLock && this.goldPrice > 0) return this.goldPrice;
    const now = Date.now();
    if (!force && this.goldPrice > 0 && (now - this.lastPriceFetchTime < 1500)) {
      return this.goldPrice;
    }
    const cfg = window.GoldAI_Config || {};
    const backend = (cfg.BACKEND_URL || "http://localhost:5000/api").replace(/\/$/, "");
    try {
      const symbol = encodeURIComponent(cfg.SYMBOL || "XAU/USD");
      const res = await fetch(`${backend}/price?symbol=${symbol}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.price) {
          this.goldPrice = Number(data.price);
          this.livePriceOk = true;
          this.lastPriceFetchTime = now;
          if (this.dataMode === "demo") this.dataMode = "mixed";
          return this.goldPrice;
        }
      }
    } catch (_) {}
    return this.goldPrice;
  },

  seedDemo() {
    const base = this.goldPrice > 0 ? this.goldPrice : 2650;
    const n = 120;
    let price = base;
    const mk = () => {
      const closes = [], highs = [], lows = [], vols = [], candles = [];
      price = base;
      for (let i = 0; i < n; i++) {
        const drift = (Math.random() - 0.48) * 2.5;
        const open = price;
        const close = price + drift;
        const high = Math.max(open, close) + Math.random() * 1.2;
        const low = Math.min(open, close) - Math.random() * 1.2;
        closes.push(close); highs.push(high); lows.push(low);
        vols.push(100 + Math.random() * 50);
        candles.push({ open, high, low, close, volume: vols[vols.length - 1] });
        price = close;
      }
      return { closes, highs, lows, vols, candles };
    };
    const keepPrice = this.livePriceOk ? this.goldPrice : 0;
    for (const k of ["m1", "m5", "m15", "h1", "h4", "daily"]) {
      const s = mk();
      this.closes[k] = s.closes;
      this.highs[k] = s.highs;
      this.lows[k] = s.lows;
      this.volumes[k] = s.vols;
      this.candles[k] = s.candles;
    }
    this.dataMode = "demo";
    if (keepPrice) {
      this.goldPrice = keepPrice;
      this.dataMode = "mixed";
    } else {
      this.goldPrice = this.closes.m5[this.closes.m5.length - 1];
    }
  }
};
