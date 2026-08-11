// =====================================
// GoldAI Pro — app.js multi-mirror loader
// Real full app is loaded from the last good commit (935617d4)
// =====================================
(function () {
  var urls = [
    "https://cdn.jsdelivr.net/gh/Mohsem66/GoldAI@935617d4bf8d7b79a8d210406792a2c9f1c77d19/js/app.js",
    "https://fastly.jsdelivr.net/gh/Mohsem66/GoldAI@935617d4bf8d7b79a8d210406792a2c9f1c77d19/js/app.js",
    "https://raw.githubusercontent.com/Mohsem66/GoldAI/935617d4bf8d7b79a8d210406792a2c9f1c77d19/js/app.js"
  ];

  function tryLoad(i) {
    if (i >= urls.length) {
      console.error("GoldAI: all mirrors failed");
      alert("خطا در بارگذاری app.js. VPN/اینترنت را چک کن و صفحه را سخت رفرش کن.");
      return;
    }
    var s = document.createElement("script");
    s.src = urls[i] + (urls[i].indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
    s.onload = function () {
      console.log("GoldAI app loaded from:", urls[i]);
    };
    s.onerror = function () {
      console.warn("mirror failed:", urls[i]);
      tryLoad(i + 1);
    };
    document.head.appendChild(s);
  }

  tryLoad(0);
})();
