// GoldAI UI extras — settings, price, history, backtest
(function () {
  function ready() {
    if (!window.GoldAI || !window.GoldAI_Data) return setTimeout(ready, 40);
    var G = window.GoldAI;
    var D = window.GoldAI_Data;

    // ---- Manual price ----
    G.applyManualPrice = function () {
      var el = document.getElementById("manualEntryInput");
      if (!el) return;
      var v = Number(el.value);
      if (!v || isNaN(v) || v <= 0) {
        alert("یک قیمت معتبر وارد کنید");
        return;
      }
      D.goldPrice = v;
      D.manualPriceLock = true;
      this.updatePriceUI && this.updatePriceUI();
    };

    G.refreshPrice = async function () {
      D.manualPriceLock = false;
      var el = document.getElementById("manualEntryInput");
      if (el) el.value = "";
      try {
        if (this.fetchPriceFromBackend) await this.fetchPriceFromBackend();
      } catch (e) {}
      this.updatePriceUI && this.updatePriceUI();
      var price = D.goldPrice;
      if (price > 0 && D.livePriceOk) alert("✅ قیمت آنلاین: " + price);
      else alert("⚠️ قیمت آنلاین نیست — بک‌اند را روشن کنید یا قیمت دستی بدهید.\n" + (this.backendURL || "http://localhost:5000/api"));
    };

    if (G.fetchPriceFromBackend && !G.__fetchWrapped) {
      G.__fetchWrapped = true;
      var _fetch = G.fetchPriceFromBackend.bind(G);
      G.fetchPriceFromBackend = async function () {
        if (D.manualPriceLock && D.goldPrice > 0) return D.goldPrice;
        var p = await _fetch();
        if (p > 0) {
          D.livePriceOk = true;
          if (D.dataMode === "demo") D.dataMode = "mixed";
        }
        return p;
      };
    }

    if (G.analyze && !G.__analyzeWrapped) {
      G.__analyzeWrapped = true;
      var _analyze = G.analyze.bind(G);
      G.analyze = async function () {
        var btn = document.getElementById("analyzeBtn");
        try {
          var el = document.getElementById("manualEntryInput");
          if (D.manualPriceLock && el) {
            var v = Number(el.value);
            if (v > 0) D.goldPrice = v;
          }
          if (!D.closes || !D.closes.m5 || !D.closes.m5.length) {
            if (typeof D.seedDemo === "function") D.seedDemo();
          }
          var out = await _analyze();
          // refresh history panel data in memory
          try {
            var h = JSON.parse(localStorage.getItem("goldai_history") || "[]");
            this.signalHistory = h.slice(0, 50);
          } catch (e) {}
          return out;
        } catch (e) {
          console.error("analyze error:", e);
          alert("خطا در تحلیل: " + (e && e.message ? e.message : e));
          if (btn) btn.disabled = false;
        }
      };
    }

    // ---- Settings modal ----
    G.openSettingsModal = function () {
      var cfg = window.GoldAI_Config || {};
      var cap = (D.getCapital && D.getCapital()) || 10000;
      var old = document.getElementById("settingsModal");
      if (old) old.remove();
      var sel = function (cur, v) { return String(cur) === String(v) ? " selected" : ""; };
      var html =
        '<div id="settingsModal" class="modal-backdrop" onclick="if(event.target.id===\'settingsModal\')GoldAI.closeSettingsModal()">' +
        '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<div class="modal-head"><h3>⚙️ تنظیمات پروژه</h3>' +
        '<button type="button" class="btn-icon" onclick="GoldAI.closeSettingsModal()">✕</button></div>' +
        '<div class="settings-modal-grid">' +
        '<div class="field"><label>سرمایه ($)</label><input type="number" id="modalCapital" value="' + cap + '" min="100"></div>' +
        '<div class="field"><label>ریسک (%)</label><input type="number" id="modalRisk" value="' + (cfg.DEFAULT_RISK_PERCENT || 1) + '" min="0.1" max="10" step="0.1"></div>' +
        '<div class="field"><label>تعداد TP</label><select id="modalTpCount">' +
        '<option value="1"' + sel(cfg.TP_COUNT, 1) + '>۱</option>' +
        '<option value="2"' + sel(cfg.TP_COUNT, 2) + '>۲</option>' +
        '<option value="3"' + sel(cfg.TP_COUNT || 3, 3) + '>۳</option></select></div>' +
        '<div class="field"><label>لات دستی (۰=خودکار)</label><input type="number" id="modalLot" value="' + (cfg.USER_LOT || 0) + '" step="0.01" min="0"></div>' +
        '<div class="field"><label>ضریب SL (ATR)</label><input type="number" id="modalSl" value="' + (cfg.ATR_SL_MULT || 1.5) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP1</label><input type="number" id="modalTp1" value="' + (cfg.ATR_TP1_MULT || 2) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP2</label><input type="number" id="modalTp2" value="' + (cfg.ATR_TP2_MULT || 3.5) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP3</label><input type="number" id="modalTp3" value="' + (cfg.ATR_TP3_MULT || 5) + '" step="0.1"></div>' +
        '<div class="field full"><label>استراتژی</label><select id="modalStrategy">' +
        '<option value="scalp"' + (cfg.STRATEGY_MODE !== "swing" ? " selected" : "") + '>اسکالپ</option>' +
        '<option value="swing"' + (cfg.STRATEGY_MODE === "swing" ? " selected" : "") + '>سوئینگ</option></select></div>' +
        '</div><div class="modal-actions">' +
        '<button type="button" class="btn-main" onclick="GoldAI.saveSettingsModal()">💾 ذخیره</button>' +
        '<button type="button" class="btn-ghost" onclick="GoldAI.closeSettingsModal()">بستن</button>' +
        '</div></div></div>';
      document.body.insertAdjacentHTML("beforeend", html);
    };

    G.closeSettingsModal = function () {
      var m = document.getElementById("settingsModal");
      if (m) m.remove();
    };

    G.saveSettingsModal = function () {
      var g = function (id) { return document.getElementById(id); };
      var capital = parseFloat(g("modalCapital") && g("modalCapital").value) || 10000;
      var risk = parseFloat(g("modalRisk") && g("modalRisk").value) || 1;
      var tpCount = parseInt(g("modalTpCount") && g("modalTpCount").value, 10) || 3;
      var lot = parseFloat(g("modalLot") && g("modalLot").value) || 0;
      var sl = parseFloat(g("modalSl") && g("modalSl").value) || 1.5;
      var tp1 = parseFloat(g("modalTp1") && g("modalTp1").value) || 2;
      var tp2 = parseFloat(g("modalTp2") && g("modalTp2").value) || 3.5;
      var tp3 = parseFloat(g("modalTp3") && g("modalTp3").value) || 5;
      var strategy = (g("modalStrategy") && g("modalStrategy").value) || "scalp";

      if (D.setCapital) D.setCapital(capital);
      var cfg = window.GoldAI_Config;
      cfg.DEFAULT_RISK_PERCENT = risk;
      cfg.TP_COUNT = tpCount;
      cfg.USER_LOT = lot;
      cfg.ATR_SL_MULT = sl;
      cfg.ATR_TP1_MULT = tp1;
      cfg.ATR_TP2_MULT = tp2;
      cfg.ATR_TP3_MULT = tp3;
      cfg.STRATEGY_MODE = strategy;

      var sync = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
      };
      sync("advCapital", capital); sync("advRisk", risk); sync("userTpCount", tpCount);
      sync("userLot", lot); sync("userSlMult", sl); sync("userTp1Mult", tp1);
      sync("userTp2Mult", tp2); sync("userTp3Mult", tp3); sync("strategySelect", strategy);

      try {
        var stored = JSON.parse(localStorage.getItem("goldai_settings") || "{}");
        Object.assign(stored, {
          capital: capital, risk: risk, tpCount: tpCount, userLot: lot,
          slMult: sl, tp1Mult: tp1, tp2Mult: tp2, tp3Mult: tp3, strategy: strategy
        });
        localStorage.setItem("goldai_settings", JSON.stringify(stored));
      } catch (e) {}

      this.updateRiskUI && this.updateRiskUI();
      this.closeSettingsModal();
      alert("✅ تنظیمات ذخیره شد");
    };

    // ---- History ----
    G.getHistory = function () {
      try {
        return JSON.parse(localStorage.getItem("goldai_history") || "[]");
      } catch (e) {
        return [];
      }
    };

    G.renderPerformance = function () {
      var list = this.getHistory();
      this.signalHistory = list.slice(0, 50);

      var total = list.length, buy = 0, sell = 0, wait = 0;
      list.forEach(function (x) {
        var s = String(x.signal || "");
        if (s.indexOf("BUY") >= 0) buy++;
        else if (s.indexOf("SELL") >= 0) sell++;
        else wait++;
      });

      var set = function (id, v) {
        var el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set("perfTotal", total);
      set("perfBuy", buy);
      set("perfSell", sell);
      set("perfWait", wait);

      var box = document.getElementById("historyList");
      if (!box) return;
      if (!list.length) {
        box.innerHTML = '<div class="history-meta" style="padding:12px;opacity:.7">هنوز سیگنالی ذخیره نشده. بعد از تحلیل اینجا نمایش داده می‌شود.</div>';
        return;
      }

      box.innerHTML = list.slice(0, 40).map(function (x) {
        var s = String(x.signal || "WAIT");
        var cls = s.indexOf("BUY") >= 0 ? "sig-buy" : s.indexOf("SELL") >= 0 ? "sig-sell" : "sig-wait";
        var entry = x.entry != null ? x.entry : "—";
        var conf = x.conf != null ? x.conf : (x.confidence != null ? x.confidence : "—");
        return (
          '<div class="history-item">' +
          '<div><b class="' + cls + '">' + s + '</b> · ' + (x.symbol || "") +
          '<div class="history-meta">Entry: ' + entry + ' | SL: ' + (x.sl || "—") + ' | TP1: ' + (x.tp1 || "—") + '</div></div>' +
          '<div class="history-meta" style="text-align:left;direction:ltr">' + (x.t || "") + '<br>Conf: ' + conf + '%</div>' +
          '</div>'
        );
      }).join("");
    };

    G.clearPerformanceHistory = function () {
      if (!confirm("تاریخچه سیگنال‌ها پاک شود؟")) return;
      localStorage.removeItem("goldai_history");
      this.signalHistory = [];
      this.renderPerformance();
      var bt = document.getElementById("backtestSummary");
      if (bt) {
        bt.classList.add("hidden");
        bt.innerHTML = "";
      }
    };

    // ---- Backtest ----
    G.runBacktest = function () {
      var box = document.getElementById("backtestSummary");
      try {
        if (!D.closes || !D.closes.m5 || D.closes.m5.length < 40) {
          if (D.seedDemo) D.seedDemo();
        }
        if (!window.GoldAI_Backtest || !window.GoldAI_Backtest.runWalkForward) {
          alert("موتور بک‌تست لود نشده (js/engines/backtest.js)");
          return;
        }
        var report = window.GoldAI_Backtest.runWalkForward({
          closes: D.closes.m5,
          highs: D.highs.m5,
          lows: D.lows.m5,
          volumes: D.volumes.m5,
          candles: D.candles.m5,
          cfg: window.GoldAI_Config,
          windowSize: 60,
          horizon: 3
        });

        var trades = report.trades || report.totalTrades || 0;
        var wins = report.wins || 0;
        var losses = report.losses || 0;
        var net = report.net != null ? report.net : (report.netProfit != null ? report.netProfit : 0);
        var wr = trades > 0 ? ((wins / trades) * 100).toFixed(1) : "0.0";

        if (box) {
          box.classList.remove("hidden");
          box.innerHTML =
            "<b>نتیجه Walk-Forward</b><br>" +
            "معاملات: <b>" + trades + "</b> &nbsp;|&nbsp; برد: <b>" + wins + "</b> &nbsp;|&nbsp; باخت: <b>" + losses + "</b><br>" +
            "وین‌ریت: <b>" + wr + "%</b> &nbsp;|&nbsp; Net (تقریبی %): <b>" + (typeof net === "number" ? net.toFixed(2) : net) + "</b><br>" +
            "<span style='opacity:.7;font-size:12px'>بدون نگاه به آینده — فقط روی پنجره گذشته سیگنال می‌سازد.</span>";
        } else {
          alert("Trades: " + trades + " | WinRate: " + wr + "%");
        }
      } catch (e) {
        console.error(e);
        if (box) {
          box.classList.remove("hidden");
          box.textContent = "خطا در بک‌تست: " + e.message;
        } else alert("خطا در بک‌تست: " + e.message);
      }
    };

    // ---- showPanel: refresh history when opening performance ----
    if (G.showPanel && !G.__showPanelWrapped) {
      G.__showPanelWrapped = true;
      var _show = G.showPanel.bind(G);
      G.showPanel = function (name) {
        _show(name);
        if (name === "performance") this.renderPerformance();
      };
    }

    if (!G.changeSymbol) {
      G.changeSymbol = async function () {
        var select = document.getElementById("symbolSelect");
        if (!select) return;
        window.GoldAI_Config.SYMBOL = select.value;
        D.manualPriceLock = false;
        try {
          if (D.resetData) D.resetData();
          if (D.loadAll) await D.loadAll();
          if (!D.closes.m5.length && D.seedDemo) D.seedDemo();
          if (this.fetchPriceFromBackend) await this.fetchPriceFromBackend();
          this.updatePriceUI && this.updatePriceUI();
        } catch (e) {
          if (D.seedDemo) D.seedDemo();
          this.updatePriceUI && this.updatePriceUI();
        }
      };
    }
  }
  ready();
})();
