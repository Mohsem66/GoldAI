// =====================================
// GoldAI Pro — RESTORED from c17ed47
// If you still see a short loader, hard-refresh.
// Full file is being restored; temporary bootstrap:
// =====================================
(function(){
  var urls = [
    "https://cdn.jsdelivr.net/gh/Mohsem66/GoldAI@c17ed47518afe61ea2223d526707411b8c09b377/js/app.js",
    "https://fastly.jsdelivr.net/gh/Mohsem66/GoldAI@c17ed47518afe61ea2223d526707411b8c09b377/js/app.js",
    "https://raw.githack.com/Mohsem66/GoldAI/c17ed47518afe61ea2223d526707411b8c09b377/js/app.js",
    "https://raw.githubusercontent.com/Mohsem66/GoldAI/c17ed47518afe61ea2223d526707411b8c09b377/js/app.js"
  ];
  function load(i){
    if(i>=urls.length){
      alert("نمی‌توان app.js را از کامیت c17ed47 بارگذاری کرد. VPN را عوض کن یا خاموش کن و صفحه را سخت رفرش کن.");
      return;
    }
    var s=document.createElement("script");
    s.src=urls[i]+"?t="+Date.now();
    s.onload=function(){ console.log("GoldAI restored from c17ed47 via", urls[i]); };
    s.onerror=function(){ load(i+1); };
    document.head.appendChild(s);
  }
  load(0);
})();
