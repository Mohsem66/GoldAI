// GoldAI UI extras — settings modal, manual price, live refresh
(function () {
  function ready() {
    if (!window.GoldAI) return setTimeout(ready, 50);

    window.GoldAI.applyManualPrice = function () {
      const el = document.getElementById("manualEntryInput");
      if (!el) return;
      const v = Number(el.value);
      if (!v || isNaN(v) || v <= 0) return alert("یک قیمت معتبر وارد کنید");
      window.GoldAI_Data.goldPrice = v;
      window.GoldAI_Data.manualPriceLock = true;
      this.updatePriceUI();
      alert("✅ قیمت دستی اعمال شد: " + v);
    };

    window.GoldAI.refreshPrice = async function () {
      window.GoldAI_Data.manualPriceLock = false;
      const el = document.getElementById("manualEntryInput");
      if (el) el.value = "";
      const price = await this.fetchPriceFromBackend();
      this.updatePriceUI();
      if (price > 0 && window.GoldAI_Data.livePriceOk) {
        alert("✅ قیمت آنلاین: " + price);
      } else {
        alert("⚠️ قیمت آنلاین در دسترس نیست.\nبک‌اند را روشن کنید یا قیمت دستی بدهید.\n" + this.backendURL);
      }
    };

    const _fetch = window.GoldAI.fetchPriceFromBackend.bind(window.GoldAI);
    window.GoldAI.fetchPriceFromBackend = async function () {
      if (window.GoldAI_Data.manualPriceLock && window.GoldAI_Data.goldPrice > 0) {
        return window.GoldAI_Data.goldPrice;
      }
      const p = await _fetch();
      if (p > 0) {
        window.GoldAI_Data.livePriceOk = true;
        if (window.GoldAI_Data.dataMode === "demo") window.GoldAI_Data.dataMode = "mixed";
      }
      return p;
    };

    window.GoldAI.openSettingsModal = function () {
      const cfg = window.GoldAI_Config;
      const cap = window.GoldAI_Data.getCapital();
      document.getElementById("settingsModal")?.remove();
      const html = `
      <div id="settingsModal" class="modal-backdrop" onclick="if(event.target.id==='settingsModal')GoldAI.closeSettingsModal()">
        <div class="modal-sheet" onclick="event.stopPropagation()">
          <h3>⚙️ تنظیمات <button class="btn-icon" onclick="GoldAI.closeSettingsModal()">✕</button></h3>
          <div class="settings-modal-grid">
            <div><label>سرمایه ($)</label><input type="number" id="modalCapital" value="${cap}" min="100" /></div>
            <div><label>ریسک (%)</label><input type="number" id="modalRisk" value="${cfg.DEFAULT_RISK_PERCENT || 1}" min="0.1" max="10" step="0.1" /></div>
            <div><label>تعداد TP</label><select id="modalTpCount">
              <option value="1"${cfg.TP_COUNT==1?" selected":""}>۱</option>
              <option value="2"${cfg.TP_COUNT==2?" selected":""}>۲</option>
              <option value="3"${(cfg.TP_COUNT||3)==3?" selected":""}>۳</option>
            </select></div>
            <div><label>لات دستی (۰=خودکار)</label><input type="number" id="modalLot" value="${cfg.USER_LOT || 0}" step="0.01" min="0" max="50" /></div>
            <div><label>ضریب SL</label><input type="number" id="modalSl" value="${cfg.ATR_SL_MULT || 1.5}" step="0.1" /></div>
            <div><label>ضریب TP1</label><input type="number" id="modalTp1" value="${cfg.ATR_TP1_MULT || 2}" step="0.1" /></div>
            <div><label>ضریب TP2</label><input type="number" id="modalTp2" value="${cfg.ATR_TP2_MULT || 3.5}" step="0.1" /></div>
            <div><label>ضریب TP3</label><input type="number" id="modalTp3" value="${cfg.ATR_TP3_MULT || 5}" step="0.1" /></div>
            <div class="full"><label>استراتژی</label><select id="modalStrategy">
              <option value="scalp"${cfg.STRATEGY_MODE!=="swing"?" selected":""}>اسکالپ</option>
              <option value="swing"${cfg.STRATEGY_MODE==="swing"?" selected":""}>سوئینگ</option>
            </select></div>
          </div>
          <div class="modal-actions">
            <button class="btn-main" onclick="GoldAI.saveSettingsModal()">✅ ذخیره</button>
            <button class="btn-ghost" onclick="GoldAI.closeSettingsModal()">بستن</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML("beforeend", html);
    };

    window.GoldAI.closeSettingsModal = function () {
      document.getElementById("settingsModal")?.remove();
    };

    window.GoldAI.saveSettingsModal = function () {
      const g = (id) => document.getElementById(id);
      const capital = parseFloat(g("modalCapital")?.value) || 10000;
      const risk = parseFloat(g("modalRisk")?.value) || 1;
      const tpCount = parseInt(g("modalTpCount")?.value) || 3;
      const lot = parseFloat(g("modalLot")?.value) || 0;
      const sl = parseFloat(g("modalSl")?.value) || 1.5;
      const tp1 = parseFloat(g("modalTp1")?.value) || 2;
      const tp2 = parseFloat(g("modalTp2")?.value) || 3.5;
      const tp3 = parseFloat(g("modalTp3")?.value) || 5;
      const strategy = g("modalStrategy")?.value || "scalp";

      window.GoldAI_Data.setCapital(capital);
      const cfg = window.GoldAI_Config;
      cfg.DEFAULT_RISK_PERCENT = risk;
      cfg.TP_COUNT = tpCount;
      cfg.USER_LOT = lot;
      cfg.ATR_SL_MULT = sl;
      cfg.ATR_TP1_MULT = tp1;
      cfg.ATR_TP2_MULT = tp2;
      cfg.ATR_TP3_MULT = tp3;
      cfg.STRATEGY_MODE = strategy;

      const sync = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      sync("advCapital", capital); sync("advRisk", risk); sync("userTpCount", tpCount);
      sync("userLot", lot); sync("userSlMult", sl); sync("userTp1Mult", tp1);
      sync("userTp2Mult", tp2); sync("userTp3Mult", tp3); sync("strategySelect", strategy);

      const stored = JSON.parse(localStorage.getItem("goldai_settings") || "{}");
      Object.assign(stored, { capital, risk, tpCount, userLot: lot, slMult: sl, tp1Mult: tp1, tp2Mult: tp2, tp3Mult: tp3, strategy });
      localStorage.setItem("goldai_settings", JSON.stringify(stored));
      this.updateRiskUI();
      this.closeSettingsModal();
      alert("✅ تنظیمات ذخیره شد");
    };
  }
  ready();
})();
