// GoldAI UI — manual price checkbox + settings modal + analyze safety
(function () {
  function ready() {
    if (!window.GoldAI || !window.GoldAI_Data) return setTimeout(ready, 40);

    window.GoldAI.onManualPriceToggle = function () {
      var chk = document.getElementById("manualPriceCheck");
      var el = document.getElementById("manualEntryInput");
      if (!chk || !el) return;
      if (chk.checked) {
        el.disabled = false;
        el.focus();
        var v = Number(el.value);
        if (v > 0) {
          window.GoldAI_Data.goldPrice = v;
          window.GoldAI_Data.manualPriceLock = true;
          this.updatePriceUI();
        }
      } else {
        el.disabled = true;
        window.GoldAI_Data.manualPriceLock = false;
        this.refreshPriceQuiet && this.refreshPriceQuiet();
      }
    };

    window.GoldAI.onManualPriceInput = function () {
      var chk = document.getElementById("manualPriceCheck");
      var el = document.getElementById("manualEntryInput");
      if (!chk || !chk.checked || !el) return;
      var v = Number(el.value);
      if (v > 0) {
        window.GoldAI_Data.goldPrice = v;
        window.GoldAI_Data.manualPriceLock = true;
        this.updatePriceUI();
      }
    };

    window.GoldAI.refreshPriceQuiet = async function () {
      window.GoldAI_Data.manualPriceLock = false;
      var chk = document.getElementById("manualPriceCheck");
      var el = document.getElementById("manualEntryInput");
      if (chk) chk.checked = false;
      if (el) { el.value = ""; el.disabled = true; }
      try { await this.fetchPriceFromBackend(); } catch (e) {}
      this.updatePriceUI();
    };

    window.GoldAI.refreshPrice = async function () {
      await this.refreshPriceQuiet();
      var price = window.GoldAI_Data.goldPrice;
      if (price > 0 && window.GoldAI_Data.livePriceOk) alert("✅ قیمت آنلاین: " + price);
      else alert("⚠️ قیمت آنلاین در دسترس نیست.\nبک‌اند را روشن کنید یا تیک «دستی» را بزنید.\n" + (this.backendURL || ""));
    };

    var _fetch = window.GoldAI.fetchPriceFromBackend && window.GoldAI.fetchPriceFromBackend.bind(window.GoldAI);
    if (_fetch) {
      window.GoldAI.fetchPriceFromBackend = async function () {
        if (window.GoldAI_Data.manualPriceLock && window.GoldAI_Data.goldPrice > 0) return window.GoldAI_Data.goldPrice;
        var p = await _fetch();
        if (p > 0) {
          window.GoldAI_Data.livePriceOk = true;
          if (window.GoldAI_Data.dataMode === "demo") window.GoldAI_Data.dataMode = "mixed";
        }
        return p;
      };
    }

    var _analyze = window.GoldAI.analyze && window.GoldAI.analyze.bind(window.GoldAI);
    if (_analyze) {
      window.GoldAI.analyze = async function () {
        var chk = document.getElementById("manualPriceCheck");
        var el = document.getElementById("manualEntryInput");
        if (chk && chk.checked && el) {
          var v = Number(el.value);
          if (v > 0) {
            window.GoldAI_Data.goldPrice = v;
            window.GoldAI_Data.manualPriceLock = true;
          }
        }
        try {
          return await _analyze();
        } catch (e) {
          console.error("analyze error:", e);
          alert("خطا در تحلیل: " + (e && e.message ? e.message : e));
          var btn = document.getElementById("analyzeBtn");
          if (btn) btn.disabled = false;
        }
      };
    }

    window.GoldAI.openSettingsModal = function () {
      var cfg = window.GoldAI_Config || {};
      var cap = (window.GoldAI_Data.getCapital && window.GoldAI_Data.getCapital()) || 10000;
      var old = document.getElementById("settingsModal");
      if (old) old.remove();
      var html = '<div id="settingsModal" class="modal-backdrop" onclick="if(event.target.id===\'settingsModal\')GoldAI.closeSettingsModal()">' +
        '<div class="modal-sheet" onclick="event.stopPropagation()">' +
        '<div class="modal-head"><h3>⚙️ تنظیمات</h3><button type="button" class="btn-icon" onclick="GoldAI.closeSettingsModal()">✕</button></div>' +
        '<div class="settings-modal-grid">' +
        '<div class="field"><label>سرمایه ($)</label><input type="number" id="modalCapital" value="' + cap + '" min="100"></div>' +
        '<div class="field"><label>ریسک (%)</label><input type="number" id="modalRisk" value="' + (cfg.DEFAULT_RISK_PERCENT || 1) + '" min="0.1" max="10" step="0.1"></div>' +
        '<div class="field"><label>تعداد TP</label><select id="modalTpCount">' +
        '<option value="1"' + (cfg.TP_COUNT == 1 ? ' selected' : '') + '>۱</option>' +
        '<option value="2"' + (cfg.TP_COUNT == 2 ? ' selected' : '') + '>۲</option>' +
        '<option value="3"' + ((cfg.TP_COUNT || 3) == 3 ? ' selected' : '') + '>۳</option></select></div>' +
        '<div class="field"><label>لات دستی (۰=خودکار)</label><input type="number" id="modalLot" value="' + (cfg.USER_LOT || 0) + '" step="0.01" min="0"></div>' +
        '<div class="field"><label>ضریب SL</label><input type="number" id="modalSl" value="' + (cfg.ATR_SL_MULT || 1.5) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP1</label><input type="number" id="modalTp1" value="' + (cfg.ATR_TP1_MULT || 2) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP2</label><input type="number" id="modalTp2" value="' + (cfg.ATR_TP2_MULT || 3.5) + '" step="0.1"></div>' +
        '<div class="field"><label>ضریب TP3</label><input type="number" id="modalTp3" value="' + (cfg.ATR_TP3_MULT || 5) + '" step="0.1"></div>' +
        '<div class="field full"><label>استراتژی</label><select id="modalStrategy">' +
        '<option value="scalp"' + (cfg.STRATEGY_MODE !== 'swing' ? ' selected' : '') + '>اسکالپ</option>' +
        '<option value="swing"' + (cfg.STRATEGY_MODE === 'swing' ? ' selected' : '') + '>سوئینگ</option></select></div>' +
        '</div><div class="modal-actions">' +
        '<button type="button" class="btn-main" onclick="GoldAI.saveSettingsModal()">ذخیره</button>' +
        '<button type="button" class="btn-ghost" onclick="GoldAI.closeSettingsModal()">بستن</button>' +
        '</div></div></div>';
      document.body.insertAdjacentHTML('beforeend', html);
    };

    window.GoldAI.closeSettingsModal = function () {
      var m = document.getElementById('settingsModal');
      if (m) m.remove();
    };

    window.GoldAI.saveSettingsModal = function () {
      var g = function (id) { return document.getElementById(id); };
      var capital = parseFloat(g('modalCapital') && g('modalCapital').value) || 10000;
      var risk = parseFloat(g('modalRisk') && g('modalRisk').value) || 1;
      var tpCount = parseInt(g('modalTpCount') && g('modalTpCount').value, 10) || 3;
      var lot = parseFloat(g('modalLot') && g('modalLot').value) || 0;
      var sl = parseFloat(g('modalSl') && g('modalSl').value) || 1.5;
      var tp1 = parseFloat(g('modalTp1') && g('modalTp1').value) || 2;
      var tp2 = parseFloat(g('modalTp2') && g('modalTp2').value) || 3.5;
      var tp3 = parseFloat(g('modalTp3') && g('modalTp3').value) || 5;
      var strategy = (g('modalStrategy') && g('modalStrategy').value) || 'scalp';
      if (window.GoldAI_Data.setCapital) window.GoldAI_Data.setCapital(capital);
      var cfg = window.GoldAI_Config;
      cfg.DEFAULT_RISK_PERCENT = risk; cfg.TP_COUNT = tpCount; cfg.USER_LOT = lot;
      cfg.ATR_SL_MULT = sl; cfg.ATR_TP1_MULT = tp1; cfg.ATR_TP2_MULT = tp2; cfg.ATR_TP3_MULT = tp3;
      cfg.STRATEGY_MODE = strategy;
      try {
        var stored = JSON.parse(localStorage.getItem('goldai_settings') || '{}');
        Object.assign(stored, { capital: capital, risk: risk, tpCount: tpCount, userLot: lot, slMult: sl, tp1Mult: tp1, tp2Mult: tp2, tp3Mult: tp3, strategy: strategy });
        localStorage.setItem('goldai_settings', JSON.stringify(stored));
      } catch (e) {}
      this.updateRiskUI && this.updateRiskUI();
      this.closeSettingsModal();
    };

    if (!window.GoldAI.changeSymbol) {
      window.GoldAI.changeSymbol = async function () {
        var select = document.getElementById('symbolSelect');
        if (!select) return;
        window.GoldAI_Config.SYMBOL = select.value;
        try {
          if (window.GoldAI_Data.resetData) window.GoldAI_Data.resetData();
          if (window.GoldAI_Data.loadEssential) await window.GoldAI_Data.loadEssential();
          else if (window.GoldAI_Data.loadAll) await window.GoldAI_Data.loadAll();
          if (!window.GoldAI_Data.closes.m5.length && window.GoldAI_Data.seedDemo) window.GoldAI_Data.seedDemo();
          await this.fetchPriceFromBackend();
          this.updatePriceUI();
        } catch (e) { console.error(e); }
      };
    }
  }
  ready();
})();
