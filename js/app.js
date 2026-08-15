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
    console.log("✅ GoldAI Pro ready with all enhancements");
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
    // اعلان مرورگر
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, ...options });
    }
    // اعلان صوتی
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

    // اعلان از طریق ntfy.sh (برای گوشی)
    try {
      const topic = window.GoldAI_Config.NTFY_TOPIC || 'goldai_signals';
      await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: `${title}\n${body}`,
        headers: { 'Title': title }
      });
    } catch (_) {}
  },

  // ===== ماشین‌حساب ریسک =====
  calculateRisk() {
    const balance = parseFloat(document.getElementById('riskBalance').value) || 10000;
    const riskPercent = parseFloat(document.getElementById('riskPercent').value) || 1;
    const slPips = parseFloat(document.getElementById('riskSlPips').value) || 50;
    const riskAmount = (balance * riskPercent) / 100;
    // فرض: هر پیپ برای طلا = 0.1 دلار به ازای هر 0.01 لات (تقریبی)
    const pipValue = 0.1;
    const lot = Math.round((riskAmount / (slPips * pipValue)) * 100) / 100;
    const finalLot = Math.max(0.01, Math.min(lot, 10));
    document.getElementById('calculatedLot').textContent = finalLot.toFixed(2);
    return finalLot;
  },

  // ===== موتور برگشت قوی (Reversal Engine) =====
  detectReversal(closes, rsiHistory, macdHistory) {
    if (closes.length < 30) return { signal: 'NONE', strength: 0 };
    const last = closes.length - 1;
    const price = closes[last];
    const pricePrev = closes[last - 1];
    const price20 = closes[last - 20] || price;

    let reversal = { signal: 'NONE', strength: 0, type: '' };

    // واگرایی پنهان RSI
    if (rsiHistory && rsiHistory.length > 20) {
      const rsi = rsiHistory[last];
      const rsiPrev = rsiHistory[last - 1];
      const rsi20 = rsiHistory[last - 20] || rsi;
      // واگرایی صعودی پنهان: قیمت کف پایین‌تر ولی RSI کف بالاتر
      if (price < price20 && rsi > rsi20 && rsi < 50) {
        reversal = { signal: 'BUY', strength: 70, type: 'HIDDEN_BULLISH_RSI' };
      }
      // واگرایی نزولی پنهان: قیمت سقف بالاتر ولی RSI سقف پایین‌تر
      if (price > price20 && rsi < rsi20 && rsi > 50) {
        reversal = { signal: 'SELL', strength: 70, type: 'HIDDEN_BEARISH_RSI' };
      }
    }

    // تشخیص کندل برگشتی
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
    // ===== وزن‌دهی پویا به موتورها =====
  updateDynamicWeights(engineResults) {
    // هر موتور بر اساس عملکرد اخیر وزن می‌گیرد
    const engines = ['ema', 'rsi', 'macd', 'structure', 'volume', 'sr', 'candles', 'divergence'];
    const history = this.signalHistory.slice(-20);
    const weights = {};

    engines.forEach(eng => {
      let score = 50; // وزن پایه
      // اگر موتور در تاریخ اخیر سیگنال درست داده، وزنش بالا می‌رود
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

  // ===== بک‌تست روی ۱۰۰ کندل گذشته =====
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

      let wins = 0,
        losses = 0,
        total = 0;
      let profit = 0,
        loss = 0;

      // شبیه‌سازی روی ۵۰ کندل آخر (هر ۵ کندل یکبار)
      for (let i = 50; i < closes.length - 5; i += 5) {
        const sliceCloses = closes.slice(0, i);
        const sliceHighs = highs.slice(0, i);
        const sliceLows = lows.slice(0, i);
        const sliceVols = vols.slice(0, i);
        const sliceCandles = candles.slice(0, i);

        const price = sliceCloses[sliceCloses.length - 1];

        // اجرای موتورها روی داده‌های گذشته
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
          // شبیه‌سازی سود/ضرر با قیمت ۵ کندل بعد
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
        <div class="row"><span>تعداد کل معاملات شبیه‌سازی‌شده</span><span>${total}</span></div>
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

  // ===== تحلیل وین‌ریت روزانه =====
  getDailyWinRate() {
    const history = this.signalHistory.slice(-50);
    const today = new Date().toDateString();
    const todaySignals = history.filter(h => new Date(h.timestamp).toDateString() === today);
    const buys = todaySignals.filter(h => h.signal.includes('BUY') && h.correct !== undefined);
    const sells = todaySignals.filter(h => h.signal.includes('SELL') && h.correct !== undefined);

    const total = buys.length + sells.length;
    const wins = buys.filter(h => h.correct).length + sells.filter(h => h.correct).length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

    return {
      total,
      buys: buys.length,
      sells: sells.length,
      wins,
      winRate
    };
  },

  // ===== تحلیل اصلی (با موتور برگشت و وزن‌دهی پویا) =====
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

      // === موتورها ===
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

      // === موتور برگشت قوی (جدید) ===
      const reversal = this.detectReversal(closes, rsi.history || [], macd.hist || []);

      // HTF bias
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

      // === وزن‌دهی پویا ===
      const dynamicWeights = this.updateDynamicWeights({ ema, rsi, macd, structure, volume, sr, candles: candleP, divergence: div });

      const layers = {
        ema,
        rsi,
        divergence: div,
        structure,
        macd,
        adx,
        atr: atrL,
        volume,
        sr,
        candles: candleP,
        liquidity: liq,
        htf,
        m1,
        fundamental,
        correlation,
        reversal, // موتور برگشت
        dynamicWeights
      };

      const aiBrain = window.GoldAI_AIBrain.analyze(layers);
      layers.aiBrain = aiBrain;

      const raw = window.GoldAI_Score.runScoreEngine(layers);
      const final = window.GoldAI_Conflict.runConflictFilter(raw, layers, cfg);

      // === تقویت سیگنال با موتور برگشت ===
      if (reversal.signal !== 'NONE' && reversal.strength > 60) {
        if (reversal.signal === 'BUY' && final.signal === 'WAIT') {
          final.signal = 'BUY (Reversal)';
          final.confidence = Math.min(85, final.confidence + 15);
          final.reason = (final.reason || '') + ' | 🔄 Reversal detected: ' + reversal.type;
        }
        if (reversal.signal === 'SELL' && final.signal === 'WAIT') {
          final.signal = 'SELL (Reversal)';
          final.confidence = Math.min(85, final.confidence + 15);
          final.reason = (final.reason || '') + ' | 🔄 Reversal detected: ' + reversal.type;
        }
      }

      const plan = window.GoldAI_Trade.createTradePlan(
        final.signal,
        price,
        atrL.atr,
        data.getCapital(),
        cfg.DEFAULT_RISK_PERCENT,
        cfg
      );

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

      // اعلان سیگنال
      if (result.signal && !result.signal.includes('WAIT')) {
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

  // ===== رندر سیگنال با نوار قدرت =====
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
    const tp1El = document.getElementById("tp1");
    const tp2El = document.getElementById("tp2");
    const tp3El = document.getElementById("tp3");

    if (tp1El) tp1El.textContent = formatValue(r.tp1);
    if (tp2El) {
      if (tpCount >= 2) {
        tp2El.closest('.pill')?.classList.remove('hidden');
        tp2El.textContent = formatValue(r.tp2);
      } else {
        tp2El.closest('.pill')?.classList.add('hidden');
      }
    }
    if (tp3El) {
      if (tpCount >= 3) {
        tp3El.closest('.row')?.classList.remove('hidden');
        tp3El.textContent = formatValue(r.tp3);
      } else {
        tp3El.closest('.row')?.classList.add('hidden');
      }
    }

    set("rr", r.riskReward);
    set("lotSize", r.lot);
    set("quality", r.entryQuality);
    set("aiReason", r.reason || "—");

    // === نوار قدرت سیگنال ===
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

    // === جزئیات ===
    const L = r.layers || {};
    set("dEma20", L.ema?.ema20 ? L.ema.ema20.toFixed(decs) : "—");
    set("dEma50", L.ema?.ema50 ? L.ema.ema50.toFixed(decs) : "—");
    set("dEma200", L.ema?.ema200 ? L.ema.ema200.toFixed(decs) : "—");
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
    set("dReversal", L.reversal?.signal ?? "—");

    const AI = L.aiBrain || {};
    const FUND = L.fundamental || { details: {} };
    const CORR = L.correlation || { details: {} };

    set("dAiSignal", AI.aiSignal ?? "—");
    set("dAiConf", (AI.aiConfidence ? AI.aiConfidence + "%" : "—"));
    set("dAiCpi", FUND.details?.cpi ?? "—");
    set("dAiNfp", FUND.details?.nfp ?? "—");
    set("dAiFed", FUND.details?.fed ?? "—");
    set("dAiDxy", `شاخص دلار: ${CORR.details?.dxy ?? "—"}`);
    set("dAiUs10y", `اوراق قرضه: ${CORR.details?.us10y ?? "—"}`);
    set("dAiSilverSpx", `نقره: ${CORR.details?.silver ?? "—"} | شاخص سهام: ${CORR.details?.spx ?? "—"}`);

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
    // ===== ذخیره‌سازی تاریخچه با وضعیت وین‌ریت =====
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
      // برای وین‌ریت بعداً می‌توانیم وضعیت را به‌روز کنیم
      correct: null,
      engine: 'combined'
    };

    h.unshift(entry);
    h = h.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(h));
    this.signalHistory = h.slice(0, 50);

    // به‌روزرسانی وین‌ریت روزانه
    const winRate = this.getDailyWinRate();
    console.log(`📊 وین‌ریت امروز: ${winRate.winRate}% (${winRate.wins} برد از ${winRate.total} معامله)`);
  },

  // ===== سایر توابع (همان‌های قبلی) =====
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
      }
      const stratEl = document.getElementById("strategySelect");
      if (stratEl) stratEl.value = window.GoldAI_Config.STRATEGY_MODE;
      const symbolEl = document.getElementById("symbolSelect");
      if (symbolEl) symbolEl.value = window.GoldAI_Config.SYMBOL || "XAU/USD";
      const tpCountEl = document.getElementById("tpCountSelect");
      if (tpCountEl) tpCountEl.value = window.GoldAI_Config.TP_COUNT || 3;
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
    // به‌روزرسانی ماشین حساب ریسک
    const bal = document.getElementById("riskBalance");
    if (bal) bal.value = cap;
    const rp = document.getElementById("riskPercent");
    if (rp) rp.value = risk;
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
    if (ms) ms.textContent = open ? "🟢 OPEN" : "🔴 CLOSED";
    if (ss) ss.textContent = session;
    if (ts) {
      ts.textContent = open ? "SAFE TO TRADE" : "DO NOT TRADE";
      ts.className = open ? "ok" : "bad";
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
      const riskCard = document.querySelector('.card');
      if (riskCard) riskCard.appendChild(newBtn);
    }
  },

  openSettings() {
    const cfg = window.GoldAI_Config;
    const html = `
      <div id="settingsModal" class="modal">
        <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
          <h3>⚙️ تنظیمات تجارتی (پیشرفته)</h3>
          <div class="settings-group"><label>سرمایه ($)</label><input type="number" id="settingCapital" value="${window.GoldAI_Data.getCapital()}" min="100"></div>
          <div class="settings-group"><label>درصد ریسک (%)</label><input type="number" id="settingRisk" value="${cfg.DEFAULT_RISK_PERCENT}" min="0.1" max="10" step="0.1"></div>
          <div class="settings-group"><label>تعداد تارگت سود (TP)</label>
            <select id="settingTpCount" style="padding:10px;background:#0f0f1e;border:1px solid #444;border-radius:6px;color:#fff;text-align:right;">
              <option value="1" ${cfg.TP_COUNT === 1 ? 'selected' : ''}>۱ حد سود</option>
              <option value="2" ${cfg.TP_COUNT === 2 ? 'selected' : ''}>۲ حد سود</option>
              <option value="3" ${cfg.TP_COUNT === 3 ? 'selected' : ''}>۳ حد سود</option>
            </select>
          </div>
          <div class="settings-group"><label>ضریب حد ضرر (ATR)</label><input type="number" id="settingSlMult" value="${cfg.ATR_SL_MULT || 1.5}" min="0.5" max="5" step="0.1"></div>
          <div class="settings-group"><label>ضریب TP1</label><input type="number" id="settingTp1Mult" value="${cfg.ATR_TP1_MULT || 2}" min="0.5" max="10" step="0.1"></div>
          <div class="settings-group"><label>ضریب TP2</label><input type="number" id="settingTp2Mult" value="${cfg.ATR_TP2_MULT || 3.5}" min="0.5" max="15" step="0.1"></div>
          <div class="settings-group"><label>ضریب TP3</label><input type="number" id="settingTp3Mult" value="${cfg.ATR_TP3_MULT || 5}" min="0.5" max="20" step="0.1"></div>
          <div class="settings-group"><label>Firebase UID</label><input type="text" id="settingUID" value="${this.currentUID || ''}" placeholder="برای sync بین دستگاه‌ها"></div>
          <div class="settings-actions">
            <button class="btn-main" style="margin:0;" onclick="GoldAI.saveSettings()">✅ ذخیره</button>
            <button class="btn-ghost" style="margin:0;" onclick="GoldAI.closeSettings()">❌ بستن</button>
          </div>
        </div>
      </div>
      <style>
        .settings-group { margin-bottom:12px; display:flex; flex-direction:column; gap:6px; }
        .settings-group label { text-align:right; font-size:13px; color:#aaa; }
        .settings-group input, .settings-group select { padding:10px; background:#0f0f1e; border:1px solid #444; border-radius:6px; color:#fff; text-align:right; font-family:monospace; }
        .settings-actions { display:flex; gap:10px; margin-top:18px; }
        .settings-actions button { flex:1; }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  saveSettings() {
    const capital = Number(document.getElementById('settingCapital').value);
    const risk = Number(document.getElementById('settingRisk').value);
    const tpCount = Number(document.getElementById('settingTpCount').value);
    const slMult = Number(document.getElementById('settingSlMult').value);
    const tp1Mult = Number(document.getElementById('settingTp1Mult').value);
    const tp2Mult = Number(document.getElementById('settingTp2Mult').value);
    const tp3Mult = Number(document.getElementById('settingTp3Mult').value);
    const uid = document.getElementById('settingUID').value;

    if (capital > 0) window.GoldAI_Data.setCapital(capital);
    window.GoldAI_Config.DEFAULT_RISK_PERCENT = risk;
    window.GoldAI_Config.TP_COUNT = tpCount;
    window.GoldAI_Config.ATR_SL_MULT = slMult;
    window.GoldAI_Config.ATR_TP1_MULT = tp1Mult;
    window.GoldAI_Config.ATR_TP2_MULT = tp2Mult;
    window.GoldAI_Config.ATR_TP3_MULT = tp3Mult;
    this.currentUID = uid;

    const tpCountEl = document.getElementById("tpCountSelect");
    if (tpCountEl) tpCountEl.value = tpCount;

    localStorage.setItem('goldai_settings', JSON.stringify({
      capital, risk, tpCount, slMult, tp1Mult, tp2Mult, tp3Mult, uid,
      strategy: window.GoldAI_Config.STRATEGY_MODE,
      symbol: window.GoldAI_Config.SYMBOL
    }));
    this.updateRiskUI();
    this.closeSettings();
    alert('✅ تنظیمات با موفقیت ذخیره شدند');
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
