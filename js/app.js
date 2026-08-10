// =====================================
// GoldAI Pro — Main Orchestrator (Quality build)
// =====================================

window.GoldAI = {
  lastResult: null,
  backendURL: "http://localhost:5000/api",
  currentUID: null,

  async init() {
    const data = window.GoldAI_Data;
    this.loadSettings();
    await data.loadAll();
    if (!data.closes.m5.length) { data.seedDemo(); data._demoMode = true; }
    else data._demoMode = false;
    await data.loadPrice();
    this.updatePriceUI();
    this.updateMarketClock();
    this.updateRiskUI();
    setInterval(() => this.updateMarketClock(), 1000);
    setInterval(async () => { await data.loadPrice(); this.updatePriceUI(); }, window.GoldAI_Config.PRICE_REFRESH_MS || 10000);
    console.log("GoldAI Pro ready");
  },

  getDecimals() {
    const sym = (window.GoldAI_Config.SYMBOL || "XAU/USD").toUpperCase();
    if (sym.includes("JPY")) return 3;
    if (sym.includes("XAU") || sym.includes("GOLD")) return 2;
    return 5;
  },

  loadSettings() {
    try {
      const stored = localStorage.getItem("goldai_settings");
      if (!stored) return;
      const p = JSON.parse(stored);
      if (p.capital) window.GoldAI_Data.setCapital(p.capital);
      if (p.risk) window.GoldAI_Config.DEFAULT_RISK_PERCENT = p.risk;
      if (p.strategy) window.GoldAI_Config.STRATEGY_MODE = p.strategy;
      if (p.tpCount) window.GoldAI_Config.TP_COUNT = p.tpCount;
      if (p.symbol) window.GoldAI_Config.SYMBOL = p.symbol;
      if (p.uid) this.currentUID = p.uid;
    } catch (e) { console.error(e); }
  },

  updatePriceUI() {
    const el = document.getElementById("goldPrice");
    if (el) el.textContent = window.GoldAI_Data.goldPrice
      ? window.GoldAI_Data.goldPrice.toFixed(this.getDecimals()) : "—";
  },

  updateRiskUI() {
    const cap = window.GoldAI_Data.getCapital();
    const risk = window.GoldAI_Config.DEFAULT_RISK_PERCENT;
    const maxLoss = ((cap * risk) / 100).toFixed(2);
    const lot = Math.max(0.01, Number((cap / 10000).toFixed(2)));
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("capitalText", cap);
    set("riskText", risk + "%");
    set("maxLossText", maxLoss);
    set("lotText", lot);
  },

  updateMarketClock() {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    let open = true;
    if (day === 6) open = false;
    if (day === 0 && hour < 22) open = false;
    if (day === 5 && hour >= 22) open = false;
    let session = "Sydney";
    if (hour >= 7 && hour < 12) session = "Tokyo";
    else if (hour >= 12 && hour < 17) session = "London";
    else if (hour >= 17) session = "New York";
    const ms = document.getElementById("marketStatus");
    const ss = document.getElementById("marketSession");
    const ts = document.getElementById("tradeStatus");
    if (ms) ms.textContent = open ? "OPEN" : "CLOSED";
    if (ss) ss.textContent = session;
    if (ts) {
      ts.textContent = open ? "SAFE TO TRADE" : "DO NOT TRADE";
      ts.className = open ? "ok" : "bad";
    }
  },

  changeCapital() {
    const cur = window.GoldAI_Data.getCapital();
    const v = prompt("Capital ($)", cur);
    if (v == null) return;
    const n = Number(v);
    if (isNaN(n) || n <= 0) return alert("Invalid number");
    window.GoldAI_Data.setCapital(n);
    this.updateRiskUI();
  },

  async analyze() {
    const btn = document.getElementById("analyzeBtn");
    const status = document.getElementById("aiStatus");
    if (btn) btn.disabled = true;
    if (status) status.textContent = "Analyzing...";
    try {
      const data = window.GoldAI_Data;
      const cfg = window.GoldAI_Config;
      await data.loadAll();
      if (!data.closes.m5.length) { data.seedDemo(); data._demoMode = true; }
      else data._demoMode = false;
      await data.loadPrice();
      this.updatePriceUI();

      let entryTF = "m5", biasTF = "h1", scalpTF = "m1";
      if (cfg.STRATEGY_MODE === "swing") {
        entryTF = "h1"; biasTF = "daily"; scalpTF = "m15";
      }

      const closes = data.closes[entryTF];
      const highs = data.highs[entryTF];
      const lows = data.lows[entryTF];
      const vols = data.volumes[entryTF];
      const candles = data.candles[entryTF];
      let price = data.goldPrice || closes[closes.length - 1];
      const manualInput = document.getElementById("manualEntryInput");
      if (manualInput && manualInput.value.trim() !== "") {
        const parsed = Number(manualInput.value);
        if (!isNaN(parsed) && parsed > 0) price = parsed;
      }

      const htfCloses = data.closes[biasTF] || closes;
      const htfHighs = data.highs[biasTF] || highs;
      const htfLows = data.lows[biasTF] || lows;
      const m1Closes = data.closes[scalpTF] || [];

      const ema = window.GoldAI_EMA.analyzeEMA(closes, price, cfg);
      const rsi = window.GoldAI_RSI.analyzeRSI(closes, cfg);
      const div = window.GoldAI_Divergence.analyzeDivergence(closes, rsi.history || []);
      const structure = window.GoldAI_MarketStructure.analyzeMarketStructure(highs, lows, closes, cfg);
      const macd = window.GoldAI_MACD.analyzeMACD(closes);
      const adx = window.GoldAI_ADX.analyzeADX(highs, lows, closes, cfg.ADX_PERIOD || 14);
      const atrL = window.GoldAI_ATR.analyzeATR(highs, lows, closes, cfg);
      const volume = window.GoldAI_Volume.analyzeVolume(vols, closes);
      const sr = window.GoldAI_SR.analyzeSR(highs, lows, price, cfg);
      const candleP = window.GoldAI_Candles.analyzeCandles(candles);
      const liq = window.GoldAI_Liquidity.analyzeLiquidity(highs, lows, closes);

      const htfEma = window.GoldAI_EMA.analyzeEMA(htfCloses, htfCloses[htfCloses.length - 1], cfg);
      const htfStr = window.GoldAI_MarketStructure.analyzeMarketStructure(htfHighs, htfLows, htfCloses, cfg);
      const htf = {
        trend: htfStr.trend !== "UNKNOWN" ? htfStr.trend : htfEma.trend,
        strength: (htfEma.confidence || 0) > 70 ? "STRONG" : "WEAK"
      };

      let m1 = null;
      if (m1Closes.length > 5) {
        const m1Ema = window.GoldAI_EMA.analyzeEMA(m1Closes, m1Closes[m1Closes.length - 1], cfg);
        m1 = { microstructure: m1Ema.trend };
      }

      const fundamental = window.GoldAI_Fundamental
        ? window.GoldAI_Fundamental.analyzeFundamentals(cfg) : null;
      const correlation = window.GoldAI_Correlation
        ? window.GoldAI_Correlation.analyzeCorrelation(closes, price) : null;

      const layers = {
        ema, rsi, divergence: div, structure, macd, adx,
        atr: atrL, volume, sr, candles: candleP, liquidity: liq, htf, m1,
        fundamental, correlation
      };

      if (window.GoldAI_AIBrain) {
        layers.aiBrain = window.GoldAI_AIBrain.analyze(layers);
      }

      const raw = window.GoldAI_Score.runScoreEngine(layers);
      const final = window.GoldAI_Conflict.runConflictFilter(raw, layers, cfg);
      const plan = window.GoldAI_Trade.createTradePlan(
        final.signal, price, atrL.atr, data.getCapital(), cfg.DEFAULT_RISK_PERCENT, cfg
      );

      const now = new Date();
      const result = {
        ...final, ...plan, price, layers,
        time: now.toLocaleString("fa-IR"),
        timestamp: now.toISOString(),
        tf: cfg.STRATEGY_MODE === "scalp" ? "M1/M5" : "H1/Daily",
        dataMode: data._demoMode ? "DEMO" : "LIVE"
      };

      this.lastResult = result;
      window.GoldAI_V1_Result = result;
      this.render(result);
      this.saveHistory(result);
      if (status) status.textContent = "Done · " + result.dataMode;
    } catch (e) {
      console.error(e);
      if (status) status.textContent = "Error";
      alert("Analysis error: " + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  render(r) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const decs = this.getDecimals();
    const fmt = (n) => (n == null || isNaN(n) || typeof n === "string") ? n : Number(n).toFixed(decs);

    set("signal", r.signal);
    set("confidence", r.confidence + "%");
    set("entry", fmt(r.entry));
    set("sl", fmt(r.stopLoss));
    set("tp1", fmt(r.tp1));
    set("tp2", fmt(r.tp2));
    set("tp3", fmt(r.tp3));
    set("rr", r.riskReward);
    set("lotSize", r.lot);
    set("quality", r.entryQuality);
    set("aiReason", r.reason || "—");

    const sig = document.getElementById("signal");
    if (sig) {
      sig.className = "signal-value";
      if (r.signal.includes("BUY")) sig.classList.add("buy");
      else if (r.signal.includes("SELL")) sig.classList.add("sell");
      else sig.classList.add("wait");
    }

    const L = r.layers || {};
    set("dEma20", L.ema?.ema20 != null ? Number(L.ema.ema20).toFixed(decs) : "—");
    set("dEma50", L.ema?.ema50 != null ? Number(L.ema.ema50).toFixed(decs) : "—");
    set("dEma200", L.ema?.ema200 != null ? Number(L.ema.ema200).toFixed(decs) : "—");
    set("dRsi", L.rsi?.rsi ?? "—");
    set("dMacd", L.macd?.hist ?? "—");
    set("dAdx", L.adx?.adx ?? "—");
    set("dAtr", L.atr?.atr ?? "—");
    set("dStruct", L.structure?.structure ?? "—");
    set("dBos", L.structure?.bos ? L.structure.bosDir : "—");
    set("dChoch", L.structure?.choch ? L.structure.chochDir : "—");
    set("dDiv", L.divergence?.type ?? "—");
    set("dRegime", L.adx?.regime ?? L.structure?.regime ?? "—");
    set("dLiq", L.liquidity?.sweep ?? "—");
    set("dCandle", L.candles?.pattern ?? "—");
    set("dVol", L.volume?.ratio ?? "—");

    const AI = L.aiBrain || {};
    set("dAiSignal", AI.aiSignal ?? "—");
    set("dAiConf", AI.aiConfidence != null ? AI.aiConfidence + "%" : "—");
    const reasoningEl = document.getElementById("dAiReasoning");
    if (reasoningEl) reasoningEl.textContent = AI.reasoning || "—";

    const warnBox = document.getElementById("warnings");
    if (warnBox) {
      const c = (r.confirms || []).map(x => "✅ " + x).join("<br>");
      const w = (r.warnings || []).map(x => "⚠️ " + x).join("<br>");
      warnBox.innerHTML = (c ? c + "<br>" : "") + (w || "");
    }
    document.getElementById("resultCard")?.classList.remove("hidden");
  },

  saveHistory(r) {
    let h = [];
    try { h = JSON.parse(localStorage.getItem("goldai_history") || "[]"); } catch (_) {}
    h.unshift({
      t: r.time, symbol: window.GoldAI_Config.SYMBOL || "XAU/USD",
      signal: r.signal, entry: r.entry, sl: r.stopLoss,
      tp1: r.tp1, tp2: r.tp2, tp3: r.tp3, conf: r.confidence,
      timestamp: r.timestamp, dataMode: r.dataMode
    });
    localStorage.setItem("goldai_history", JSON.stringify(h.slice(0, 50)));
  },

  showPanel(name) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    document.getElementById("panel-" + name)?.classList.remove("hidden");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('[data-panel="' + name + '"]')?.classList.add("active");
    if (name === "performance") this.renderPerformance();
    if (name === "details" && this.lastResult) this.render(this.lastResult);
  },

  renderPerformance() {
    let h = [];
    try { h = JSON.parse(localStorage.getItem("goldai_history") || "[]"); } catch (_) {}
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    let buys = 0, sells = 0, waits = 0, wins = 0, losses = 0, profit = 0, loss = 0;
    h.forEach(x => {
      if ((x.signal || "").includes("BUY")) buys++;
      else if ((x.signal || "").includes("SELL")) sells++;
      else waits++;
      if (x.outcome === "WIN") { wins++; profit += Number(x.pnl || 0); }
      else if (x.outcome === "LOSS") { losses++; loss += Math.abs(Number(x.pnl || 0)); }
    });
    const total = wins + losses;
    set("perfTotal", h.length);
    set("perfBuy", buys);
    set("perfSell", sells);
    set("perfWait", waits);
    set("perfWinRate", total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "N/A");
    set("perfProfit", "$" + profit.toFixed(2));
    set("perfLoss", "$" + loss.toFixed(2));
  },

  clearPerformanceHistory() {
    if (confirm("Clear history?")) {
      localStorage.removeItem("goldai_history");
      this.renderPerformance();
    }
  },

  copySignal() {
    const r = this.lastResult;
    if (!r) return alert("Run analysis first");
    const decs = this.getDecimals();
    const fmt = (n) => (n == null || isNaN(n) || typeof n === "string") ? n : Number(n).toFixed(decs);
    const text = "GoldAI " + (window.GoldAI_Config.SYMBOL || "XAU/USD") + "\n" +
      r.signal + " | Conf " + r.confidence + "% | " + (r.dataMode || "") + "\n" +
      "Entry: " + fmt(r.entry) + "\nSL: " + fmt(r.stopLoss) + "\n" +
      "TP1: " + fmt(r.tp1) + " TP2: " + fmt(r.tp2) + " TP3: " + fmt(r.tp3) + "\n" +
      "RR: " + r.riskReward + " Lot: " + r.lot + "\n" + (r.reason || "");
    navigator.clipboard.writeText(text).then(() => alert("Copied"));
  }
};

document.addEventListener("DOMContentLoaded", () => window.GoldAI.init());
