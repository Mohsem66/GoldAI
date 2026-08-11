// =====================================
// GoldAI — Speed patch (price + analyze)
// Does not change UI layout — only load order/timing
// =====================================
(function () {
  function patch() {
    if (!window.GoldAI || !window.GoldAI_Data) {
      setTimeout(patch, 30);
      return;
    }

    var G = window.GoldAI;
    var D = window.GoldAI_Data;

    // Faster init: show live price immediately, candles in background
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

      D.loadEssential().then(function () {
        if (!D.closes.m5.length && !D.closes.h1.length) D.seedDemo();
        G.updatePriceUI();
      }).catch(function (e) { console.warn(e); });

      setInterval(function () { G.updateMarketClock(); }, 1000);

      // Online price every 5 seconds
      var refreshMs = (window.GoldAI_Config && window.GoldAI_Config.PRICE_REFRESH_MS) || 5000;
      setInterval(async function () {
        await D.loadPrice(true);
        G.updatePriceUI();
      }, refreshMs);

      console.log("\u2705 GoldAI Pro ready (fast price mode)");
    };

    // Faster analyze: price + essential TFs only (cache-aware)
    var origAnalyze = G.analyze.bind(G);
    G.analyze = async function () {
      var btn = document.getElementById("analyzeBtn");
      var status = document.getElementById("aiStatus");
      if (btn) btn.disabled = true;
      if (status) status.textContent = "\ud83d\udfe1 Analyzing...";

      try {
        await D.loadPrice(true);
        this.updatePriceUI();
        await D.loadEssential();
        if (!D.closes.m5.length && !D.closes.h1.length) D.seedDemo();
        this.updatePriceUI();

        // Reuse original engine pipeline by temporarily no-op heavy reloads
        var savedLoadAll = D.loadAll;
        var savedLoadPrice = D.loadPrice;
        D.loadAll = async function () { return D; };
        D.loadPrice = async function () { return D.goldPrice; };
        try {
          // Call original analyze body via copying logic is hard;
          // instead restore and call original after data is ready
        } finally {
          D.loadAll = savedLoadAll;
          D.loadPrice = savedLoadPrice;
        }

        // Original analyze will call loadAll/loadPrice again — make them no-op for this run
        D.loadAll = async function () { return D; };
        D.loadPrice = async function () { return D.goldPrice; };
        await origAnalyze();
        D.loadAll = savedLoadAll;
        D.loadPrice = savedLoadPrice;
      } catch (e) {
        console.error(e);
        if (status) status.textContent = "\ud83d\udd34 Error";
        if (btn) btn.disabled = false;
        throw e;
      }
    };

    // Prevent double DOMContentLoaded init race: if already inited, skip
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // Run before app's init if possible; app also binds DOMContentLoaded
      patch();
    });
  } else {
    patch();
  }
  // Also patch immediately in case app.js already defined GoldAI
  patch();
})();
