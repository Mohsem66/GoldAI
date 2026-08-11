// =====================================
// GoldAI — Data Layer (fast live price + essential TFs)
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
  livePriceOk: false,

  async fetchSeries(interval) {
    const cfg = window.GoldAI_Config;
    if (!cfg.API_KEY || cfg.API_KEY === "YOUR_TWELVE_DATA_API_KEY") return null;

    const cacheKey = cfg.SYMBOL + "_" + interval;
    const now = Date.now();
    if (this.cache[cacheKey] && this.lastFetchTime[cacheKey] && (now - this.lastFetchTime[cacheKey] < 45000)) {
      return this.cache[cacheKey];
    }

    const url =
      "https://api.twelvedata.com/time_series?symbol=" + encodeURIComponent(cfg.SYMBOL) +
      "&interval=" + interval + "&outputsize=" + (cfg.CANDLE_COUNT || 120) +
      "&apikey=" + cfg.API_KEY;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code || data.status === "error" || !data.values) {
        console.warn("[Series]", interval, data.message || data.code || "no values");
        return this.cache[cacheKey] || null;
      }
      const values = data.values.slice().reverse();
      this.cache[cacheKey] = values;
      this.lastFetchTime[cacheKey] = now;
      return values;
    } catch (e) {
      console.error("Error fetching " + cacheKey + ":", e);
      return this.cache[cacheKey] || null;
    }
  },

  store(key, values) {
    this.candles[key] = values;
    this.closes[key]  = values.map(function (c) { return Number(c.close); });
    this.highs[key]   = values.map(function (c) { return Number(c.high); });
    this.lows[key]    = values.map(function (c) { return Number(c.low); });
    this.volumes[key] = values.map(function (c) { return Number(c.volume || 0); });
  },

  // Only TFs needed for current strategy (much faster)
  async loadEssential() {
    const cfg = window.GoldAI_Config;
    try {
      await this.loadPrice(true);

      var plan;
      if (cfg.STRATEGY_MODE === "swing") {
        plan = [
          [cfg.TF_TREND, "h1"],
          [cfg.TF_H4, "h4"],
          [cfg.TF_DAILY, "daily"],
          [cfg.TF_SWING, "m15"]
        ];
      } else {
        plan = [
          [cfg.TF_ENTRY, "m5"],
          [cfg.TF_SWING, "m15"],
          [cfg.TF_TREND, "h1"],
          [cfg.TF_SCALP, "m1"]
        ];
      }

      for (var i = 0; i < plan.length; i++) {
        var interval = plan[i][0];
        var key = plan[i][1];
        if (this.closes[key] && this.closes[key].length > 30) {
          var cacheKey = cfg.SYMBOL + "_" + interval;
          var t = this.lastFetchTime[cacheKey] || 0;
          if (Date.now() - t < 45000) continue;
        }
        var values = await this.fetchSeries(interval);
        if (values && values.length) this.store(key, values);
      }

      if (!this.livePriceOk || !this.goldPrice) {
        var primary = this.closes.m5.length ? this.closes.m5
          : (this.closes.h1.length ? this.closes.h1 : this.closes.m1);
        if (primary && primary.length) this.goldPrice = primary[primary.length - 1];
      }
    } catch (e) {
      console.error("loadEssential error:", e);
    }
    return this;
  },

  async loadAll() {
    return this.loadEssential();
  },

  async loadPrice(force) {
    const cfg = window.GoldAI_Config;
    if (!cfg.API_KEY || cfg.API_KEY === "YOUR_TWELVE_DATA_API_KEY") {
      return this.goldPrice;
    }
    const now = Date.now();
    if (!force && this.goldPrice > 0 && (now - this.lastPriceFetchTime < 1500)) {
      return this.goldPrice;
    }
    try {
      const url = "https://api.twelvedata.com/price?symbol=" +
        encodeURIComponent(cfg.SYMBOL) + "&apikey=" + cfg.API_KEY;
      const res = await fetch(url);
      const data = await res.json();
      if (data.price) {
        this.goldPrice = Number(data.price);
        this.lastPriceFetchTime = now;
        this.livePriceOk = true;
      } else if (data.code || data.status === "error") {
        console.warn("[Price]", data.message || data.code);
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
    this.livePriceOk = false;
    this.candles = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.closes = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.highs = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.lows = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
    this.volumes = { m1: [], m5: [], m15: [], h1: [], h4: [], daily: [] };
  },

  seedDemo() {
    var keepPrice = this.livePriceOk ? this.goldPrice : 0;
    this.resetData();
    if (keepPrice) {
      this.goldPrice = keepPrice;
      this.livePriceOk = true;
    }

    var cfg = window.GoldAI_Config;
    var basePrice = keepPrice || 2350;
    var volatilityScale = 1.0;
    var sym = (cfg.SYMBOL || "XAU/USD").toUpperCase();

    if (!keepPrice) {
      if (sym.indexOf("EUR/USD") >= 0) { basePrice = 1.0850; volatilityScale = 0.0008; }
      else if (sym.indexOf("GBP/USD") >= 0) { basePrice = 1.2720; volatilityScale = 0.0010; }
      else if (sym.indexOf("USD/JPY") >= 0) { basePrice = 156.40; volatilityScale = 0.12; }
      else if (sym.indexOf("AUD/USD") >= 0) { basePrice = 0.6650; volatilityScale = 0.0007; }
      else if (sym.indexOf("USD/CAD") >= 0) { basePrice = 1.3680; volatilityScale = 0.0008; }
      else if (sym.indexOf("GBP/JPY") >= 0) { basePrice = 198.80; volatilityScale = 0.18; }
      else if (sym.indexOf("EUR/JPY") >= 0) { basePrice = 169.50; volatilityScale = 0.15; }
      else { basePrice = 2350; volatilityScale = 1.2; }
    } else {
      volatilityScale = (sym.indexOf("XAU") >= 0 || sym.indexOf("GOLD") >= 0) ? 1.2 : 0.001;
    }

    var p = basePrice;
    var gen = function (n, vol) {
      var c = [], h = [], l = [], cl = [], v = [];
      for (var i = 0; i < n; i++) {
        var d = (Math.random() - 0.48) * vol;
        var o = p;
        p = p + d;
        var hi = Math.max(o, p) + Math.random() * vol * 0.3;
        var lo = Math.min(o, p) - Math.random() * vol * 0.3;
        c.push({ open: o, high: hi, low: lo, close: p, volume: 800 + Math.random() * 400 });
        cl.push(p); h.push(hi); l.push(lo); v.push(800 + Math.random() * 400);
      }
      return { c: c, cl: cl, h: h, l: l, v: v };
    };

    ["m1", "m5", "m15", "h1", "h4", "daily"].forEach(function (k, i) {
      var g = gen(100, volatilityScale * (0.8 + i * 0.4));
      this.candles[k] = g.c;
      this.closes[k] = g.cl;
      this.highs[k] = g.h;
      this.lows[k] = g.l;
      this.volumes[k] = g.v;
    }.bind(this));

    if (!this.livePriceOk) {
      this.goldPrice = this.closes.m5[this.closes.m5.length - 1];
    }
  }
};
