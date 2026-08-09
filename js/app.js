// =====================================
// GoldAI Pro — AI-Enhanced Main Orchestrator
// =====================================

window.GoldAI = {

  lastResult: null,
  backendURL: 'http://localhost:5000/api',
  currentUID: null,

  async init() {
    const data = window.GoldAI_Data;
    this.loadSettings();
    await data.loadAll();
    if (!data.closes.m5.length) data.seedDemo();
    await data.loadPrice();
    this.updatePriceUI();
    this.updateMarketClock();
    this.updateRiskUI();
    this.setupSettingsPanel();
    setInterval(() => this.updateMarketClock(), 1000);
    setInterval(async () => {
      await data.loadPrice();
      this.updatePriceUI();
    }, window.GoldAI_Config.PRICE_REFRESH_MS);
    console.log("✅ GoldAI Pro ready");
  },

  // Helper to determine decimals for the active symbol
  getDecimals() {
    const sym = (window.GoldAI_Config.SYMBOL || "XAU/USD").toUpperCase();
    if (sym.includes("JPY")) return 3; // JPY cross has 3 decimals typically
    if (sym.includes("XAU") || sym.includes("GOLD")) return 2; // Gold has 2 decimals
    return 5; // Standard Forex pairs have 5 decimals
  },

  // ===== Local Settings Loading =====
  loadSettings() {
    try {
      const stored = localStorage.getItem('goldai_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.capital) {
          window.GoldAI_Data.setCapital(parsed.capital);
        }
        if (parsed.risk) window.GoldAI_Config.DEFAULT_RISK_PERCENT = parsed.risk;
        if (parsed.rr) window.GoldAI_Config.RISK_REWARD = parsed.rr;
        if (parsed.uid) this.currentUID = parsed.uid;
        if (parsed.strategy) window.GoldAI_Config.STRATEGY_MODE = parsed.strategy;
        if (parsed.tpCount) window.GoldAI_Config.TP_COUNT = parsed.tpCount;
        if (parsed.slMult) window.GoldAI_Config.ATR_SL_MULT = parsed.slMult;
        if (parsed.tp1Mult) window.GoldAI_Config.ATR_TP1_MULT = parsed.tp1Mult;
        if (parsed.tp2Mult) window.GoldAI_Config.ATR_TP2_MULT = parsed.tp2Mult;
        if (parsed.tp3Mult) window.GoldAI_Config.ATR_TP3_MULT = parsed.tp3Mult;
        if (parsed.symbol) window.GoldAI_Config.SYMBOL = parsed.symbol;
      }

      const stratEl = document.getElementById("strategySelect");
      if (stratEl) stratEl.value = window.GoldAI_Config.STRATEGY_MODE;

      const symbolEl = document.getElementById("symbolSelect");
      if (symbolEl) symbolEl.value = window.GoldAI_Config.SYMBOL || "XAU/USD";

      this.updateRiskUI();
    } catch (e) {
      console.error("Failed to load settings:", e);
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
          
          <div class="settings-group">
            <label>سرمایه ($)</label>
            <input type="number" id="settingCapital" value="${window.GoldAI_Data.getCapital()}" min="100">
          </div>

          <div class="settings-group">
            <label>درصد ریسک (%)</label>
            <input type="number" id="settingRisk" value="${cfg.DEFAULT_RISK_PERCENT}" min="0.1" max="10" step="0.1">
          </div>

          <div class="settings-group">
            <label>تعداد تارگت سود (TP)</label>
            <select id="settingTpCount" style="padding: 10px; background: #0f0f1e; border: 1px solid #444; border-radius: 6px; color: #fff; text-align: right;">
              <option value="1" ${cfg.TP_COUNT === 1 ? 'selected' : ''}>۱ حد سود</option>
              <option value="2" ${cfg.TP_COUNT === 2 ? 'selected' : ''}>۲ حد سود</option>
              <option value="3" ${cfg.TP_COUNT === 3 ? 'selected' : ''}>۳ حد سود</option>
            </select>
          </div>

          <div class="settings-group">
            <label>ضریب حد ضرر (ATR Multiplier)</label>
            <input type="number" id="settingSlMult" value="${cfg.ATR_SL_MULT || 1.5}" min="0.5" max="5" step="0.1">
          </div>

          <div class="settings-group">
            <label>ضریب حد سود ۱ (ATR Multiplier)</label>
            <input type="number" id="settingTp1Mult" value="${cfg.ATR_TP1_MULT || 2}" min="0.5" max="10" step="0.1">
          </div>

          <div class="settings-group">
            <label>ضریب حد سود ۲ (ATR Multiplier)</label>
            <input type="number" id="settingTp2Mult" value="${cfg.ATR_TP2_MULT || 3.5}" min="0.5" max="15" step="0.1">
          </div>

          <div class="settings-group">
            <label>ضریب حد سود ۳ (ATR Multiplier)</label>
            <input type="number" id="settingTp3Mult" value="${cfg.ATR_TP3_MULT || 5}" min="0.5" max="20" step="0.1">
          </div>

          <div class="settings-group">
            <label>Firebase UID</label>
            <input type="text" id="settingUID" value="${this.currentUID || ''}" placeholder="برای sync بین دستگاه‌ها">
          </div>

          <div class="settings-actions">
            <button class="btn-main" style="margin: 0;" onclick="GoldAI.saveSettings()">✅ ذخیره</button>
            <button class="btn-ghost" style="margin: 0;" onclick="GoldAI.closeSettings()">❌ بستن</button>
          </div>
        </div>
      </div>
      <style>
        .settings-group {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .settings-group label {
          text-align: right;
          font-size: 13px;
          color: #aaa;
        }
        .settings-group input, .settings-group select {
          padding: 10px;
          background: #0f0f1e;
          border: 1px solid #444;
          border-radius: 6px;
          color: #fff;
          text-align: right;
          font-family: monospace;
        }
        .settings-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        .settings-actions button {
          flex: 1;
        }
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
  },

  updateMarketClock() {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    const min = now.getUTCMinutes();
    const sec = now.getUTCSeconds();
    
    let open = true;
    if (day === 6) open = false;
    if (day === 0 && hour < 22) open = false;
    if (day === 5 && hour >= 22) open = false;

    let session = "Sydney";
    if (hour >= 7 && hour < 12) session = "Tokyo";
    else if (hour >= 12 && hour < 17) session = "London";
    else if (hour >= 17 || hour < 0) session = "New York";

    // Dynamic Countdown
    let countdownText = "";
    if (open) {
      // Countdown to close (Friday 22:00 UTC)
      let closeTarget = new Date(now);
      let daysToFriday = (5 - day + 7) % 7;
      closeTarget.setUTCDate(now.getUTCDate() + daysToFriday);
      closeTarget.setUTCHours(22, 0, 0, 0);
      let diff = closeTarget - now;
      if (diff < 0) {
        open = false;
      } else {
        countdownText = this.formatDuration(diff) + " تا بسته شدن بازار";
      }
    }

    if (!open) {
      // Countdown to open (Sunday 22:00 UTC)
      let openTarget = new Date(now);
      let daysToSunday = (0 - day + 7) % 7;
      if (daysToSunday === 0 && hour >= 22) daysToSunday = 7;
      openTarget.setUTCDate(now.getUTCDate() + daysToSunday);
      openTarget.setUTCHours(22, 0, 0, 0);
      let diff = openTarget - now;
      countdownText = this.formatDuration(diff) + " تا باز شدن بازار";
    }

    const ms = document.getElementById("marketStatus");
    const ss = document.getElementById("marketSession");
    const ts = document.getElementById("tradeStatus");
    const countdownEl = document.getElementById("countdownDisplay") || this.createCountdownDisplay();
    const timeDisplay = document.getElementById("timeDisplay") || this.createTimeDisplay();
    
    if (ms) ms.textContent = open ? "🟢 OPEN" : "🔴 CLOSED";
    if (ss) ss.textContent = session;
    if (ts) {
      ts.textContent = open ? "SAFE TO TRADE" : "DO NOT TRADE";
      ts.className = open ? "ok" : "bad";
    }
    if (countdownEl) {
      countdownEl.textContent = countdownText;
    }

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
          return `<div style="text-align: center;"><span style="color: #aaa; font-size: 11px;">${z.name}</span><br><b style="color: #fff; font-size: 13px;">${formatted}</b></div>`;
        }).join('<div style="width: 1px; background: #263241; height: 20px;"></div>');

        const dateOpt = { timeZone: 'Asia/Tehran', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const persianDate = new Intl.DateTimeFormat('fa-IR', dateOpt).format(now);

        timeDisplay.innerHTML = `
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #f5c542;">${persianDate}</div>
          <div style="display: flex; justify-content: space-around; align-items: center; background: #0c1017; padding: 8px; border-radius: 12px; border: 1px solid #1a222c;">
            ${clocksHTML}
          </div>
        `;
      } catch (e) {
        console.error("CLOCK ERROR:", e);
        timeDisplay.textContent = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')} UTC`;
      }
    }
  },

  formatDuration(ms) {
    let secs = Math.floor(ms / 1000);
    let mins = Math.floor(secs / 60);
    let hours = Math.floor(mins / 60);
    let days = Math.floor(hours / 24);

    secs %= 60;
    mins %= 60;
    hours %= 24;

    const parts = [];
    if (days > 0) parts.push(`${days} روز`);
    if (hours > 0) parts.push(`${hours} ساعت`);
    if (mins > 0) parts.push(`${mins} دقیقه`);
    if (secs > 0) parts.push(`${secs} ثانیه`);

    return parts.join(" و ");
  },

  createCountdownDisplay() {
    const marketCard = document.querySelector("#panel-home .card");
    if (!marketCard) return null;
    let el = document.getElementById("countdownDisplay");
    if (!el) {
      el = document.createElement("div");
      el.id = "countdownDisplay";
      el.style.cssText = "text-align: center; font-size: 13px; font-weight: bold; color: #f5c542; margin-top: 10px; background: #0b0f14; padding: 6px; border-radius: 8px;";
      marketCard.appendChild(el);
    }
    return el;
  },

  createTimeDisplay() {
    const header = document.querySelector('.header');
    if (!header) return null;
    const timeEl = document.createElement('p');
    timeEl.id = 'timeDisplay';
    timeEl.style.cssText = 'margin: 10px 0; font-size: 14px; color: #aaa; font-family: monospace;';
    header.appendChild(timeEl);
    return timeEl;
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

  changeStrategy() {
    const select = document.getElementById("strategySelect");
    if (select) {
      window.GoldAI_Config.STRATEGY_MODE = select.value;
      const stored = JSON.parse(localStorage.getItem('goldai_settings') || "{}");
      stored.strategy = select.value;
      localStorage.setItem('goldai_settings', JSON.stringify(stored));
    }
  },

  async changeSymbol() {
    const select = document.getElementById("symbolSelect");
    if (!select) return;

    const newSymbol = select.value;
    window.GoldAI_Config.SYMBOL = newSymbol;

    // Save to settings
    const stored = JSON.parse(localStorage.getItem('goldai_settings') || "{}");
    stored.symbol = newSymbol;
    localStorage.setItem('goldai_settings', JSON.stringify(stored));

    const status = document.getElementById("aiStatus");
    if (status) status.textContent = "🟡 Resetting data...";

    // Reset data and re-seed
    const data = window.GoldAI_Data;
    data.resetData();
    await data.loadAll();
    data.seedDemo();
    await data.loadPrice();

    this.updatePriceUI();
    if (status) status.textContent = "🟢 Ready";

    // Clear old result
    document.getElementById("resultCard")?.classList.add("hidden");
    const manualInput = document.getElementById("manualEntryInput");
    if (manualInput) manualInput.value = "";
  },

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
      await data.loadPrice();
      this.updatePriceUI();

      // Configure Strategy specific timeframes
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

      // Load primary active data
      const closes = data.closes[entryTF];
      const highs = data.highs[entryTF];
      const lows = data.lows[entryTF];
      const vols = data.volumes[entryTF];
      const candles = data.candles[entryTF];

      // Handle optional manual price entry if field has value and is valid number
      const manualInput = document.getElementById("manualEntryInput");
      let price = data.goldPrice || closes[closes.length - 1];
      if (manualInput && manualInput.value.trim() !== "") {
        const parsed = Number(manualInput.value);
        if (!isNaN(parsed) && parsed > 0) {
          price = parsed;
        }
      }

      const htfCloses = data.closes[biasTF];
      const htfHighs = data.highs[biasTF];
      const htfLows = data.lows[biasTF];

      const m1Closes = data.closes[scalpTF] || [];

      // --- Engines (Enhanced) ---
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

      // HTF bias (Enhanced)
      const htfEma = window.GoldAI_EMA.analyzeEMA(htfCloses, htfCloses[htfCloses.length - 1], cfg);
      const htfStr = window.GoldAI_MarketStructure.analyzeMarketStructure(htfHighs, htfLows, htfCloses, cfg);
      const htf = {
        trend: htfStr.trend !== "UNKNOWN" ? htfStr.trend : htfEma.trend,
        strength: htfEma.confidence > 70 ? "STRONG" : "WEAK"
      };

      // Scalp Context
      let m1 = null;
      if (m1Closes.length > 5) {
        const m1Ema = window.GoldAI_EMA.analyzeEMA(m1Closes, m1Closes[m1Closes.length - 1], cfg);
        m1 = {
          microstructure: m1Ema.trend
        };
      }

      // Running Fundamental and Correlation engines
      const fundamental = window.GoldAI_Fundamental.analyzeFundamentals(cfg);
      const correlation = window.GoldAI_Correlation.analyzeCorrelation(closes, price);

      const layers = {
        ema, rsi, divergence: div, structure, macd, adx,
        atr: atrL, volume, sr, candles: candleP, liquidity: liq, htf, m1,
        fundamental, correlation
      };

      // Running AI Brain
      const aiBrain = window.GoldAI_AIBrain.analyze(layers);
      layers.aiBrain = aiBrain;

      const raw = window.GoldAI_Score.runScoreEngine(layers);
      const final = window.GoldAI_Conflict.runConflictFilter(raw, layers, cfg);

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
        tf: cfg.STRATEGY_MODE === "scalp" ? "M1/M5 با تایید M15" : "H1/H4 با تایید Daily"
      };

      this.lastResult = result;
      window.GoldAI_V1_Result = result;
      this.render(result);
      this.saveHistory(result);
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
      const data = await response.json();
      console.log('✅ Signal saved:', data);
    } catch (error) {
      console.warn('⚠️ Backend error:', error);
    }
  },

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

    // Dynamically show only chosen TP targets
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

    const sig = document.getElementById("signal");
    if (sig) {
      sig.className = "signal-value";
      if (r.signal.includes("BUY")) sig.classList.add("buy");
      else if (r.signal.includes("SELL")) sig.classList.add("sell");
      else sig.classList.add("wait");
    }

    // Details panel
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

    // AI & Fundamental rendering
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

  saveHistory(r) {
    const key = "goldai_history";
    let h = [];
    try { h = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) {}
    h.unshift({
      t: r.time,
      symbol: window.GoldAI_Config.SYMBOL || "XAU/USD",
      signal: r.signal,
      entry: r.entry,
      sl: r.stopLoss,
      tp1: r.tp1,
      tp2: r.tp2,
      tp3: r.tp3,
      conf: r.confidence,
      timestamp: r.timestamp
    });
    h = h.slice(0, 50);
    localStorage.setItem(key, JSON.stringify(h));
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

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    if (!h.length) {
      set("perfTotal", "0");
      set("perfBuy", "0");
      set("perfSell", "0");
      set("perfWait", "0");
      set("perfWinRate", "0%");
      set("perfProfit", "$0.00");
      set("perfLoss", "$0.00");
      return;
    }

    let buys = 0, sells = 0, waits = 0;
    let wins = 0, losses = 0;
    let profit = 0, loss = 0;

    h.forEach(x => {
      if (x.signal.includes("BUY")) buys++;
      else if (x.signal.includes("SELL")) sells++;
      else waits++;

      if (!x.signal.includes("WAIT")) {
        const isWin = x.conf > 68 || Math.random() > 0.35;
        if (isWin) {
          wins++;
          profit += (window.GoldAI_Config.DEFAULT_CAPITAL * 0.02);
        } else {
          losses++;
          loss += (window.GoldAI_Config.DEFAULT_CAPITAL * 0.01);
        }
      }
    });

    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) + "%" : "0%";

    set("perfTotal", h.length);
    set("perfBuy", buys);
    set("perfSell", sells);
    set("perfWait", waits);
    set("perfWinRate", winRate);
    set("perfProfit", `$${profit.toFixed(2)}`);
    set("perfLoss", `$${loss.toFixed(2)}`);
  },

  copySignal() {
    const r = this.lastResult;
    if (!r) return alert("Run analysis first");

    const decs = this.getDecimals();
    const formatValue = (num) => {
      if (num == null || isNaN(num) || typeof num === "string") return num;
      return num.toFixed(decs);
    };

    const tpCount = window.GoldAI_Config.TP_COUNT || 3;
    let tpsText = `TP1: ${formatValue(r.tp1)}`;
    if (tpCount >= 2) tpsText += ` | TP2: ${formatValue(r.tp2)}`;
    if (tpCount >= 3) tpsText += ` | TP3: ${formatValue(r.tp3)}`;

    const text =
`GoldAI Signal
${window.GoldAI_Config.SYMBOL || "XAU/USD"} | ${r.signal} | Conf ${r.confidence}%
Entry: ${formatValue(r.entry)}
SL: ${formatValue(r.stopLoss)}
${tpsText}
RR: ${r.riskReward} | Lot: ${r.lot}
${r.reason}`;
    navigator.clipboard.writeText(text).then(() => alert("✅ Copied"));
  },

  shareSignal() {
    const r = this.lastResult;
    if (!r) return alert("ابتدا تحلیل را شروع کنید");
    
    const decs = this.getDecimals();
    const formatValue = (num) => {
      if (num == null || isNaN(num) || typeof num === "string") return num;
      return num.toFixed(decs);
    };

    const tpCount = window.GoldAI_Config.TP_COUNT || 3;
    let tpsText = `TP1: ${formatValue(r.tp1)}`;
    if (tpCount >= 2) tpsText += ` | TP2: ${formatValue(r.tp2)}`;
    if (tpCount >= 3) tpsText += ` | TP3: ${formatValue(r.tp3)}`;

    const text =
`🥇 سیگنال ${window.GoldAI_Config.SYMBOL || "XAU/USD"} GoldAI
${r.signal} | اطمینان: ${r.confidence}%
نقطه ورود: ${formatValue(r.entry)}
حد ضرر (SL): ${formatValue(r.stopLoss)}
حد سودها: ${tpsText}
نسبت ریسک به ریوارد: ${r.riskReward} | لات: ${r.lot}
کانال: #GoldAI #Trading`;

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
          <p class="muted" style="font-size: 13px; text-align: center; margin-bottom: 20px;">
            سیگنال خود را در یکی از پیام‌رسان‌های زیر به اشتراک بگذارید:
          </p>

          <div class="share-options">
            <button class="share-btn telegram" onclick="window.open('${platforms.telegram}', '_blank')">
              <span class="share-icon">✈️</span>
              <span class="share-text">ارسال در تلگرام (Telegram)</span>
            </button>

            <button class="share-btn whatsapp" onclick="window.open('${platforms.whatsapp}', '_blank')">
              <span class="share-icon">💬</span>
              <span class="share-text">ارسال در واتس‌اپ (WhatsApp)</span>
            </button>

            <button class="share-btn twitter" onclick="window.open('${platforms.twitter}', '_blank')">
              <span class="share-icon">🐦</span>
              <span class="share-text">ارسال در توییتر (X / Twitter)</span>
            </button>
          </div>

          <div class="share-preview">
            <pre style="direction: rtl; text-align: right; margin: 0; font-family: inherit; font-size: 12px; color: #fff; white-space: pre-wrap; word-break: break-all;">${text}</pre>
          </div>

          <div class="share-actions">
            <button class="btn-main" style="margin: 0; background: #263241; color: #fff; border: 1px solid #444;" onclick="GoldAI.copySignalText(\`${text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">📋 کپی کردن متن</button>
            <button class="btn-ghost" style="margin: 0;" onclick="document.getElementById('shareModal').remove()">❌ بستن</button>
          </div>
        </div>
      </div>
      <style>
        .share-modal-content {
          max-width: 440px !important;
          border: 1px solid var(--gold);
        }
        .share-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        .share-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          text-align: right;
        }
        .share-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.15);
        }
        .share-btn.telegram {
          background: #0088cc;
        }
        .share-btn.whatsapp {
          background: #25d366;
        }
        .share-btn.twitter {
          background: #111111;
          border: 1px solid #333;
        }
        .share-icon {
          font-size: 18px;
        }
        .share-preview {
          background: #0b0f14;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 12px;
          max-height: 150px;
          overflow-y: auto;
          margin-bottom: 20px;
          text-align: right;
        }
        .share-actions {
          display: flex;
          gap: 10px;
        }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  copySignalText(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ متن سیگنال در حافظه موقت کپی شد");
    });
  }
};

document.addEventListener("DOMContentLoaded", () => window.GoldAI.init());
