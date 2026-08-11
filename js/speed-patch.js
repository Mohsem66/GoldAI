// =====================================
// GoldAI — Speed patch (after app.js)
// Live price every 5s + faster data path
// =====================================
(function () {
  function apply() {
    if (!window.GoldAI || !window.GoldAI_Data) return false;

    var G = window.GoldAI;
    var D = window.GoldAI_Data;
    if (G.__speedPatched) return true;
    G.__speedPatched = true;

    // --- Fast init: price first ---
    G.init = async function () {
      this.loadSettings();
      try {
        await D.loadPrice(true);
        this.updatePriceUI();
      } catch (e) {
        console.warn(e);
      }
      this.updateMarketClock();
      this.updateRiskUI();
      this.setupSettingsPanel();

      D.loadEssential()
        .then(function () {
          if (!D.closes.m5.length && !D.closes.h1.length) D.seedDemo();
          G.updatePriceUI();
        })
        .catch(function (e) {
          console.warn(e);
        });

      setInterval(function () {
        G.updateMarketClock();
      }, 1000);

      var ms = (window.GoldAI_Config && window.GoldAI_Config.PRICE_REFRESH_MS) || 5000;
      setInterval(async function () {
        try {
          await D.loadPrice(true);
          G.updatePriceUI();
        } catch (e) {}
      }, ms);

      console.log("GoldAI ready — live price every " + ms + "ms");
    };

    // --- Fast analyze: preload essential, skip duplicate network in original ---
    var origAnalyze = G.analyze.bind(G);
    G.analyze = async function () {
      var savedAll = D.loadAll.bind(D);
      var savedPrice = D.loadPrice.bind(D);

      try {
        await D.loadPrice(true);
        this.updatePriceUI();
        await D.loadEssential();
        if (!D.closes.m5.length && !D.closes.h1.length) D.seedDemo();
        this.updatePriceUI();

        // Original analyze calls loadAll/loadPrice again — make them instant
        D.loadAll = async function () {
          return D;
        };
        D.loadPrice = async function () {
          return D.goldPrice;
        };

        await origAnalyze();
      } finally {
        D.loadAll = savedAll;
        D.loadPrice = savedPrice;
      }
    };

    // Fix changeSymbol always forcing demo
    var origSym = G.changeSymbol.bind(G);
    G.changeSymbol = async function () {
      var select = document.getElementById("symbolSelect");
      if (!select) return;
      var newSymbol = select.value;
      window.GoldAI_Config.SYMBOL = newSymbol;
      try {
        var stored = JSON.parse(localStorage.getItem("goldai_settings") || "{}");
        stored.symbol = newSymbol;
        localStorage.setItem("goldai_settings", JSON.stringify(stored));
      } catch (e) {}

      var status = document.getElementById("aiStatus");
      if (status) status.textContent = "\ud83d\udfe1 Resetting data...";

      D.resetData();
      D.cache = {};
      D.lastFetchTime = {};
      await D.loadPrice(true);
      this.updatePriceUI();
      await D.loadEssential();
      if (!D.closes.m5.length && !D.closes.h1.length) D.seedDemo();
      await D.loadPrice(true);
      this.updatePriceUI();

      if (status) status.textContent = "\ud83d\udfe2 Ready";
      var rc = document.getElementById("resultCard");
      if (rc) rc.classList.add("hidden");
      var manualInput = document.getElementById("manualEntryInput");
      if (manualInput) manualInput.value = "";
    };

    return true;
  }

  // app.js registers DOMContentLoaded -> init. Patch before that fires if possible.
  if (apply()) {
    // If document already loaded, app may have already inited with old init;
    // re-run price tick only
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply();
  });

  // Late safety
  setTimeout(apply, 0);
  setTimeout(apply, 50);
})();
