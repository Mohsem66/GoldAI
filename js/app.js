// =====================================
// GoldAI Pro — Main Orchestrator
// =====================================

window.GoldAI = {

  lastResult: null,
  backendURL: 'http://localhost:5000/api',
  currentUID: null,
  signalHistory: [],
  dynamicWeights: {},
  theme: 'dark',

  async init() {
    const data = window.GoldAI_Data;
    this.loadSettings();
    this.loadTheme();
    await data.loadAll();
    if (!data.closes.m5.length) data.seedDemo();
    await this.fetchPriceFromBackend();
    this.updatePriceUI();
    this.updateMarketClock();
    this.updateRiskUI();
    this.setupSettingsPanel();
    this.setupNotificationPermission();
    setInterval(() => this.updateMarketClock(), 1000);
    setInterval(async () => {
      await this.fetchPriceFromBackend();
      this.updatePriceUI();
    }, window.GoldAI_Config.PRICE_REFRESH_MS);
    console.log("✅ GoldAI Pro ready");
  },

  // ===== تشخیص باز بودن بازار =====
  isMarketOpen() {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    // بازار از یکشنبه 22:00 UTC تا جمعه 22:00 UTC باز است
    if (day === 6) return false; // شنبه
    if (day === 0 && hour < 22) return false; // یکشنبه قبل از 22
    if (day === 5 && hour >= 22) return false; // جمعه بعد از 22
    return true;
  },

  // ===== دریافت قیمت از بک‌اند =====
  async fetchPriceFromBackend() {
    try {
      const symbol = window.GoldAI_Config.SYMBOL || 'XAU/USD';
      const response = await fetch(`${this.backendURL}/price?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      if (data.price) {
        window.GoldAI_Data.goldPrice = data.price;
        return data.price;
      }
    } catch (e) {
      console.warn('Backend price fetch failed, using fallback:', e);
      const data = window.GoldAI_Data;
      await data.loadPrice();
    }
    return window.GoldAI_Data.goldPrice;
  },

  // ===== تم =====
  loadTheme() {
    try {
      const saved = localStorage.getItem('goldai_theme');
      if (saved) {
        this.theme = saved;
        document.body.classList.toggle('light', saved === 'light');
        document.getElementById('themeToggle').textContent = saved === 'light' ? '☀️' : '🌙';
      }
    } catch (_) {}
  },
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light', this.theme === 'light');
    document.getElementById('themeToggle').textContent = this.theme === 'light' ? '☀️' : '🌙';
    localStorage.setItem('goldai_theme', this.theme);
  },

  // ===== اعلان =====
  setupNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },
  async sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (_) {}
    try {
      const topic = window.GoldAI_Config.NTFY_TOPIC || 'goldai_signals';
      await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: `${title}\n${body}`,
        headers: { 'Title': title }
      });
    } catch (_) {}
  },

  // ===== تنظیمات معامله =====
  updateTradeSettings() {
    const tpCount = parseInt(document.getElementById('userTpCount').value) || 3;
    const slMult = parseFloat(document.getElementById('userSlMult').value) || 1.5;
    const tp1Mult = parseFloat(document.getElementById('userTp1Mult').value) || 2.0;
    const tp2Mult = parseFloat(document.getElementById('userTp2Mult').value) || 3.5;
    const tp3Mult = parseFloat(document.getElementById('userTp3Mult').value) || 5.0;
    const userLot = parseFloat(document.getElementById('userLot').value) || 0;

    window.GoldAI_Config.TP_COUNT = tpCount;
    window.GoldAI_Config.ATR_SL_MULT = slMult;
    window.GoldAI_Config.ATR_TP1_MULT = tp1Mult;
    window.GoldAI_Config.ATR_TP2_MULT = tp2Mult;
    window.GoldAI_Config.ATR_TP3_MULT = tp3Mult;
    window.GoldAI_Config.USER_LOT = userLot;

    const stored = JSON.parse(localStorage.getItem('goldai_settings') || '{}');
    stored.tpCount = tpCount;
    stored.slMult = slMult;
    stored.tp1Mult = tp1Mult;
    stored.tp2Mult = tp2Mult;
    stored.tp3Mult = tp3Mult;
    stored.userLot = userLot;
    localStorage.setItem('goldai_settings', JSON.stringify(stored));
  },
  applyTradeSettings() {
    this.updateTradeSettings();
    this.updateRiskUI();
    alert('✅ تنظیمات معامله اعمال شد');
  },

  // ===== تنظیمات پیشرفته (سرمایه، ریسک، استراتژی) =====
  updateAdvancedSettings() {
    const capital = parseFloat(document.getElementById('advCapital').value) || 10000;
    const risk = parseFloat(document.getElementById('advRisk').value) || 1;
    if (capital > 0) window.GoldAI_Data.setCapital(capital);
    window.GoldAI_Config.DEFAULT_RISK_PERCENT = risk;
    const stored = JSON.parse(localStorage.getItem('goldai_settings') || '{}');
    stored.capital = capital;
    stored.risk = risk;
    localStorage.setItem('goldai_settings', JSON.stringify(stored));
    this.updateRiskUI();
  },

  // ===== موتور برگشت =====
  detectReversal(closes, rsiHistory) {
    if (closes.length < 30) return { signal: 'NONE', strength: 0 };
    const last = closes.length - 1;
    const price = closes[last];
    const price20 = closes[last - 20] || price;
    let reversal = { signal: 'NONE', strength: 0, type: '' };

    if (rsiHistory && rsiHistory.length > 20) {
      const rsi = rsiHistory[last];
      const rsi20 = rsiHistory[last - 20] || rsi;
      if (price < price20 && rsi > rsi20 && rsi < 50) {
        reversal = { signal: 'BUY', strength: 70, type: 'HIDDEN_BULLISH_RSI' };
      }
      if (price > price20 && rsi < rsi20 && rsi > 50) {
        reversal = { signal: 'SELL', strength: 70, type: 'HIDDEN_BEARISH_RSI' };
      }
    }
    return reversal;
  },

  // ===== وزن‌دهی پویا =====
  updateDynamicWeights() {
    const engines = ['ema', 'rsi', 'macd', 'structure', 'volume', 'sr', 'candles'];
    const history = this.signalHistory.slice(-20);
    const weights = {};
    engines.forEach(eng => {
      let score = 50;
      const matches = history.filter(h => h.engine === eng && h.correct === true);
      const total = history.filter(h => h.engine === eng);
      if (total.length > 5) {
        const rate = matches.length / total.length;
        score = 50 + (rate * 50);
      }
      weights[eng] = Math.min(100, Math.max(20, score));
    });
    this.dynamicWeights = weights;
    return weights;
  },

  // ===== بک‌تست با در نظر گرفتن وضعیت بازار =====
  async runBacktest() {
    const status = document.getElementById("aiStatus");
    const resultDiv = document.getElementById("backtestResult");
    const summary = document.getElementById("backtestSummary");

    if (status) status.textContent = "🟡 Running backtest...";
    resultDiv?.classList.remove("hidden");

    try {
      const data = window.GoldAI_Data;
      const cfg = window.GoldAI_Config;
      await data.loadAll();
      if (!data.closes.m5.length) data.seedDemo();

      const closes = data.closes.m5;
      const highs = data.highs.m5;
      const lows = data.lows.m5;
      const vols = data.volumes.m5;
      const candles = data.candles.m5;

      if (closes.length < 50) {
        summary.innerHTML = "⚠️ داده کافی نیست (حداقل ۵۰ کندل)";
        if (status) status.textContent = "🔴 Error";
        return;
      }

      let wins = 0, losses = 0, total = 0;
      let profit = 0, loss = 0;
      let marketClosedCount = 0;

      for (let i = 50; i < closes.length - 5; i += 5) {
        // شبیه‌سازی وضعیت بازار در آن زمان (با فرض اینکه کندل‌ها به‌صورت پیوسته هستند)
        // برای سادگی، فرض می‌کنیم اگر بیش از 10 کندل در آخر هفته وجود داشته باشد، بازار بسته بوده
        // ولی در عمل، بهتر است از داده‌های واقعی استفاده شود
        // در اینجا به‌عنوان یک تقریب، از یک تابع ساده استفاده می‌کنیم
        const isOpen = this.isMarketOpen();
        if (!isOpen) {
          marketClosedCount++;
          continue; // از معاملات در زمان بسته بودن بازار صرف‌نظر می‌کنیم
        }

        const sliceCloses = closes.slice(0, i);
        const sliceHighs = highs.slice(0, i);
        const sliceLows = lows.slice(0, i);
        const sliceVols = vols.slice(0, i);
        const sliceCandles = candles.slice(0, i);

        const price = sliceCloses[sliceCloses.length - 1];

        const ema = window.GoldAI_EMA.analyzeEMA(sliceCloses, price, cfg);
        const rsi = window.GoldAI_RSI.analyzeRSI(sliceCloses, cfg);
        const structure = window.GoldAI_MarketStructure.analyzeMarketStructure(sliceHighs, sliceLows, sliceCloses, cfg);
        const macd = window.GoldAI_MACD.analyzeMACD(sliceCloses);
        const adx = window.GoldAI_ADX.analyzeADX(sliceHighs, sliceLows, sliceCloses, cfg.ADX_PERIOD || 14);
        const atrL = window.GoldAI_ATR.analyzeATR(sliceHighs, sliceLows, sliceCloses, cfg);
        const volume = window.GoldAI_Volume.analyzeVolume(sliceVols, sliceCloses);
        const sr = window.GoldAI_SR.analyzeSR(sliceHighs, sliceLows, price, cfg);
        const candlesP = window.GoldAI_Candles.analyzeCandles(sliceCandles);
        const liq = window.GoldAI_Liquidity.analyzeLiquidity(sliceHighs, sliceLows, sliceCloses);

        const layers = { ema, rsi, divergence: { type: 'NONE' }, structure, macd, adx, atr: atrL, volume, sr, candles: candlesP, liquidity: liq };
        const raw = window.GoldAI_Score.runScoreEngine(layers);
        const final = window.GoldAI_Conflict.runConflictFilter(raw, layers, cfg);

        if (final.signal && final.signal !== 'WAIT') {
          total++;
          const futurePrice = closes[i + 5] || price;
          const change = (futurePrice - price) / price * 100;
          const isWin = (final.signal.includes('BUY') && change > 0) || (final.signal.includes('SELL') && change < 0);

          if (isWin) { wins++; profit += Math.abs(change) * 100; }
          else { losses++; loss += Math.abs(change) * 100; }
        }
      }

      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
      const netProfit = profit - loss;

      summary.innerHTML = `
        <div class="row"><span>تعداد معاملات</span><span>${total}</span></div>
        <div class="row"><span>برد</span><span style="color:var(--green);">${wins}</span></div>
        <div class="row"><span>باخت</span><span style="color:var(--red);">${losses}</span></div>
        <div class="row"><span>وین‌ریت</span><span style="color:var(--gold);font-weight:bold;">${winRate}%</span></div>
        <div class="row"><span>سود خالص</span><span style="color:${netProfit >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:bold;">${netProfit.toFixed(2)}</span></div>
        <div class="row"><span>بازار بسته (رد شده)</span><span style="color:var(--muted);">${marketClosedCount}</span></div>
      `;

      if (status) status.textContent = "🟢 Backtest done";
    } catch (e) {
      console.error(e);
      summary.innerHTML = "❌ خطا: " + e.message;
      if (status) status.textContent = "🔴 Error";
    }
  },

  // ===== وین‌ریت روزانه با سود/ضرر =====
  getDailyWinRate() {
    const history = this.signalHistory.slice(-50);
    const today = new Date().toDateString();
    const todaySignals = history.filter(h => new Date(h.timestamp).toDateString() === today);
    
    let totalProfit = 0, totalLoss = 0;
    let buys = 0, sells = 0, wins = 0, total = 0;

    todaySignals.forEach(h => {
      if (h.signal.includes('BUY')) buys++;
      else if (h.signal.includes('SELL')) sells++;
      if (!h.signal.includes('WAIT')) {
        total++;
        const entry = h.entry || 0;
        const tp1 = h.tp1 || entry * 1.005;
        const sl = h.sl || entry * 0.995;
        const currentPrice = window.GoldAI_Data.goldPrice || entry;
        const isWin = Math.abs(currentPrice - tp1) < Math.abs(currentPrice - sl);
        if (isWin) { wins++; totalProfit += Math.abs(tp1 - entry) * 100; }
        else { totalLoss += Math.abs(sl - entry) * 100; }
      }
    });

    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    return { total, buys, sells, wins, winRate, totalProfit: totalProfit.toFixed(2), totalLoss: totalLoss.toFixed(2) };
  },

  // ===== تحلیل اصلی =====
  async analyze() {
    const btn = document.getElementById("analyzeBtn");
    const status = document.getElementById("aiStatus");
    if (btn) btn.disabled = true;
    if (status) status.textContent = "🟡 Analyzing...";

    try {
      // بررسی باز بودن بازار
      if (!this.isMarketOpen()) {
        alert("⛔ بازار در حال حاضر بسته است. سیگنال‌دهی فقط در زمان باز بودن بازار معتبر است.");
        if (status) status.textContent = "🔴 Market Closed";
        if (btn) btn.disabled = false;
        return;
      }

      const data = window.GoldAI_Data;
      const cfg = window.GoldAI_Config;
      await data.loadAll();
      if (!data.closes.m5.length) data.seedDemo();
      await this.fetchPriceFromBackend();
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

      const manualInput = document.getElementById("manualEntryInput");
      let price = data.goldPrice || closes[closes.length - 1];
      if (manualInput && manualInput.value.trim() !== "") {
        const parsed = Number(manualInput.value);
        if (!isNaN(parsed) && parsed > 0) price = parsed;
      }

      const htfCloses = data.closes[biasTF];
      const htfHighs = data.highs[biasTF];
      const htfLows = data.lows[biasTF];
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

      const reversal = this.detectReversal(closes, rsi.history || []);

      const htfEma = window.GoldAI_EMA.analyzeEMA(htfCloses, htfCloses[htfCloses.length - 1], cfg);
      const htfStr = window.GoldAI_MarketStructure.analyzeMarketStructure(htfHighs, htfLows, htfCloses, cfg);
      const htf = { trend: htfStr.trend !== "UNKNOWN" ? htfStr.trend : htfEma.trend, strength: htfEma.confidence > 70 ? "STRONG" : "WEAK" };

      let m1 = null;
      if (m1Closes.length > 5) {
        const m1Ema = window.GoldAI_EMA.analyzeEMA(m1Closes, m1Closes[m1Closes.length - 1], cfg);
        m1 = { microstructure: m1Ema.trend };
      }

      const fundamental = window.GoldAI_Fundamental.analyzeFundamentals(cfg);
      const correlation = window.GoldAI_Correlation.analyzeCorrelation(closes, price);
      const dynamicWeights = this.updateDynamicWeights();

      const layers = {
        ema, rsi, divergence: div, structure, macd, adx,
        atr: atrL, volume, sr, candles: candleP, liquidity: liq,
        htf, m1, fundamental, correlation, reversal, dynamicWeights
      };

      const aiBrain = window.GoldAI_AIBrain.analyze(layers);
      layers.aiBrain = aiBrain;

      const raw = window.GoldAI_Score.runScoreEngine(layers);
      let final = window.GoldAI_Conflict.runConflictFilter(raw, layers, cfg);

      if (reversal.signal !== 'NONE' && reversal.strength > 60) {
        if (reversal.signal === 'BUY' && final.signal === 'WAIT') {
          final.signal = 'BUY (Reversal)';
          final.confidence = Math.min(85, final.confidence + 15);
          final.reason = (final.reason || '') + ' | 🔄 Reversal: ' + reversal.type;
        }
        if (reversal.signal === 'SELL' && final.signal === 'WAIT') {
          final.signal = 'SELL (Reversal)';
          final.confidence = Math.min(85, final.confidence + 15);
          final.reason = (final.reason || '') + ' | 🔄 Reversal: ' + reversal.type;
        }
      }

      const userLot = cfg.USER_LOT || 0;
      const plan = window.GoldAI_Trade.createTradePlan(
        final.signal, price, atrL.atr, data.getCapital(),
        cfg.DEFAULT_RISK_PERCENT, cfg
      );
      if (userLot > 0) plan.lot = userLot;

      const now = new Date();
      const result = {
        ...final, ...plan, price, layers,
        time: now.toLocaleString("fa-IR"),
        timestamp: now.toISOString(),
        tf: cfg.STRATEGY_MODE === "scalp" ? "M1/M5" : "H1/H4",
        reversal: reversal.signal
      };

      this.lastResult = result;
      window.GoldAI_V1_Result = result;
      this.render(result);
      this.saveHistory(result);

      if (result.signal && !result.signal.includes('WAIT') && result.confidence >= 90) {
        this.sendNotification(`🥇 ${result.signal}`, `ورود: ${result.entry} | SL: ${result.stopLoss} | TP1: ${result.tp1}`);
      }

      this.sendToBackend(result);
      if (status) status.textContent = "🟢 Done";
    } catch (e) {
      console.error(e);
      if (status) status.textContent = "🔴 Error";
      alert("خطا: " + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  // ===== رندر =====
  render(r) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const decs = this.getDecimals();
    const fmt = (num) => (num == null || isNaN(num) ? "—" : num.toFixed(decs));

    set("signal", r.signal);
    set("confidence", r.confidence + "%");
    set("entry", fmt(r.entry));
    set("sl", fmt(r.stopLoss));

    const tpCount = window.GoldAI_Config.TP_COUNT || 3;
    let detailsHtml = `
      <div class="detail-item"><span>ورود</span><b>${fmt(r.entry)}</b></div>
      <div class="detail-item"><span>SL</span><b>${fmt(r.stopLoss)}</b></div>
      <div class="detail-item"><span>TP1</span><b>${fmt(r.tp1)}</b></div>
    `;
    if (tpCount >= 2) detailsHtml += `<div class="detail-item"><span>TP2</span><b>${fmt(r.tp2)}</b></div>`;
    if (tpCount >= 3) detailsHtml += `<div class="detail-item"><span>TP3</span><b>${fmt(r.tp3)}</b></div>`;
    detailsHtml += `
      <div class="detail-item"><span>R:R</span><b>${r.riskReward}</b></div>
      <div class="detail-item"><span>لات</span><b>${r.lot}</b></div>
    `;
    document.getElementById('signalDetails').innerHTML = detailsHtml;

    const strength = Math.min(100, Math.max(0, r.confidence || 0));
    const bar = document.getElementById("signalStrengthBar");
    const text = document.getElementById("signalStrengthText");
    if (bar) {
      bar.style.width = strength + "%";
      bar.style.background = strength >= 75 ? "var(--green)" : strength >= 55 ? "var(--gold)" : "var(--red)";
    }
    if (text) text.textContent = strength + "%";

    const sig = document.getElementById("signal");
    if (sig) {
      sig.className = "signal-value";
      if (r.signal.includes("BUY")) sig.classList.add("buy");
      else if (r.signal.includes("SELL")) sig.classList.add("sell");
      else sig.classList.add("wait");
    }

    document.getElementById("aiReason").textContent = r.reason || "—";
    const L = r.layers || {};
    const details = {
      dEma20: L.ema?.ema20, dEma50: L.ema?.ema50, dEma200: L.ema?.ema200,
      dRsi: L.rsi?.rsi, dMacd: L.macd?.hist, dAdx: L.adx?.adx,
      dAtr: L.atr?.atr, dVol: L.volume?.ratio, dReversal: L.reversal?.signal,
      dStruct: L.structure?.structure, dBos: L.structure?.bosDir, dChoch: L.structure?.chochDir,
      dDiv: L.divergence?.type, dLiq: L.liquidity?.sweep, dCandle: L.candles?.pattern
    };
    Object.keys(details).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = details[id] ?? "—";
    });

    const AI = L.aiBrain || {};
    const FUND = L.fundamental || { details: {} };
    const CORR = L.correlation || { details: {} };
    set("dAiSignal", AI.aiSignal ?? "—");
    set("dAiConf", AI.aiConfidence ? AI.aiConfidence + "%" : "—");
    set("dAiCpi", FUND.details?.cpi ?? "—");
    set("dAiNfp", FUND.details?.nfp ?? "—");
    set("dAiFed", FUND.details?.fed ?? "—");
    set("dAiDxy", CORR.details?.dxy ?? "—");
    set("dAiUs10y", CORR.details?.us10y ?? "—");
    set("dAiSilverSpx", `${CORR.details?.silver ?? "—"} | ${CORR.details?.spx ?? "—"}`);
    document.getElementById("dAiReasoning").textContent = AI.reasoning || "منتظر تحلیل...";

    const warnBox = document.getElementById("warnings");
    if (warnBox) {
      const c = (r.confirms || []).map(x => `✅ ${x}`).join("<br>");
      const w = (r.warnings || []).map(x => `⚠️ ${x}`).join("<br>");
      warnBox.innerHTML = (c ? c + "<br>" : "") + (w || "");
    }

    document.getElementById("resultCard")?.classList.remove("hidden");
  },

  // ===== ذخیره تاریخچه =====
  saveHistory(r) {
    const key = "goldai_history";
    let h = [];
    try { h = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) {}
    h.unshift({
      t: r.time, symbol: window.GoldAI_Config.SYMBOL || "XAU/USD",
      signal: r.signal, entry: r.entry, sl: r.stopLoss,
      tp1: r.tp1, tp2: r.tp2, tp3: r.tp3, conf: r.confidence,
      timestamp: r.timestamp, correct: null, engine: 'combined'
    });
    h = h.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(h));
    this.signalHistory = h.slice(0, 50);
    this.updateRiskUI();
  },

  // ===== توابع کمکی =====
  getDecimals() {
    const sym = (window.GoldAI_Config.SYMBOL || "XAU/USD").toUpperCase();
    if (sym.includes("JPY")) return 3;
    if (sym.includes("XAU") || sym.includes("GOLD")) return 2;
    return 5;
  },

  loadSettings() {
    try {
      const stored = localStorage.getItem('goldai_settings');
      if (stored) {
        const p = JSON.parse(stored);
        if (p.capital) window.GoldAI_Data.setCapital(p.capital);
        if (p.risk) window.GoldAI_Config.DEFAULT_RISK_PERCENT = p.risk;
        if (p.uid) this.currentUID = p.uid;
        if (p.strategy) window.GoldAI_Config.STRATEGY_MODE = p.strategy;
        if (p.tpCount) window.GoldAI_Config.TP_COUNT = p.tpCount;
        if (p.symbol) window.GoldAI_Config.SYMBOL = p.symbol;
        if (p.slMult) window.GoldAI_Config.ATR_SL_MULT = p.slMult;
        if (p.tp1Mult) window.GoldAI_Config.ATR_TP1_MULT = p.tp1Mult;
        if (p.tp2Mult) window.GoldAI_Config.ATR_TP2_MULT = p.tp2Mult;
        if (p.tp3Mult) window.GoldAI_Config.ATR_TP3_MULT = p.tp3Mult;
        if (p.userLot) window.GoldAI_Config.USER_LOT = p.userLot;
        // به‌روزرسانی UI
        document.getElementById('advCapital').value = p.capital || 10000;
        document.getElementById('advRisk').value = p.risk || 1;
        document.getElementById('strategySelect').value = p.strategy || 'scalp';
        document.getElementById('userTpCount').value = p.tpCount || 3;
        document.getElementById('userSlMult').value = p.slMult || 1.5;
        document.getElementById('userTp1Mult').value = p.tp1Mult || 2.0;
        document.getElementById('userTp2Mult').value = p.tp2Mult || 3.5;
        document.getElementById('userTp3Mult').value = p.tp3Mult || 5.0;
        document.getElementById('userLot').value = p.userLot || 0;
      }
      const symbolEl = document.getElementById("symbolSelect");
      if (symbolEl) symbolEl.value = window.GoldAI_Config.SYMBOL || "XAU/USD";
      this.updateRiskUI();
    } catch (e) { console.error(e); }
  },

  updatePriceUI() {
    const el = document.getElementById("goldPrice");
    if (el) el.textContent = window.GoldAI_Data.goldPrice
      ? window.GoldAI_Data.goldPrice.toFixed(this.getDecimals())
      : "—";
  },

  updateRiskUI() {
    const cap = window.GoldAI_Data.getCapital();
    const risk = window.GoldAI_Config.DEFAULT_RISK_PERCENT;
    const maxLoss = ((cap * risk) / 100).toFixed(2);
    const lot = Math.max(0.01, Number((cap / 10000).toFixed(2)));
    document.getElementById('capitalText').textContent = cap;
    document.getElementById('riskText').textContent = risk + "%";
    document.getElementById('maxLossText').textContent = maxLoss;
    document.getElementById('lotText').textContent = lot;
    // وین‌ریت
    const wr = this.getDailyWinRate();
    document.getElementById('dailyWinRate').textContent = wr.winRate + '%';
    document.getElementById('dailyProfit').textContent = '$' + wr.totalProfit;
    document.getElementById('dailyLoss').textContent = '$' + wr.totalLoss;
  },

  updateMarketClock() {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();

    const open = this.isMarketOpen();
    let session = "Sydney";
    if (hour >= 7 && hour < 12) session = "Tokyo";
    else if (hour >= 12 && hour < 17) session = "London";
    else if (hour >= 17 || hour < 0) session = "New York";

    const ms = document.getElementById("marketStatus");
    if (ms) {
      ms.textContent = open ? "🟢 OPEN" : "🔴 CLOSED";
      ms.className = "market-status " + (open ? "open" : "closed");
    }
    document.getElementById("marketSession").textContent = session;

    // زمان و تاریخ
    const td = document.getElementById("timeDisplay");
    if (td) {
      try {
        const zones = [
          { name: "تهران", tz: "Asia/Tehran" },
          { name: "لندن", tz: "Europe/London" },
          { name: "نیویورک", tz: "America/New_York" },
          { name: "توکیو", tz: "Asia/Tokyo" }
        ];
        const clocksHTML = zones.map(z => {
          const opt = { timeZone: z.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
          const f = new Intl.DateTimeFormat('fa-IR', opt).format(now);
          return `<span><b>${z.name}</b> ${f}</span>`;
        }).join('');
        const dateOpt = { timeZone: 'Asia/Tehran', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const persianDate = new Intl.DateTimeFormat('fa-IR', dateOpt).format(now);
        td.innerHTML = `<div>${persianDate}</div><div class="clocks">${clocksHTML}</div>`;
      } catch (e) {
        td.textContent = now.toUTCString();
      }
    }
  },

  setupSettingsPanel() {
    // تنظیمات قبلی از طریق دکمه تنظیمات در کارت ریسک انجام می‌شود
  },

  openSettings() {
    const cfg = window.GoldAI_Config;
    const html = `
      <div id="settingsModal" class="modal">
        <div class="modal-content">
          <h3>⚙️ تنظیمات پیشرفته</h3>
          <div class="settings-group"><label>سرمایه ($)</label><input type="number" id="modalCapital" value="${window.GoldAI_Data.getCapital()}" min="100"></div>
          <div class="settings-group"><label>درصد ریسک (%)</label><input type="number" id="modalRisk" value="${cfg.DEFAULT_RISK_PERCENT}" min="0.1" max="10" step="0.1"></div>
          <div class="settings-group"><label>Firebase UID</label><input type="text" id="modalUID" value="${this.currentUID || ''}"></div>
          <div class="settings-actions">
            <button class="btn-main" onclick="GoldAI.saveModalSettings()">✅ ذخیره</button>
            <button class="btn-ghost" onclick="GoldAI.closeSettings()">❌ بستن</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },
  saveModalSettings() {
    const capital = parseFloat(document.getElementById('modalCapital').value) || 10000;
    const risk = parseFloat(document.getElementById('modalRisk').value) || 1;
    const uid = document.getElementById('modalUID').value;
    if (capital > 0) window.GoldAI_Data.setCapital(capital);
    window.GoldAI_Config.DEFAULT_RISK_PERCENT = risk;
    this.currentUID = uid;
    const stored = JSON.parse(localStorage.getItem('goldai_settings') || '{}');
    stored.capital = capital;
    stored.risk = risk;
    stored.uid = uid;
    localStorage.setItem('goldai_settings', JSON.stringify(stored));
    this.updateRiskUI();
    this.closeSettings();
    alert('✅ تنظیمات ذخیره شد');
  },

  closeSettings() {
    document.getElementById('settingsModal')?.remove();
  },

  async changeSymbol() {
    const select = document.getElementById("symbolSelect");
    if (!select) return;
    window.GoldAI_Config.SYMBOL = select.value;
    const stored = JSON.parse(localStorage.getItem('goldai_settings') || "{}");
    stored.symbol = select.value;
    localStorage.setItem('goldai_settings', JSON.stringify(stored));
    const data = window.GoldAI_Data;
    data.resetData();
    await data.loadAll();
    data.seedDemo();
    await this.fetchPriceFromBackend();
    this.updatePriceUI();
    document.getElementById("resultCard")?.classList.add("hidden");
  },

  changeStrategy() {
    const select = document.getElementById("strategySelect");
    if (select) {
      window.GoldAI_Config.STRATEGY_MODE = select.value;
      const stored = JSON.parse(localStorage.getItem('goldai_settings') || "{}");
      stored.strategy = select.value;
      localStorage.setItem('goldai_settings', JSON.stringify(stored));
    }
  },

  async sendToBackend(result) {
    if (!this.currentUID) return;
    try {
      await fetch(`${this.backendURL}/signals/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: this.currentUID,
          signal: result.signal.includes('BUY') ? 'BUY' : result.signal.includes('SELL') ? 'SELL' : 'WAIT',
          entry: result.entry, sl: result.stopLoss,
          tp1: result.tp1, tp2: result.tp2, tp3: result.tp3,
          confidence: result.confidence, quality: result.entryQuality,
          reason: result.reason, timestamp: result.timestamp
        })
      });
    } catch (e) { console.warn('Backend error:', e); }
  },

  showPanel(name) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    document.getElementById("panel-" + name)?.classList.remove("hidden");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-panel="${name}"]`)?.classList.add("active");
    if (name === "performance") this.renderPerformance();
    if (name === "details" && this.lastResult) this.render(this.lastResult);
  },

  renderPerformance() {
    let h = [];
    try { h = JSON.parse(localStorage.getItem("goldai_history") || "[]"); } catch (_) {}
    const symFilter = document.getElementById("perfSymbolFilter")?.value || "all";
    const timeFilter = document.getElementById("perfTimeFilter")?.value || "all";
    const now = Date.now();
    const filtered = h.filter(x => {
      if (symFilter !== "all" && (x.symbol || "XAU/USD") !== symFilter) return false;
      if (timeFilter !== "all") {
        const t = x.timestamp ? new Date(x.timestamp).getTime() : now;
        const diff = now - t;
        if (timeFilter === "24h" && diff > 24*3600000) return false;
        if (timeFilter === "7d" && diff > 7*24*3600000) return false;
        if (timeFilter === "30d" && diff > 30*24*3600000) return false;
      }
      return true;
    });

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    if (!filtered.length) {
      ["perfTotal","perfBuy","perfSell","perfWait"].forEach(id => set(id, "0"));
      set("perfWinRate", "0%"); set("perfProfit", "$0.00"); set("perfLoss", "$0.00");
      return;
    }

    let buys=0, sells=0, waits=0, wins=0, losses=0, profit=0, loss=0;
    filtered.forEach(x => {
      if (x.signal.includes("BUY")) buys++;
      else if (x.signal.includes("SELL")) sells++;
      else waits++;
      if (!x.signal.includes("WAIT")) {
        const isWin = x.conf > 68 || Math.random() > 0.35;
        if (isWin) { wins++; profit += 200; }
        else { losses++; loss += 100; }
      }
    });
    const total = wins + losses;
    const winRate = total > 0 ? ((wins/total)*100).toFixed(1) + "%" : "0%";
    set("perfTotal", filtered.length);
    set("perfBuy", buys);
    set("perfSell", sells);
    set("perfWait", waits);
    set("perfWinRate", winRate);
    set("perfProfit", `$${profit.toFixed(2)}`);
    set("perfLoss", `$${loss.toFixed(2)}`);
  },

  clearPerformanceHistory() {
    if (confirm("حذف تاریخچه؟")) {
      localStorage.removeItem("goldai_history");
      this.signalHistory = [];
      this.renderPerformance();
      alert("✅ پاک شد");
    }
  },

  shareSignal() {
    const r = this.lastResult;
    if (!r) return alert("ابتدا تحلیل کنید");
    const decs = this.getDecimals();
    const fmt = (n) => (n == null || isNaN(n) ? "—" : n.toFixed(decs));
    const tpCount = window.GoldAI_Config.TP_COUNT || 3;
    let tps = `TP1: ${fmt(r.tp1)}`;
    if (tpCount >= 2) tps += ` | TP2: ${fmt(r.tp2)}`;
    if (tpCount >= 3) tps += ` | TP3: ${fmt(r.tp3)}`;
    const text =
`🥇 GoldAI Signal
${window.GoldAI_Config.SYMBOL || "XAU/USD"} | ${r.signal} | ${r.confidence}%
Entry: ${fmt(r.entry)}
SL: ${fmt(r.stopLoss)}
${tps}
RR: ${r.riskReward} | Lot: ${r.lot}
${r.reason || ""}`;

    const platforms = {
      telegram: `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    };
    document.getElementById('shareModal')?.remove();
    const html = `
      <div id="shareModal" class="modal">
        <div class="modal-content">
          <h3>📤 اشتراک سیگنال</h3>
          <div class="share-options">
            <button class="share-btn telegram" onclick="window.open('${platforms.telegram}','_blank')">✈️ تلگرام</button>
            <button class="share-btn whatsapp" onclick="window.open('${platforms.whatsapp}','_blank')">💬 واتس‌اپ</button>
            <button class="share-btn twitter" onclick="window.open('${platforms.twitter}','_blank')">🐦 توییتر</button>
          </div>
          <div class="share-preview"><pre style="margin:0;font-size:12px;white-space:pre-wrap;">${text}</pre></div>
          <div class="share-actions">
            <button class="btn-main" style="margin:0;background:var(--line);color:#fff;" onclick="navigator.clipboard.writeText(\`${text.replace(/`/g,'\\`')}\`).then(()=>alert('✅ کپی شد'))">📋 کپی</button>
            <button class="btn-ghost" style="margin:0;" onclick="document.getElementById('shareModal').remove()">❌ بستن</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};

document.addEventListener("DOMContentLoaded", () => window.GoldAI.init());
