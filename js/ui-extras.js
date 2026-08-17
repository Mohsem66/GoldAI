// GoldAI UI extras — compact price, settings modal, safe analyze
(function () {
  function ready() {
    if (!window.GoldAI || !window.GoldAI_Data) return setTimeout(ready, 40);
    var G = window.GoldAI;
    var D = window.GoldAI_Data;

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

    // Respect manual lock in price fetch
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

    // Harden analyze — catch errors, keep button usable
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
          // ensure demo data if empty
          if (!D.closes || !D.closes.m5 || !D.closes.m5.length) {
            if (typeof D.seedDemo === "function") D.seedDemo();
          }
          return await _analyze();
        } catch (e) {
          console.error("analyze error:", e);
          alert("خطا در تحلیل: " + (e && e.message ? e.message : e));
          if (btn) btn.disabled = false;
        }
      };
    }

    G.openSettingsModal = function () {
      var cfg = window.GoldAI_Config || {};
      var cap = (D.getCapital && D.getCapital()) || 10000;
      var old = document.getElementById("settingsModal");
      if (old) old.remove();
      var sel = function (cur, v) { return String(cur) === String(v) ? " selected" : ""; };
      var html =
        '<div id="settingsModal" class="modal-backdrop" onclick="if(event.target.id===\'settingsModal\')GoldAI.closeSettingsModal()">' +
        '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<div class="modal-head"><h3>⚙️ تنظیمات</h3>' +
        '<button type="button" class="btn-icon" onclick="GoldAI.closeSettingsModal()">✕</button></div>' +
        '<div class="settings-modal-grid">' +
        '<div class="field"><label>سرمایه ($)</label><input type="number" id="modalCapital" value="' + cap + '" min="100"></div>' +
        '<div class="field"><label>ریسک (%)</label><input type="number" id="modalRisk" value="' + (cfg.DEFAULT_RISK_PERCENT || 1) + '" min="0.1" max="10" step="0.1"></div>' +
        '<div class="field"><label>تعداد TP</label><select id="modalTpCount">' +
        '<option value="1"' + sel(cfg.TP_COUNT, 1) + '>۱</option>' +
        '<option value="2"' + sel(cfg.TP_COUNT, 2) + '>۲</option>' +
        '<option value="3"' + sel(cfg.TP_COUNT || 3, 3) + '>۳</option></select></div>' +
        '<div class="field"><label>لات دستی (۰=خودکار)</label><input type="number" id="modalLot" value="' + (cfg.USER_LOT || 0) + '" step="0.01" min="0"></div>' +
        '<div class="field"><label>ضریب SL</label><input type="number" id="modalSl" value="' + (cfg.ATR_SL_MULT || 1.5) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP1</label><input type="number" id="modalTp1" value="' + (cfg.ATR_TP1_MULT || 2) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP2</label><input type="number" id="modalTp2" value="' + (cfg.ATR_TP2_MULT || 3.5) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP3</label><input type="number" id="modalTp3" value="' + (cfg.ATR_TP3_MULT || 5) + '" step="0.1"></div>' +
        '<div class="field full"><label>استراتژی</label><select id="modalStrategy">' +
        '<option value="scalp"' + (cfg.STRATEGY_MODE !== "swing" ? " selected" : "") + '>اسکالپ</option>' +
        '<option value="swing"' + (cfg.STRATEGY_MODE === "swing" ? " selected" : "") + '>سوئینگ</option></select></div>' +
        '</div><div class="modal-actions">' +
        '<button type="button" class="btn-main" onclick="GoldAI.saveSettingsModal()">ذخیره</button>' +
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
      sync("advCapital", capital);
      sync("advRisk", risk);
      sync("userTpCount", tpCount);
      sync("userLot", lot);
      sync("userSlMult", sl);
      sync("userTp1Mult", tp1);
      sync("userTp2Mult", tp2);
      sync("userTp3Mult", tp3);
      sync("strategySelect", strategy);

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
    };

    // Missing changeSymbol on some app.js builds
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
          console.error(e);
          if (D.seedDemo) D.seedDemo();
          this.updatePriceUI && this.updatePriceUI();
        }
      };
    }

    // Safe runBacktest if missing
    if (!G.runBacktest) {
      G.runBacktest = function () {
        try {
          if (window.GoldAI_Backtest && window.GoldAI_Backtest.runWalkForward) {
            var data = D.closes.m5 || [];
            var res = window.GoldAI_Backtest.runWalkForward(data);
            var box = document.getElementById("backtestSummary");
            if (box) box.textContent = JSON.stringify(res, null, 2);
          } else {
            alert("موتور بک‌تست در دسترس نیست");
          }
        } catch (e) {
          alert("خطا در بک‌تست: " + e.message);
        }
      };
    }
  }
  ready();
})();
