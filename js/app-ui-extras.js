// =====================================
// GoldAI — UI extras (settings, clocks, share, TP visibility)
// Restores features removed by mistake; does not change signal logic
// =====================================

(function () {
  function whenReady(fn) {
    if (window.GoldAI && window.GoldAI.render) return fn();
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(fn, 50);
    });
  }

  whenReady(function () {
    var G = window.GoldAI;
    if (!G) return;

    G.setupSettingsPanel = function () {
      var settingsBtn = document.querySelector('[onclick="GoldAI.openSettings()"]') ||
        document.querySelector('[data-action="settings"]');
      if (!settingsBtn) {
        var newBtn = document.createElement("button");
        newBtn.className = "btn-ghost";
        newBtn.textContent = "⚙️ تنظیمات";
        newBtn.onclick = function () { G.openSettings(); };
        var riskCard = document.querySelector(".card");
        if (riskCard) riskCard.appendChild(newBtn);
      }
    };

    G.openSettings = function () {
      var cfg = window.GoldAI_Config;
      var html = `
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
              <option value="1" ${cfg.TP_COUNT === 1 ? "selected" : ""}>۱ حد سود</option>
              <option value="2" ${cfg.TP_COUNT === 2 ? "selected" : ""}>۲ حد سود</option>
              <option value="3" ${cfg.TP_COUNT === 3 ? "selected" : ""}>۳ حد سود</option>
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
            <input type="text" id="settingUID" value="${G.currentUID || ""}" placeholder="برای sync بین دستگاه‌ها">
          </div>
          <div class="settings-actions">
            <button class="btn-main" style="margin: 0;" onclick="GoldAI.saveSettings()">✅ ذخیره</button>
            <button class="btn-ghost" style="margin: 0;" onclick="GoldAI.closeSettings()">❌ بستن</button>
          </div>
        </div>
      </div>
      <style>
        .settings-group { margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; }
        .settings-group label { text-align: right; font-size: 13px; color: #aaa; }
        .settings-group input, .settings-group select {
          padding: 10px; background: #0f0f1e; border: 1px solid #444; border-radius: 6px;
          color: #fff; text-align: right; font-family: monospace;
        }
        .settings-actions { display: flex; gap: 10px; margin-top: 18px; }
        .settings-actions button { flex: 1; }
      </style>`;
      document.body.insertAdjacentHTML("beforeend", html);
    };

    G.saveSettings = function () {
      var capital = Number(document.getElementById("settingCapital").value);
      var risk = Number(document.getElementById("settingRisk").value);
      var tpCount = Number(document.getElementById("settingTpCount").value);
      var slMult = Number(document.getElementById("settingSlMult").value);
      var tp1Mult = Number(document.getElementById("settingTp1Mult").value);
      var tp2Mult = Number(document.getElementById("settingTp2Mult").value);
      var tp3Mult = Number(document.getElementById("settingTp3Mult").value);
      var uid = document.getElementById("settingUID").value;

      if (capital > 0) window.GoldAI_Data.setCapital(capital);
      window.GoldAI_Config.DEFAULT_RISK_PERCENT = risk;
      window.GoldAI_Config.TP_COUNT = tpCount;
      window.GoldAI_Config.ATR_SL_MULT = slMult;
      window.GoldAI_Config.ATR_TP1_MULT = tp1Mult;
      window.GoldAI_Config.ATR_TP2_MULT = tp2Mult;
      window.GoldAI_Config.ATR_TP3_MULT = tp3Mult;
      G.currentUID = uid;

      var tpCountEl = document.getElementById("tpCountSelect");
      if (tpCountEl) tpCountEl.value = tpCount;

      localStorage.setItem("goldai_settings", JSON.stringify({
        capital: capital, risk: risk, tpCount: tpCount, slMult: slMult,
        tp1Mult: tp1Mult, tp2Mult: tp2Mult, tp3Mult: tp3Mult, uid: uid,
        strategy: window.GoldAI_Config.STRATEGY_MODE,
        symbol: window.GoldAI_Config.SYMBOL
      }));
      G.updateRiskUI();
      G.closeSettings();
      alert("✅ تنظیمات با موفقیت ذخیره شدند");
    };

    G.closeSettings = function () {
      var m = document.getElementById("settingsModal");
      if (m) m.remove();
    };

    G.formatDuration = function (ms) {
      var secs = Math.floor(ms / 1000);
      var mins = Math.floor(secs / 60);
      var hours = Math.floor(mins / 60);
      var days = Math.floor(hours / 24);
      secs %= 60; mins %= 60; hours %= 24;
      var parts = [];
      if (days > 0) parts.push(days + " روز");
      if (hours > 0) parts.push(hours + " ساعت");
      if (mins > 0) parts.push(mins + " دقیقه");
      if (secs > 0) parts.push(secs + " ثانیه");
      return parts.join(" و ");
    };

    G.createCountdownDisplay = function () {
      var marketCard = document.querySelector("#panel-home .card");
      if (!marketCard) return null;
      var el = document.getElementById("countdownDisplay");
      if (!el) {
        el = document.createElement("div");
        el.id = "countdownDisplay";
        el.style.cssText = "text-align: center; font-size: 13px; font-weight: bold; color: #f5c542; margin-top: 10px; background: #0b0f14; padding: 6px; border-radius: 8px;";
        marketCard.appendChild(el);
      }
      return el;
    };

    G.createTimeDisplay = function () {
      var header = document.querySelector(".header");
      if (!header) return null;
      var existing = document.getElementById("timeDisplay");
      if (existing) return existing;
      var timeEl = document.createElement("p");
      timeEl.id = "timeDisplay";
      timeEl.style.cssText = "margin: 10px 0; font-size: 14px; color: #aaa; font-family: monospace;";
      header.appendChild(timeEl);
      return timeEl;
    };

    var _origClock = G.updateMarketClock;
    G.updateMarketClock = function () {
      if (typeof _origClock === "function") _origClock.call(G);
      var now = new Date();
      var day = now.getUTCDay();
      var hour = now.getUTCHours();
      var open = true;
      if (day === 6) open = false;
      if (day === 0 && hour < 22) open = false;
      if (day === 5 && hour >= 22) open = false;

      var countdownText = "";
      if (open) {
        var closeTarget = new Date(now);
        var daysToFriday = (5 - day + 7) % 7;
        closeTarget.setUTCDate(now.getUTCDate() + daysToFriday);
        closeTarget.setUTCHours(22, 0, 0, 0);
        var diff = closeTarget - now;
        if (diff < 0) open = false;
        else countdownText = G.formatDuration(diff) + " تا بسته شدن بازار";
      }
      if (!open) {
        var openTarget = new Date(now);
        var daysToSunday = (0 - day + 7) % 7;
        if (daysToSunday === 0 && hour >= 22) daysToSunday = 7;
        openTarget.setUTCDate(now.getUTCDate() + daysToSunday);
        openTarget.setUTCHours(22, 0, 0, 0);
        countdownText = G.formatDuration(openTarget - now) + " تا باز شدن بازار";
      }

      var countdownEl = document.getElementById("countdownDisplay") || G.createCountdownDisplay();
      if (countdownEl) countdownEl.textContent = countdownText;

      var timeDisplay = document.getElementById("timeDisplay") || G.createTimeDisplay();
      if (timeDisplay) {
        try {
          var zones = [
            { name: "تهران", tz: "Asia/Tehran" },
            { name: "لندن", tz: "Europe/London" },
            { name: "نیویورک", tz: "America/New_York" },
            { name: "توکیو", tz: "Asia/Tokyo" }
          ];
          var clocksHTML = zones.map(function (z) {
            var opt = { timeZone: z.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
            var formatted = new Intl.DateTimeFormat("fa-IR", opt).format(now);
            return '<div style="text-align: center;"><span style="color: #aaa; font-size: 11px;">' + z.name + '</span><br><b style="color: #fff; font-size: 13px;">' + formatted + "</b></div>";
          }).join('<div style="width: 1px; background: #263241; height: 20px;"></div>');
          var dateOpt = { timeZone: "Asia/Tehran", weekday: "long", year: "numeric", month: "long", day: "numeric" };
          var persianDate = new Intl.DateTimeFormat("fa-IR", dateOpt).format(now);
          timeDisplay.innerHTML =
            '<div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #f5c542;">' + persianDate + "</div>" +
            '<div style="display: flex; justify-content: space-around; align-items: center; background: #0c1017; padding: 8px; border-radius: 12px; border: 1px solid #1a222c;">' +
            clocksHTML + "</div>";
        } catch (e) {
          console.error("CLOCK ERROR:", e);
        }
      }
    };

    var _origRender = G.render;
    G.render = function (r) {
      _origRender.call(G, r);
      var tpCount = window.GoldAI_Config.TP_COUNT || 3;
      var tp2El = document.getElementById("tp2");
      var tp3El = document.getElementById("tp3");
      if (tp2El) {
        var p2 = tp2El.closest(".pill") || tp2El.parentElement;
        if (p2) {
          if (tpCount >= 2) p2.classList.remove("hidden");
          else p2.classList.add("hidden");
        }
      }
      if (tp3El) {
        var p3 = tp3El.closest(".row") || tp3El.closest(".pill") || tp3El.parentElement;
        if (p3) {
          if (tpCount >= 3) p3.classList.remove("hidden");
          else p3.classList.add("hidden");
        }
      }
    };

    G.changeTpCount = function () {
      var select = document.getElementById("tpCountSelect");
      if (select) {
        var val = Number(select.value);
        window.GoldAI_Config.TP_COUNT = val;
        var stored = JSON.parse(localStorage.getItem("goldai_settings") || "{}");
        stored.tpCount = val;
        localStorage.setItem("goldai_settings", JSON.stringify(stored));
        G.updateRiskUI();
      }
    };

    G.changeStrategy = function () {
      var select = document.getElementById("strategySelect");
      if (select) {
        window.GoldAI_Config.STRATEGY_MODE = select.value;
        var stored = JSON.parse(localStorage.getItem("goldai_settings") || "{}");
        stored.strategy = select.value;
        localStorage.setItem("goldai_settings", JSON.stringify(stored));
      }
    };

    G.shareSignal = function () {
      var r = G.lastResult;
      if (!r) return alert("ابتدا تحلیل را شروع کنید");
      var decs = G.getDecimals();
      var fmt = function (n) {
        if (n == null || isNaN(n) || typeof n === "string") return n;
        return Number(n).toFixed(decs);
      };
      var tpCount = window.GoldAI_Config.TP_COUNT || 3;
      var tpsText = "TP1: " + fmt(r.tp1);
      if (tpCount >= 2) tpsText += " | TP2: " + fmt(r.tp2);
      if (tpCount >= 3) tpsText += " | TP3: " + fmt(r.tp3);
      var text =
        "🥇 سیگنال " + (window.GoldAI_Config.SYMBOL || "XAU/USD") + " GoldAI\n" +
        r.signal + " | اطمینان: " + r.confidence + "%\n" +
        "نقطه ورود: " + fmt(r.entry) + "\n" +
        "حد ضرر (SL): " + fmt(r.stopLoss) + "\n" +
        "حد سودها: " + tpsText + "\n" +
        "نسبت ریسک به ریوارد: " + r.riskReward + " | لات: " + r.lot;

      var platforms = {
        telegram: "https://t.me/share/url?url=&text=" + encodeURIComponent(text),
        whatsapp: "https://wa.me/?text=" + encodeURIComponent(text),
        twitter: "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text)
      };
      document.getElementById("shareModal") && document.getElementById("shareModal").remove();
      var html =
        '<div id="shareModal" class="modal"><div class="modal-content">' +
        "<h3>📤 اشتراک‌گذاری سیگنال</h3>" +
        '<button class="btn-main" onclick="window.open(\'' + platforms.telegram + "\','_blank')">تلگرام</button>" +
        '<button class="btn-main" onclick="window.open(\'' + platforms.whatsapp + "\','_blank')">واتساپ</button>" +
        '<button class="btn-ghost" onclick="document.getElementById(\'shareModal\').remove()">بستن</button>' +
        "</div></div>";
      document.body.insertAdjacentHTML("beforeend", html);
    };

    try { G.setupSettingsPanel(); } catch (e) {}
    try { G.updateMarketClock(); } catch (e) {}
    console.log("GoldAI UI extras loaded");
  });
})();
