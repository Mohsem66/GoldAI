// GoldAI — Share modal (copy + Signal Swift + messengers)
(function () {
  function ready() {
    if (!window.GoldAI) return setTimeout(ready, 40);
    var G = window.GoldAI;

    G.buildShareTexts = function (r) {
      if (!r) return null;
      var decs = 2;
      try { if (this.getDecimals) decs = this.getDecimals(); } catch (e) {}
      var fmt = function (n) {
        if (n == null || isNaN(n)) return null;
        return Number(n).toFixed(decs);
      };
      var rawSym = ((window.GoldAI_Config && window.GoldAI_Config.SYMBOL) || "XAU/USD").toUpperCase();
      var symbol = rawSym.replace("/", "").replace("GOLD", "XAUUSD");
      var sig = String(r.signal || "").toUpperCase();
      var side = sig.indexOf("SELL") >= 0 ? "SELL" : sig.indexOf("BUY") >= 0 ? "BUY" : null;
      if (!side) return null;
      var lines = [];
      var entry = fmt(r.entry);
      lines.push(entry ? side + " " + symbol + " @ " + entry : side + " " + symbol);
      if (fmt(r.stopLoss)) lines.push("SL: " + fmt(r.stopLoss));
      if (fmt(r.tp1)) lines.push("TP1: " + fmt(r.tp1));
      var tpCount = (window.GoldAI_Config && window.GoldAI_Config.TP_COUNT) || 3;
      if (tpCount >= 2 && fmt(r.tp2)) lines.push("TP2: " + fmt(r.tp2));
      if (tpCount >= 3 && fmt(r.tp3)) lines.push("TP3: " + fmt(r.tp3));
      var swift = lines.join("\n");
      var full = "🥇 GoldAI Signal\n" + swift +
        "\nLot: " + (r.lot != null ? r.lot : "—") +
        " | RR: " + (r.riskReward != null ? r.riskReward : "—") +
        " | Conf: " + (r.confidence != null ? r.confidence : 0) + "%";
      return { swift: swift, full: full };
    };

    G.shareSignal = function () {
      var r = this.lastResult;
      if (!r) return alert("ابتدا تحلیل کنید");
      if (r.signal && String(r.signal).indexOf("WAIT") >= 0) {
        return alert("سیگنال WAIT است — چیزی برای اشتراک نیست");
      }
      var texts = this.buildShareTexts(r);
      if (!texts) return alert("سیگنال قابل اشتراک نیست");

      window._goldaiSwiftClipboard = texts.swift;
      window._goldaiFullClipboard = texts.full;

      var enc = encodeURIComponent(texts.full);
      var links = {
        telegram: "https://t.me/share/url?url=&text=" + enc,
        whatsapp: "https://wa.me/?text=" + enc,
        instagram: "https://www.instagram.com/",
        rubika: "https://rubika.ir/",
        bale: "https://ble.ir/",
        eitaa: "https://eitaa.com/"
      };

      var old = document.getElementById("shareModal");
      if (old) old.remove();

      var html =
        '<div id="shareModal" class="modal-backdrop" onclick="if(event.target.id===\'shareModal\')this.remove()">' +
        '<div class="modal-sheet" onclick="event.stopPropagation()" style="max-width:400px">' +
        '<div class="modal-head"><h3>📤 اشتراک سیگنال</h3>' +
        '<button type="button" class="btn-icon" onclick="document.getElementById(\'shareModal\').remove()">✕</button></div>' +
        '<div class="share-preview" id="sharePreviewBox"></div>' +
        '<div class="share-grid">' +
        '<button type="button" onclick="navigator.clipboard.writeText(window._goldaiFullClipboard||\'\' ).then(function(){alert(\'✅ کپی شد\')})">📋 کپی</button>' +
        '<button type="button" onclick="navigator.clipboard.writeText(window._goldaiSwiftClipboard||\'\' ).then(function(){alert(\'✅ برای Signal Swift کپی شد\')})">⚡ Signal Swift</button>' +
        '<button type="button" onclick="window.open(\'' + links.telegram + '\',\'_blank\')">✈️ تلگرام</button>' +
        '<button type="button" onclick="window.open(\'' + links.whatsapp + '\',\'_blank\')">💬 واتساپ</button>' +
        '<button type="button" onclick="navigator.clipboard.writeText(window._goldaiFullClipboard||\'\' ).then(function(){alert(\'✅ کپی شد — در اینستاگرام پیست کنید\');window.open(\'' + links.instagram + '\',\'_blank\')})">📸 اینستاگرام</button>' +
        '<button type="button" onclick="navigator.clipboard.writeText(window._goldaiFullClipboard||\'\' ).then(function(){alert(\'✅ کپی شد — در روبیکا پیست کنید\');window.open(\'' + links.rubika + '\',\'_blank\')})">🟣 روبیکا</button>' +
        '<button type="button" onclick="navigator.clipboard.writeText(window._goldaiFullClipboard||\'\' ).then(function(){alert(\'✅ کپی شد — در بله پیست کنید\');window.open(\'' + links.bale + '\',\'_blank\')})">🔵 بله</button>' +
        '<button type="button" onclick="navigator.clipboard.writeText(window._goldaiFullClipboard||\'\' ).then(function(){alert(\'✅ کپی شد — در ایتا پیست کنید\');window.open(\'' + links.eitaa + '\',\'_blank\')})">🟢 ایتا</button>' +
        '</div>' +
        '<button type="button" class="btn-ghost" style="width:100%;margin-top:12px" onclick="document.getElementById(\'shareModal\').remove()">بستن</button>' +
        '</div></div>';

      // fix empty string escape artifacts from template
      html = html.replace(/\|\\' \)/g, "|'').").replace(/\\'\' \)/g, "'').");

      document.body.insertAdjacentHTML("beforeend", html);
      var pre = document.getElementById("sharePreviewBox");
      if (pre) pre.textContent = texts.swift;
    };
  }
  ready();
})();
