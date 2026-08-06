// GoldAI Pro V2 Dashboard Module

const GoldAI_Dashboard = {

render:function(){

const dashboard=document.getElementById("goldai-v2-dashboard");

if(!dashboard){
return;
}

},

setSignal:function(signal){

const signalBox=document.getElementById("signal");

if(!signalBox){
return;
}

signalBox.className="";

if(signal==="BUY"){

signalBox.innerHTML="BUY 🟢";
signalBox.classList.add("buy");

}

else if(signal==="SELL"){

signalBox.innerHTML="SELL 🔴";
signalBox.classList.add("sell");

}

else{

signalBox.innerHTML="WAIT 🟡";
signalBox.classList.add("wait");

}

},

setConfidence:function(value){

const box=document.getElementById("confidence");

if(box){

box.innerHTML=value+"%";

}

},

setTrade:function(data){

if(!data){
return;
}

let entry=document.getElementById("entry");
let sl=document.getElementById("sl");
let tp1=document.getElementById("tp1");
let tp2=document.getElementById("tp2");
let tp3=document.getElementById("tp3");
let rr=document.getElementById("rr");

if(entry) entry.innerHTML=data.entry ?? "---";
if(sl) sl.innerHTML=data.sl ?? "---";
if(tp1) tp1.innerHTML=data.tp1 ?? "---";
if(tp2) tp2.innerHTML=data.tp2 ?? "---";
if(tp3) tp3.innerHTML=data.tp3 ?? "---";
if(rr) rr.innerHTML=data.rr ?? "---";

},

setRisk:function(data){

if(!data){
return;
}

let capital=document.getElementById("capital");
let lot=document.getElementById("lot");
let risk=document.getElementById("risk");

if(capital)
capital.innerHTML=data.capital ?? "---";

if(lot)
lot.innerHTML=data.lot ?? "---";

if(risk)
risk.innerHTML=data.risk+"%" ?? "---";

},

update:function(result){

if(!result){
return;
}

this.setSignal(result.signal || "WAIT");

this.setConfidence(result.confidence || 0);

this.setTrade({

entry:result.entry,

sl:result.stopLoss,

tp1:result.tp1,

tp2:result.tp2,

tp3:result.tp3,

rr:result.riskReward

});

}

};


window.GoldAI_Dashboard=GoldAI_Dashboard;


document.addEventListener("DOMContentLoaded",function(){

GoldAI_Dashboard.render();

});
