// =====================================
// GoldAI Pro — temporary loader: exact pre-break app.js
// Loads the verified good commit so phone users need no ZIP
// =====================================
(function () {
  var src = "https://cdn.jsdelivr.net/gh/Mohsem66/GoldAI@935617d4bf8d7b79a8d210406792a2c9f1c77d19/js/app.js";
  var s = document.createElement("script");
  s.src = src;
  s.onload = function () {
    console.log("GoldAI app.js restored from commit 935617d4");
  };
  s.onerror = function () {
    console.error("Failed to load restored app.js from CDN");
    alert("خطا در بارگذاری app.js — اتصال اینترنت را چک کنید و صفحه را رفرش کنید.");
  };
  document.head.appendChild(s);
})();
