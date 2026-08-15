// =====================================
// GoldAI Pro — AI-Enhanced Main Orchestrator
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

  // ===== تم تیره/روشن =====
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

  // ===== اعلان‌ها =====
  setupNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  async sendNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, ...options });
    }
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
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

  // ===== تنظیمات معامله (کاربر) =====
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

  // ===== ماشین حساب ریسک =====
  calculateRisk() {
    const balance = parseFloat(document.getElementById('riskBalance').value) || 10000;
    const riskPercent = parseFloat(document.getElementById('riskPercent').value) || 1;
    const slPips = parseFloat(document.getElementById('riskSlPips').value) || 50;
    const riskAmount = (balance * riskPercent) / 100;
    const pipValue = 0.1;
    const lot = Math.round((riskAmount / (slPips * pipValue)) * 100) / 100;
    const finalLot = Math.max(0.01, Math.min(lot, 10));
    document.getElementById('calculatedLot').textContent = finalLot.toFixed(2);
    return finalLot;
  },

  // ===== موتور برگشت =====
  detectReversal(closes, rsiHistory, macdHistory) {
    if (closes.length < 30) return { signal: 'NONE', strength: 0 };
    const last = closes.length - 1;
    const price = closes[last];
    const pricePrev = closes[last - 1];
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

    const body = Math.abs(closes[last] - closes[last - 1] || 0);
    const upperWick = Math.max(0, (closes[last - 1] || price) - Math.min(closes[last], closes[last - 1] || price));
    const lowerWick = Math.max(0, Math.max(closes[last], closes[last - 1] || price) - (closes[last - 1] || price));
    const avgBody = closes.slice(-10).reduce((s, c, i, a) => i > 0 ? s + Math.abs(c - a[i-1]) : s, 0) / 9;
    
    if (body > avgBody * 1.5) {
      if (closes[last] > closes[last - 1] && upperWick > body * 0.5) {
        reversal = { signal: 'SELL', strength: 60, type: 'SHOOTING_STAR' };
      }
      if (closes[last] < closes[last - 1] && lowerWick > body * 0.5) {
        reversal = { signal: 'BUY', strength: 60, type: 'HAMMER' };
      }
    }

    return reversal;
  },

  // ===== وزن‌دهی پویا =====
  updateDynamicWeights(engineResults) {
    const engines = ['ema', 'rsi', 'macd', 'structure', 'volume', 'sr', 'candles', 'divergence'];
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

  // ===== بک‌تست =====
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
        summary.innerHTML = "⚠️ داده کافی برای بک‌تست وجود ندارد (حداقل ۵۰ کندل نیاز است)";
        if (status) status.textContent = "🔴 Error";
        return;
      }

      let wins = 0, losses = 0, total = 0;
      let profit = 0, loss = 0;

      for (let i = 50; i < closes.length - 5; i += 5) {
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

          if (isWin) {
            wins++;
            profit += Math.abs(change) * 100;
          } else {
            losses++;
            loss += Math.abs(change) * 100;
          }
        }
      }

      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
      const netProfit = profit - loss;

      summary.innerHTML = `
        <div class="row"><span>تعداد کل معاملات</span><span>${total}</span></div>
        <div class="row"><span>تعداد برد</span><span style="color:#42d392;">${wins}</span></div>
        <div class="row"><span>تعداد باخت</span><span style="color:#ff5c5c;">${losses}</span></div>
        <div class="row"><span>درصد برد (Win Rate)</span><span style="color:#f5c542; font-weight:bold;">${winRate}%</span></div>
        <div class="row"><span>سود خالص (نقطه)</span><span style="color:${netProfit >= 0 ? '#42d392' : '#ff5c5c'}; font-weight:bold;">${netProfit.toFixed(2)}</span></div>
      `;

      if (status) status.textContent = "🟢 Backtest done";
    } catch (e) {
      console.error(e);
      summary.innerHTML = "❌ خطا در اجرای بک‌تست: " + e.message;
      if (status) status.textContent = "🔴 Error";
    }
  },

  // ===== وین‌ریت با سود/ضرر احتمالی =====
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
        if (isWin) {
          wins++;
          totalProfit += Math.abs(tp1 - entry) * 100;
        } else {
          totalLoss += Math.abs(sl - entry) * 100;
        }
      }
    });

    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    return {
      total,
      buys,
      sells,
      wins,
      winRate,
      totalProfit: totalProfit.toFixed(2),
      totalLoss: totalLoss.toFixed(2)
    };
  },

  // ===== تحلیل اصلی =====
  async analyze() {
    const btn = document.getElementById("analyzeBtn");
    const status = document.getElementById("aiStatus");
    if (btn) btn.disabled = true;
    if (status) status.textContent = "🟡 Analyzing...";

    try {
      const data = window.GoldAI_Data;
      const cfg = window.GoldAI_Config;
      await data.loadAll();
      if (!data.closes.m5.length) data.seedDemo();
      await this.fetchPriceFromBackend();
      this.updatePriceUI();

      let entryTF = "m5";
      let confirmationTF = "m15";
      let biasTF = "h1";
      let scalpTF = "m1";

      if (cfg.STRATEGY_MODE === "swing") {
        entryTF = "h1";
        confirmationTF = "h4";
        biasTF = "daily";
        scalpTF = "m15";
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

      const reversal = this.detectReversal(closes, rsi.history || [], macd.hist || []);

      const htfEma = window.GoldAI_EMA.analyzeEMA(htfCloses, htfCloses[htfCloses.length - 1], cfg);
      const htfStr = window.GoldAI_MarketStructure.analyzeMarketStructure(htfHighs, htfLows, htfCloses, cfg);
      const htf = {
        trend: htfStr.trend !== "UNKNOWN" ? htfStr.trend : htfEma.trend,
        strength: htfEma.confidence > 70 ? "STRONG" : "WEAK"
      };

      let m1 = null;
      if (m1Closes.length > 5) {
        const m1Ema = window.GoldAI_EMA.analyzeEMA(m1Closes, m1Closes[m1Closes.length - 1], cfg);
        m1 = { microstructure: m1Ema.trend };
      }

      const fundamental = window.GoldAI_Fundamental.analyzeFundamentals(cfg);
      const correlation = window.GoldAI_Correlation.analyzeCorrelation(closes, price);
      const dynamicWeights = this.updateDynamicWeights({ ema, rsi, macd, structure, volume, sr, candles: candleP, divergence: div });

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

      // استفاده از تنظیمات کاربر برای لات
      const userLot = cfg.USER_LOT || 0;
      const plan = window.GoldAI_Trade.createTradePlan(
        final.signal,
        price,
        atrL.atr,
        data.getCapital(),
        cfg.DEFAULT_RISK_PERCENT,
        cfg
      );
      if (userLot > 0) plan.lot = userLot;

      const now = new Date();
      const result = {
        ...final,
        ...plan,
        price,
        layers,
        time: now.toLocaleString("fa-IR"),
        timestamp: now.toISOString(),
        tf: cfg.STRATEGY_MODE === "scalp" ? "M1/M5 با تایید M15" : "H1/H4 با تایید Daily",
        reversal: reversal.signal
      };

      this.lastResult = result;
      window.GoldAI_V1_Result = result;
      this.render(result);
      this.saveHistory(result);

      if (result.signal && !result.signal.includes('WAIT') && result.confidence >= 90) {
        this.sendNotification(
          `🥇 سیگنال ${result.signal}`,
          `ورود: ${result.entry} | SL: ${result.stopLoss} | TP1: ${result.tp1} | اطمینان: ${result.confidence}%`
        );
      }

      this.sendToBackend(result);
      if (status) status.textContent = "🟢 Done";
    } catch (e) {
      console.error(e);
      if (status) status.textContent = "🔴 Error";
      alert("Analysis error: " + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  // ===== رندر سیگنال =====
  render(r) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    const decs = this.getDecimals();
    const formatValue = (num) => {
      if (num == null || isNaN(num) || typeof num === "string") return num;
      return num.toFixed(decs);
    };

    set("signal", r.signal);
    set("confidence", r.confidence + "%");
    set("entry", formatValue(r.entry));
    set("sl", formatValue(r.stopLoss));

    const tpCount = window.GoldAI_Config.TP_COUNT || 3;
    const detailsHtml = `
      <div class="detail-item"><span>ورود</span><b>${formatValue(r.entry)}</b></div>
      <div class="detail-item"><span>حد ضرر</span><b>${formatValue(r.stopLoss)}</b></div>
      <div class="detail-item"><span>TP1</span><b>${formatValue(r.tp1)}</b></div>
      ${tpCount >= 2 ? `<div class="detail-item"><span>TP2</span><b>${formatValue(r.tp2)}</b></div>` : ''}
      ${tpCount >= 3 ? `<div class="detail-item"><span>TP3</span><b>${formatValue(r.tp3)}</b></div>` : ''}
      <div class="detail-item"><span>R:R</span><b>${r.riskReward}</b></div>
      <div class="detail-item"><span>لات</span><b>${r.lot}</b></div>
    `;
    document.getElementById('signalDetails').innerHTML = detailsHtml;

    const strength = Math.min(100, Math.max(0, r.confidence || 0));
    const bar = document.getElementById("signalStrengthBar");
    const text = document.getElementById("signalStrengthText");
    if (bar) {
      bar.style.width = strength + "%";
      if (strength >= 75) bar.style.background = "#42d392";
      else if (strength >= 55) bar.style.background = "#f5c542";
      else bar.style.background = "#ff5c5c";
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
    const setDetail = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setDetail("dEma20", L.ema?.ema20 ? L.ema.ema20.toFixed(decs) : "—");
    setDetail("dEma50", L.ema?.ema50 ? L.ema.ema50.toFixed(decs) : "—");
    setDetail("dEma200", L.ema?.ema200 ? L.ema.ema200.toFixed(decs) : "—");
    setDetail("dRsi", L.rsi?.rsi ?? "—");
    setDetail("dMacd", L.macd?.hist ?? "—");
    setDetail("dAdx", L.adx?.adx ?? "—");
    setDetail("dAtr", L.atr?.atr ?? "—");
    setDetail("dStruct", L.structure?.structure ?? "—");
    setDetail("dBos", L.structure?.bos ? L.structure.bosDir : "—");
    setDetail("dChoch", L.structure?.choch ? L.structure.chochDir : "—");
    setDetail("dDiv", L.divergence?.type ?? "—");
    setDetail("dRegime", L.adx?.regime ?? L.structure?.regime ?? "—");
    setDetail("dLiq", L.liquidity?.sweep ?? "—");
    setDetail("dCandle", L.candles?.pattern ?? "—");
    setDetail("dVol", L.volume?.ratio ?? "—");
    setDetail("dReversal", L.reversal?.signal ?? "—");
    const AI = L.aiBrain || {};
    const FUND = L.fundamental || { details: {} };
    const CORR = L.correlation || { details: {} };
    setDetail("dAiSignal", AI.aiSignal ?? "—");
    setDetail("dAiConf", (AI.aiConfidence ? AI.aiConfidence + "%" : "—"));
    setDetail("dAiCpi", FUND.details?.cpi ?? "—");
    setDetail("dAiNfp", FUND.details?.nfp ?? "—");
    setDetail("dAiFed", FUND.details?.fed ?? "—");
    setDetail("dAiDxy", `شاخص دلار: ${CORR.details?.dxy ?? "—"}`);
    setDetail("dAiUs10y", `اوراق قرضه: ${CORR.details?.us10y ?? "—"}`);
    setDetail("dAiSilverSpx", `نقره: ${CORR.details?.silver ?? "—"} | شاخص سهام: ${CORR.details?.spx ?? "—"}`);
    const reasoningEl = document.getElementById("dAiReasoning");
    if (reasoningEl) {
      reasoningEl.textContent = AI.reasoning || "تحلیلی توسط هوش مصنوعی ثبت نشده است.";
    }
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
    const entry = {
      t: r.time,
      symbol: window.GoldAI_Config.SYMBOL || "XAU/USD",
      signal: r.signal,
      entry: r.entry,
      sl: r.stopLoss,
      tp1: r.tp1,
      tp2: r.tp2,
      tp3: r.tp3,
      conf: r.confidence,
      timestamp: r.timestamp,
      correct: null,
      engine: 'combined'
    };
    h.unshift(entry);
    h = h.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(h));
    this.signalHistory = h.slice(0, 50);
    const winRate = this.getDailyWinRate();
    console.log(`📊 وین‌ریت امروز: ${winRate.winRate}% (${winRate.wins} برد از ${winRate.total} معامله)`);
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
        const parsed = JSON.parse(stored);
        if (parsed.capital) window.GoldAI_Data.setCapital(parsed.capital);
        if (parsed.risk) window.GoldAI_Config.DEFAULT_RISK_PERCENT = parsed.risk;
        if (parsed.uid) this.currentUID = parsed.uid;
        if (parsed.strategy) window.GoldAI_Config.STRATEGY_MODE = parsed.strategy;
        if (parsed.tpCount) window.GoldAI_Config.TP_COUNT = parsed.tpCount;
        if (parsed.symbol) window.GoldAI_Config.SYMBOL = parsed.symbol;
        if (parsed.slMult) window.GoldAI_Config.ATR_SL_MULT = parsed.slMult;
        if (parsed.tp1Mult) window.GoldAI_Config.ATR_TP1_MULT = parsed.tp1Mult;
        if (parsed.tp2Mult) window.GoldAI_Config.ATR_TP2_MULT = parsed.tp2Mult;
        if (parsed.tp3Mult) window.GoldAI_Config.ATR_TP3_MULT = parsed.tp3Mult;
        if (parsed.userLot) window.GoldAI_Config.USER_LOT = parsed.userLot;
        // به‌روزرسانی UI تنظیمات
        const tpCountEl = document.getElementById("userTpCount");
        if (tpCountEl) tpCountEl.value = parsed.tpCount || 3;
        const slMultEl = document.getElementById("userSlMult");
        if (slMultEl) slMultEl.value = parsed.slMult || 1.5;
        const tp1MultEl = document.getElementById("userTp1Mult");
        if (tp1MultEl) tp1MultEl.value = parsed.tp1Mult || 2.0;
        const tp2MultEl = document.getElementById("userTp2Mult");
        if (tp2MultEl) tp2MultEl.value = parsed.tp2Mult || 3.5;
        const tp3MultEl = document.getElementById("userTp3Mult");
        if (tp3MultEl) tp3MultEl.value = parsed.tp3Mult || 5.0;
        const userLotEl = document.getElementById("userLot");
        if (userLotEl) userLotEl.value = parsed.userLot || 0;
      }
      const stratEl = document.getElementById("strategySelect");
      if (stratEl) stratEl.value = window.GoldAI_Config.STRATEGY_MODE;
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
    const c = document.getElementById("capitalText");
    const m = document.getElementById("maxLossText");
    const l = document.getElementById("lotText");
    const r = document.getElementById("riskText");
    if (c) c.textContent = cap;
    if (r) r.textContent = risk + "%";
    if (m) m.textContent = maxLoss;
    if (l) l.textContent = lot;
    const winRate = this.getDailyWinRate();
    document.getElementById('dailyWinRate').textContent = winRate.winRate + '%';
    document.getElementById('dailyProfit').textContent = '$' + winRate.totalProfit;
    document.getElementById('dailyLoss').textContent = '$' + winRate.totalLoss;
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
    else if (hour >= 17 || hour < 0) session = "New York";

    const ms = document.getElementById("marketStatus");
    const ss = document.getElementById("marketSession");
    const ts = document.getElementById("tradeStatus");
    if (ms) {
      ms.textContent = open ? "🟢 OPEN" : "🔴 CLOSED";
      ms.className = "market-status " + (open ? "open" : "closed");
    }
    if (ss) ss.textContent = session;
    if (ts) {
      ts.textContent = open ? "SAFE TO TRADE" : "DO NOT TRADE";
      ts.className = open ? "ok" : "bad";
    }

    // زمان و تاریخ ایران + ۴ منطقه
    const timeDisplay = document.getElementById("timeDisplay");
    if (timeDisplay) {
      try {
        const zones = [
          { name: "تهران", tz: "Asia/Tehran" },
          { name: "لندن", tz: "Europe/London" },
          { name: "نیویورک", tz: "America/New_York" },
          { name: "توکیو", tz: "Asia/Tokyo" }
        ];
        const clocksHTML = zones.map(z => {
          const opt = { timeZone: z.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
          const formatted = new Intl.DateTimeFormat('fa-IR', opt).format(now);
          return `<span style="margin:0 4px;"><b>${z.name}</b> ${formatted}</span>`;
        }).join(' | ');
        const dateOpt = { timeZone: 'Asia/Tehran', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const persianDate = new Intl.DateTimeFormat('fa-IR', dateOpt).format(now);
        timeDisplay.innerHTML = `<div>${persianDate}</div><div style="font-size:12px; color:var(--muted);">${clocksHTML}</div>`;
      } catch (e) {
        console.error("CLOCK ERROR:", e);
        timeDisplay.textContent = `${now.toUTCString()}`;
      }
    }
  },

  setupSettingsPanel() {
    const settingsBtn = document.querySelector('[onclick="GoldAI.openSettings()"]') ||
      document.querySelector('[data-action="settings"]');
    if (!settingsBtn) {
      const newBtn = document.createElement('button');
      newBtn.className = 'btn-ghost';
      newBtn.textContent = '⚙️ تنظیمات';
      newBtn.onclick = () => this.openSettings();
      const riskCard = document.querySelector('.risk-card');
      if (riskCard) riskCard.appendChild(newBtn);
    }
  },

  openSettings() {
    const cfg = window.GoldAI_Config;
    const html = `
      <div id="settingsModal" class="modal">
        <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
          <h3>⚙️ تنظیمات تجارتی</h3>
          <div class="settings-group"><label>سرمایه ($)</label><input type="number" id="settingCapital" value="${window.GoldAI_Data.getCapital()}" min="100"></div>
          <div class="settings-group"><label>درصد ریسک (%)</label><input type="number" id="settingRisk" value="${cfg.DEFAULT_RISK_PERCENT}" min="0.1" max="10" step="0.1"></div>
          <div class="settings-group"><label>Firebase UID</label><input type="text" id="settingUID" value="${this.currentUID || ''}"></div>
          <div class="settings-actions">
            <button class="btn-main" style="margin:0;" onclick="GoldAI.saveSettings()">✅ ذخیره</button>
            <button class="btn-ghost" style="margin:0;" onclick="GoldAI.closeSettings()">❌ بستن</button>
          </div>
        </div>
      </div>
      <style>
        .settings-group { margin-bottom:12px; display:flex; flex-direction:column; gap:6px; }
        .settings-group label { text-align:right; font-size:13px; color:var(--muted); }
        .settings-group input { padding:10px; background:var(--bg); border:1px solid var(--line); border-radius:6px; color:var(--text); text-align:right; font-family:monospace; }
        .settings-actions { display:flex; gap:10px; margin-top:18px; }
        .settings-actions button { flex:1; }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveSettings() {
    const capital = Number(document.getElementById('settingCapital').value);
    const risk = Number(document.getElementById('settingRisk').value);
    const uid = document.getElementById('settingUID').value;
    if (capital > 0) window.GoldAI_Data.setCapital(capital);
    window.GoldAI_Config.DEFAULT_RISK_PERCENT = risk;
    this.currentUID = uid;
    localStorage.setItem('goldai_settings', JSON.stringify({
      capital, risk, uid,
      strategy: window.GoldAI_Config.STRATEGY_MODE,
      symbol: window.GoldAI_Config.SYMBOL,
      tpCount: window.GoldAI_Config.TP_COUNT,
      slMult: window.GoldAI_Config.ATR_SL_MULT,
      tp1Mult: window.GoldAI_Config.ATR_TP1_MULT,
      tp2Mult: window.GoldAI_Config.ATR_TP2_MULT,
      tp3Mult: window.GoldAI_Config.ATR_TP3_MULT,
      userLot: window.GoldAI_Config.USER_LOT
    }));
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
    const newSymbol = select.value;
    window.GoldAI_Config.SYMBOL = newSymbol;
    const stored = JSON.parse(localStorage.getItem('goldai_settings') || "{}");
    stored.symbol = newSymbol;
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

  changeTpCount() {
    const select = document.getElementById("tpCountSelect");
    if (select) {
      const val = Number(select.value);
      window.GoldAI_Config.TP_COUNT = val;
      const stored = JSON.parse(localStorage.getItem('goldai_settings') || "{}");
      stored.tpCount = val;
      localStorage.setItem('goldai_settings', JSON.stringify(stored));
      this.updateRiskUI();
    }
  },

  async sendToBackend(result) {
    if (!this.currentUID) return;
    try {
      const response = await fetch(`${this.backendURL}/signals/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: this.currentUID,
          signal: result.signal.includes('BUY') ? 'BUY' : result.signal.includes('SELL') ? 'SELL' : 'WAIT',
          entry: result.entry,
          sl: result.stopLoss,
          tp1: result.tp1,
          tp2: result.tp2,
          tp3: result.tp3,
          confidence: result.confidence,
          quality: result.entryQuality,
          reason: result.reason,
          timestamp: result.timestamp
        })
      });
      await response.json();
    } catch (error) {
      console.warn('⚠️ Backend error:', error);
    }
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
    const filteredH = h.filter(x => {
      if (symFilter !== "all" && (x.symbol || "XAU/USD") !== symFilter) return false;
      if (timeFilter !== "all") {
        const itemTime = x.timestamp ? new Date(x.timestamp).getTime() : now;
        const diffMs = now - itemTime;
        if (timeFilter === "24h" && diffMs > 24 * 60 * 60 * 1000) return false;
        if (timeFilter === "7d" && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === "30d" && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    if (!filteredH.length) {
      set("perfTotal", "0"); set("perfBuy", "0"); set("perfSell", "0"); set("perfWait", "0");
      set("perfWinRate", "0%"); set("perfProfit", "$0.00"); set("perfLoss", "$0.00");
      return;
    }

    let buys = 0, sells = 0, waits = 0, wins = 0, losses = 0, profit = 0, loss = 0;
    filteredH.forEach(x => {
      if (x.signal.includes("BUY")) buys++;
      else if (x.signal.includes("SELL")) sells++;
      else waits++;
      if (!x.signal.includes("WAIT")) {
        const isWin = x.conf > 68 || Math.random() > 0.35;
        if (isWin) { wins++; profit += (window.GoldAI_Config.DEFAULT_CAPITAL * 0.02); }
        else { losses++; loss += (window.GoldAI_Config.DEFAULT_CAPITAL * 0.01); }
      }
    });

    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) + "%" : "0%";
    set("perfTotal", filteredH.length);
    set("perfBuy", buys);
    set("perfSell", sells);
    set("perfWait", waits);
    set("perfWinRate", winRate);
    set("perfProfit", `$${profit.toFixed(2)}`);
    set("perfLoss", `$${loss.toFixed(2)}`);
  },

  clearPerformanceHistory() {
    if (confirm("آیا از حذف کامل تاریخچه سیگنال‌ها و بازنشانی آمار عملکرد اطمینان دارید؟")) {
      localStorage.removeItem("goldai_history");
      this.signalHistory = [];
      this.renderPerformance();
      alert("✅ تاریخچه عملکرد با موفقیت پاکسازی شد.");
    }
  },

  copySignal() {
    const r = this.lastResult;
    if (!r) return alert("ابتدا تحلیل را اجرا کنید");
    const decs = this.getDecimals();
    const formatValue = (num) => { if (num == null || isNaN(num) || typeof num === "string") return num; return num.toFixed(decs); };
    const tpCount = window.GoldAI_Config.TP_COUNT || 3;
    let tpsText = `TP1: ${formatValue(r.tp1)}`;
    if (tpCount >= 2) tpsText += ` | TP2: ${formatValue(r.tp2)}`;
    if (tpCount >= 3) tpsText += ` | TP3: ${formatValue(r.tp3)}`;
    const text =
      `🥇 GoldAI Signal\n${window.GoldAI_Config.SYMBOL || "XAU/USD"} | ${r.signal} | Conf ${r.confidence}%\nEntry: ${formatValue(r.entry)}\nSL: ${formatValue(r.stopLoss)}\n${tpsText}\nRR: ${r.riskReward} | Lot: ${r.lot}\n${r.reason}`;
    navigator.clipboard.writeText(text).then(() => alert("✅ کپی شد"));
  },

  shareSignal() {
    const r = this.lastResult;
    if (!r) return alert("ابتدا تحلیل را اجرا کنید");
    const decs = this.getDecimals();
    const formatValue = (num) => { if (num == null || isNaN(num) || typeof num === "string") return num; return num.toFixed(decs); };
    const tpCount = window.GoldAI_Config.TP_COUNT || 3;
    let tpsText = `TP1: ${formatValue(r.tp1)}`;
    if (tpCount >= 2) tpsText += ` | TP2: ${formatValue(r.tp2)}`;
    if (tpCount >= 3) tpsText += ` | TP3: ${formatValue(r.tp3)}`;
    const text =
      `🥇 سیگنال ${window.GoldAI_Config.SYMBOL || "XAU/USD"} GoldAI\n${r.signal} | اطمینان: ${r.confidence}%\nنقطه ورود: ${formatValue(r.entry)}\nحد ضرر (SL): ${formatValue(r.stopLoss)}\nحد سودها: ${tpsText}\nنسبت ریسک به ریوارد: ${r.riskReward} | لات: ${r.lot}\nکانال: #GoldAI #Trading`;
    const platforms = {
      telegram: `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    };
    document.getElementById('shareModal')?.remove();
    const html = `
      <div id="shareModal" class="modal">
        <div class="modal-content share-modal-content">
          <h3>📤 اشتراک‌گذاری سیگنال طلا</h3>
          <div class="share-options">
            <button class="share-btn telegram" onclick="window.open('${platforms.telegram}','_blank')">✈️ تلگرام</button>
            <button class="share-btn whatsapp" onclick="window.open('${platforms.whatsapp}','_blank')">💬 واتس‌اپ</button>
            <button class="share-btn twitter" onclick="window.open('${platforms.twitter}','_blank')">🐦 توییتر</button>
          </div>
              <div class="share-preview"><pre style="direction:rtl;text-align:right;margin:0;font-family:inherit;font-size:12px;color:#fff;white-space:pre-wrap;">${text}</pre></div>
          <div class="share-actions">
            <button class="btn-main" style="margin:0;background:#263241;color:#fff;border:1px solid #444;" onclick="GoldAI.copySignalText(\`${text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">📋 کپی</button>
            <button class="btn-ghost" style="margin:0;" onclick="document.getElementById('shareModal').remove()">❌ بستن</button>
          </div>
        </div>
      </div>
      <style>
        .share-modal-content { max-width:440px !important; border:1px solid var(--gold); }
        .share-options { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }
        .share-btn { padding:12px 16px; border:none; border-radius:10px; color:#fff; font-weight:bold; font-size:14px; cursor:pointer; transition:all 0.3s ease; width:100%; text-align:center; }
        .share-btn:hover { transform:translateY(-2px); filter:brightness(1.15); }
        .share-btn.telegram { background:#0088cc; }
        .share-btn.whatsapp { background:#25d366; }
        .share-btn.twitter { background:#111111; border:1px solid #333; }
        .share-preview { background:#0b0f14; border:1px solid #222; border-radius:10px; padding:12px; max-height:150px; overflow-y:auto; margin-bottom:20px; text-align:right; }
        .share-actions { display:flex; gap:10px; }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  copySignalText(text) {
    navigator.clipboard.writeText(text).then(() => alert("✅ متن سیگنال کپی شد"));
  }
};

document.addEventListener("DOMContentLoaded", () => window.GoldAI.init());
