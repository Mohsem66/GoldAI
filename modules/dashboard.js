// =====================================
// GoldAI Pro V2
// Dashboard Controller
// =====================================


window.GoldAI_Dashboard = {



render:function(){


let data = window.GoldAI_V2_Data;


if(!data){

console.log("No V2 Data");

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
data.stopLoss || "---";

}


// TP1

let tp1 =
document.getElementById("tp1");


if(tp1){

tp1.innerHTML =
data.takeProfit || "---";

}


// TP2

let tp2 =
document.getElementById("tp2");


if(tp2){

tp2.innerHTML =
data.tp2 || "---";

}


// TP3

let tp3 =
document.getElementById("tp3");


if(tp3){

tp3.innerHTML =
data.tp3 || "---";

}


// RR

let rr =
document.getElementById("rr");


if(rr){

rr.innerHTML =
data.riskReward || "---";

}


// Risk

let capital =
document.getElementById("capital");


if(capital){

capital.innerHTML =
data.capital || "---";

}


let lot =
document.getElementById("lot");


if(lot){

lot.innerHTML =
data.lot || "---";

}



let risk =
document.getElementById("risk");


if(risk){

risk.innerHTML =
data.riskPercent ?
data.riskPercent+"%" :
"---";

}


// Details

if(window.GoldAI_Details){


GoldAI_Details.update({

ema20:data.ema20 || "-",

ema50:data.ema50 || "-",

rsi:data.rsi || "-",

atr:data.atr || "-",

reason:data.reason || "Waiting"

});


}



},



start:function(){


console.log(
"✅ GoldAI Dashboard Started"
);


}




};
