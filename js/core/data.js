// =====================================
// GoldAI — Data Layer (Multi-TF)
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

  async fetchSeries(interval) {
    const cfg = window.GoldAI_Config;
    if (!cfg.API_KEY || cfg.API_KEY === "YOUR_TWELVE_DATA_API_KEY") {
      return null;
    }
    const url =
      `https://api.twelvedata.com/time_series?symbol=${cfg.SYMBOL}` +
      `&interval=${interval}&outputsize=${cfg.CANDLE_COUNT}&apikey=${cfg.API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.values) return null;
    return data.values.reverse();
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
    try {
      const url = `https://api.twelvedata.com/price?symbol=${cfg.SYMBOL}&apikey=${cfg.API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.price) this.goldPrice = Number(data.price);
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

  // Demo fallback when no API key
  seedDemo() {
    if (this.closes.m5.length) return;
    let p = 2350;
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
      const g = gen(100, 0.8 + i * 0.4);
      this.candles[k] = g.c;
      this.closes[k] = g.cl;
      this.highs[k] = g.h;
      this.lows[k] = g.l;
      this.volumes[k] = g.v;
    });
    this.goldPrice = this.closes.m5[this.closes.m5.length - 1];
  }
};
