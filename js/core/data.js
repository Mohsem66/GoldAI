// =====================================
// GoldAI — Data Layer
// Prefers backend; free public fallback; demo seed near current gold
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
  priceSource: "none",

  // Realistic 2026-era default when everything else fails (was 2650 — outdated)
  DEMO_BASE_PRICE: 4400,

  getCapital() { return this.capital || 10000; },
  setCapital(v) { this.capital = Number(v) || 10000; },

  isLiveReady() {
    return this.dataMode === "live" && this.livePriceOk;
  },

  async loadAll() {
    const cfg = window.GoldAI_Config || {};
    const backend = (cfg.BACKEND_URL || "http://localhost:5000/api").replace(/\/$/, "");
    let gotHistory = false;

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

    await this.loadPrice(true);
    if (!this.closes.m5.length) {
      // leave empty; app may seedDemo
    } else if (!this.goldPrice) {
      const primary = this.closes.m5;
      if (primary && primary.length) this.goldPrice = primary[primary.length - 1];
    }
  },

  _applySeries(key, values) {
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

  /** Free public spot gold (no API key). Best-effort only. */
  async _fetchPublicGoldPrice() {
    // 1) metals.live
    try {
      const res = await fetch("https://api.metals.live/v1/spot/gold", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // can be [{gold: 4390}] or number
        let p = null;
        if (Array.isArray(data) && data[0]) {
          p = data[0].gold || data[0].price || data[0].XAU || Object.values(data[0])[0];
        } else if (typeof data === "number") {
          p = data;
        } else if (data && typeof data === "object") {
          p = data.gold || data.price || data.XAU;
        }
        p = Number(p);
        if (p > 1000 && p < 20000) return p;
      }
    } catch (_) {}

    // 2) goldprice.org style
    try {
      const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const item = data && data.items && data.items[0];
        const p = Number(item && item.xauPrice);
        if (p > 1000 && p < 20000) return p;
      }
    } catch (_) {}

    return null;
  },

  async loadPrice(force) {
    if (this.manualPriceLock && this.goldPrice > 0) return this.goldPrice;
    const now = Date.now();
    if (!force && this.goldPrice > 0 && (now - this.lastPriceFetchTime < 1500)) {
      return this.goldPrice;
    }
    const cfg = window.GoldAI_Config || {};
    const backend = (cfg.BACKEND_URL || "http://localhost:5000/api").replace(/\/$/, "");

    // 1) Backend / Twelve Data
    try {
      const symbol = encodeURIComponent(cfg.SYMBOL || "XAU/USD");
      const res = await fetch(`${backend}/price?symbol=${symbol}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.price) {
          this.goldPrice = Number(data.price);
          this.livePriceOk = true;
          this.priceSource = data.source || "backend";
          this.lastPriceFetchTime = now;
          if (this.dataMode === "demo") this.dataMode = "mixed";
          return this.goldPrice;
        }
      }
    } catch (_) {}

    // 2) Free public fallback (only for XAU/gold-like symbols)
    const sym = String(cfg.SYMBOL || "XAU/USD").toUpperCase();
    if (sym.includes("XAU") || sym.includes("GOLD")) {
      try {
        const pub = await this._fetchPublicGoldPrice();
        if (pub) {
          this.goldPrice = pub;
          this.livePriceOk = true;
          this.priceSource = "public_fallback";
          this.lastPriceFetchTime = now;
          if (this.dataMode === "demo") this.dataMode = "mixed";
          return this.goldPrice;
        }
      } catch (_) {}
    }

    return this.goldPrice;
  },

  seedDemo() {
    const base = this.goldPrice > 1000 ? this.goldPrice : (this.DEMO_BASE_PRICE || 4400);
    const n = 120;
    let price = base;
    const mk = () => {
      const closes = [], highs = [], lows = [], vols = [], candles = [];
      price = base;
      // Scale noise with price level (~0.05% per step near 4400)
      const noise = Math.max(1.5, base * 0.0006);
      for (let i = 0; i < n; i++) {
        const drift = (Math.random() - 0.48) * noise * 2;
        const open = price;
        const close = price + drift;
        const high = Math.max(open, close) + Math.random() * noise;
        const low = Math.min(open, close) - Math.random() * noise;
        closes.push(close); highs.push(high); lows.push(low);
        vols.push(100 + Math.random() * 50);
        candles.push({ open, high, low, close, volume: vols[vols.length - 1] });
        price = close;
      }
      return { closes, highs, lows, vols, candles };
    };
    const keepPrice = this.livePriceOk && this.goldPrice > 1000 ? this.goldPrice : 0;
    for (const k of ["m1", "m5", "m15", "h1", "h4", "daily"]) {
      const s = mk();
      this.closes[k] = s.closes;
      this.highs[k] = s.highs;
      this.lows[k] = s.lows;
      this.volumes[k] = s.vols;
      this.candles[k] = s.candles;
    }
    this.dataMode = "demo";
    this.priceSource = keepPrice ? (this.priceSource || "public_fallback") : "demo_seed";
    if (keepPrice) {
      this.goldPrice = keepPrice;
      this.dataMode = "mixed";
    } else {
      this.goldPrice = this.closes.m5[this.closes.m5.length - 1];
    }
  }
};
