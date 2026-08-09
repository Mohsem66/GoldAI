// =====================================
// GoldAI Pro — AI-Enhanced Main Orchestrator
// =====================================

window.GoldAI = {

  lastResult: null,
  backendURL: 'http://localhost:5000/api',
  currentUID: null,

  async init() {
    const data = window.GoldAI_Data;
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

  // ===== Settings Panel Setup =====
  setupSettingsPanel() {
    const settingsBtn = document.querySelector('[onclick="GoldAI.openSettings()"]') || 
                       document.querySelector('[data-action="settings"]');
    if (!settingsBtn) {
      // ایجاد دکمه Settings اگر وجود ندارد
      const newBtn = document.createElement('button');
      newBtn.className = 'btn-ghost';
      newBtn.textContent = '⚙️ تنظیمات';
      newBtn.onclick = () => this.openSettings();
      const riskCard = document.querySelector('.card');
      if (riskCard) riskCard.appendChild(newBtn);
    }
  },

  openSettings() {
    const html = `
      <div id="settingsModal" class="modal">
        <div class="modal-content">
          <h3>⚙️ تنظیمات تجارتی</h3>
          
          <div class="settings-group">
            <label>سرمایه ($)</label>
            <input type="number" id="settingCapital" value="${window.GoldAI_Data.getCapital()}" min="100">
          </div>

          <div class="settings-group">
            <label>درصد ریسک (%)</label>
            <input type="number" id="settingRisk" value="${window.GoldAI_Config.DEFAULT_RISK_PERCENT}" min="0.1" max="5" step="0.1">
          </div>

          <div class="settings-group">
            <label>لات</label>
            <input type="number" id="settingLot" value="0.01" min="0.01" step="0.01">
          </div>

          <div class="settings-group">
            <label>Risk:Reward نسبت</label>
            <input type="number" id="settingRR" value="${window.GoldAI_Config.RISK_REWARD || 2}" min="1" max="10" step="0.5">
          </div>

          <div class="settings-group">
            <label>Firebase UID</label>
            <input type="text" id="settingUID" placeholder="برای sync بین دستگاه‌ها">
          </div>

          <div class="settings-actions">
            <button class="btn-main" onclick="GoldAI.saveSettings()">✅ ذخیره</button>
            <button class="btn-ghost" onclick="GoldAI.closeSettings()">❌ بستن</button>
          </div>
        </div>
      </div>
      <style>
        .modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
        }
        .modal-content {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .modal-content h3 {
          margin-bottom: 20px;
          text-align: right;
        }
        .settings-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .settings-group label {
          text-align: right;
          font-size: 14px;
          color: #aaa;
        }
        .settings-group input {
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
          margin-top: 24px;
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
    const lot = Number(document.getElementById('settingLot').value);
    const rr = Number(document.getElementById('settingRR').value);
    const uid = document.getElementById('settingUID').value;

    if (capital > 0) window.GoldAI_Data.setCapital(capital);
    window.GoldAI_Config.DEFAULT_RISK_PERCENT = risk;
    window.GoldAI_Config.RISK_REWARD = rr;
    this.currentUID = uid;

    localStorage.setItem('goldai_settings', JSON.stringify({ capital, risk, lot, rr, uid }));
    this.updateRiskUI();
    this.closeSettings();
    alert('✅ تنظیمات ذخیره شد');
  },

  closeSettings() {
    document.getElementById('settingsModal')?.remove();
  },

  updatePriceUI() {
    const el = document.getElementById("goldPrice");
    if (el) el.textContent = window.GoldAI_Data.goldPrice
      ? window.GoldAI_Data.goldPrice.toFixed(2)
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
    if (c) c.textContent = cap;
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

    const ms = document.getElementById("marketStatus");
    const ss = document.getElementById("marketSession");
    const ts = document.getElementById("tradeStatus");
    const timeDisplay = document.getElementById("timeDisplay") || this.createTimeDisplay();
    
    if (ms) ms.textContent = open ? "🟢 OPEN" : "🔴 CLOSED";
    if (ss) ss.textContent = session;
    if (ts) {
      ts.textContent = open ? "SAFE TO TRADE" : "DO NOT TRADE";
      ts.className = open ? "ok" : "bad";
    }
    if (timeDisplay) {
      try {
        const dateOpt = { timeZone: 'Asia/Tehran', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOpt = { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const pDate = new Intl.DateTimeFormat('fa-IR', dateOpt).format(now);
        const pTime = new Intl.DateTimeFormat('fa-IR', timeOpt).format(now);
        timeDisplay.textContent = `${pDate} ساعت ${pTime} (به وقت ایران)`;
      } catch (e) {
        console.error("CLOCK ERROR:", e);
        timeDisplay.textContent = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')} UTC`;
      }
    }
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

      // Primary TF = M5, HTF = H1, M1 = Scalp
      const closes = data.closes.m5;
      const highs = data.highs.m5;
      const lows = data.lows.m5;
      const vols = data.volumes.m5;
      const candles = data.candles.m5;
      const price = data.goldPrice || closes[closes.length - 1];

      const htfCloses = data.closes.h1.length ? data.closes.h1 : data.closes.m15;
      const htfHighs = data.highs.h1.length ? data.highs.h1 : data.highs.m15;
      const htfLows = data.lows.h1.length ? data.lows.h1 : data.lows.m15;

      const m1Closes = data.closes.m1 || [];
      const m1Highs = data.highs.m1 || [];
      const m1Lows = data.lows.m1 || [];

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

      // M1 Scalp Context
      let m1 = null;
      if (m1Closes.length > 5) {
        const m1Ema = window.GoldAI_EMA.analyzeEMA(m1Closes, m1Closes[m1Closes.length - 1], cfg);
        m1 = {
          microstructure: m1Ema.trend
        };
      }

      // Running new Fundamental and Correlation engines
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
        tf: "M5 entry · H1 bias · M1 scalp context"
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
    if (!this.currentUID) return; // بدون UID ، نمی‌فرستم
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

    set("signal", r.signal);
    set("confidence", r.confidence + "%");
    set("entry", r.entry);
    set("sl", r.stopLoss);
    set("tp1", r.tp1);
    set("tp2", r.tp2);
    set("tp3", r.tp3);
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
    set("dEma20", L.ema?.ema20 ?? "—");
    set("dEma50", L.ema?.ema50 ?? "—");
    set("dEma200", L.ema?.ema200 ?? "—");
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
      signal: r.signal,
      entry: r.entry,
      sl: r.stopLoss,
      tp: r.tp2,
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

    if (name === "history") this.renderHistory();
    if (name === "details" && this.lastResult) this.render(this.lastResult);
  },

  renderHistory() {
    const box = document.getElementById("historyList");
    if (!box) return;
    let h = [];
    try { h = JSON.parse(localStorage.getItem("goldai_history") || "[]"); } catch (_) {}
    if (!h.length) {
      box.innerHTML = "<p class='muted'>No history yet</p>";
      return;
    }
    box.innerHTML = h.map(x =>
      `<div class="hist-row">
        <span>${x.t}</span>
        <b>${x.signal}</b>
        <span>E:${x.entry}</span>
        <span>${x.conf}%</span>
      </div>`
    ).join("");
  },

  copySignal() {
    const r = this.lastResult;
    if (!r) return alert("Run analysis first");
    const text =
`GoldAI Signal
${r.signal} | Conf ${r.confidence}%
Entry: ${r.entry}
SL: ${r.stopLoss}
TP1: ${r.tp1} | TP2: ${r.tp2} | TP3: ${r.tp3}
RR: ${r.riskReward} | Lot: ${r.lot}
${r.reason}`;
    navigator.clipboard.writeText(text).then(() => alert("✅ Copied"));
  },

  shareSignal() {
    const r = this.lastResult;
    if (!r) return alert("ابتدا تحلیل را شروع کنید");
    
    const text =
`🥇 سیگنال طلا GoldAI
${r.signal} | اطمینان: ${r.confidence}%
نقطه ورود: ${r.entry}
حد ضرر (SL): ${r.stopLoss}
حد سودها: TP1: ${r.tp1} | TP2: ${r.tp2} | TP3: ${r.tp3}
نسبت ریسک به ریوارد: ${r.riskReward} | لات: ${r.lot}
کانال: #GoldAI #Trading`;

    const platforms = {
      telegram: `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    };

    // حذف مدال قبلی اگر وجود داشته باشد
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
