// =====================================
// GoldAI Pro V2
// Dashboard Controller
// =====================================


window.GoldAI_Dashboard = {


start:function(){

console.log(
"✅ GoldAI Dashboard Started"
);

},



render:function(){


let data = window.GoldAI_V2_Data;


if(!data){

console.log(
"No Dashboard Data"
);

return;

}



// Signal

let signal =
document.getElementById("signal");


if(signal){

signal.innerHTML =
data.signal || "WAIT 🟡";

}



// Confidence

let confidence =
document.getElementById("confidence");


if(confidence){

confidence.innerHTML =
(data.confidence || 0) + "%";

}




// Entry

let entry =
document.getElementById("entry");


if(entry){

entry.innerHTML =
data.entry || "---";

}



// Stop Loss

let sl =
document.getElementById("sl");


if(sl){

sl.innerHTML =
data.stopLoss ||
data.sl ||
"---";

}




// TP1

let tp1 =
document.getElementById("tp1");


if(tp1){

tp1.innerHTML =
data.tp1 ||
data.takeProfit ||
"---";

}



// TP2

let tp2 =
document.getElementById("tp2");


if(tp2){

tp2.innerHTML =
data.tp2 ||
data.takeProfit ||
"---";

}



// TP3

let tp3 =
document.getElementById("tp3");


if(tp3){

tp3.innerHTML =
data.tp3 ||
data.takeProfit ||
"---";

}




// RR

let rr =
document.getElementById("rr");


if(rr){

rr.innerHTML =
data.riskReward ||
data.rr ||
"---";

}




// Risk


let capital =
document.getElementById("capital");


if(capital){

capital.innerHTML =
data.capital ||
localStorage.getItem("capital") ||
"---";

}



let lot =
document.getElementById("lot");


if(lot){

lot.innerHTML =
data.lot ||
"0.01";

}



let risk =
document.getElementById("risk");


if(risk){

risk.innerHTML =
(data.riskPercent || 2)
+
"%";

}





// Details


if(document.getElementById("details-content")){


document.getElementById("details-content").innerHTML = `

<h3>📊 AI Analysis Details</h3>

<p>EMA20:
${data.ema20 || "-"}</p>

<p>EMA50:
${data.ema50 || "-"}</p>

<p>EMA200:
${data.ema200 || "-"}</p>

<p>RSI:
${data.rsi || "-"}</p>

<p>MACD:
${data.macd || "-"}</p>

<p>ATR:
${data.atr || "-"}</p>

<p>Market Structure:
${data.structure || "-"}</p>

<p>Divergence:
${data.divergence || "-"}</p>


<h3>🧠 AI Reason:</h3>

<p>
${data.reason || "Waiting for analysis"}
</p>


<h3>⭐ Score</h3>

<p>
BUY:
${data.buyScore || 0}
</p>


<p>
SELL:
${data.sellScore || 0}
</p>


`;

}



console.log(
"✅ Dashboard Rendered",
data
);


}



};
