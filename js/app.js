// GoldAI — restore full orchestrator (settings, clocks, share, TP)
(function () {
  var b = "";
  for (var i = 0; i < 4; i++) b += (window["__GA_APP_B64_" + i] || "");
  if (!b) { console.error("GoldAI: missing app parts"); return; }
  try {
    var code = atob(b);
    var el = document.createElement("script");
    el.text = code;
    document.head.appendChild(el);
  } catch (e) {
    console.error("GoldAI: failed to restore app", e);
  }
})();
