// =====================================
// GoldAI V1 TO V2 CONNECTOR
// =====================================


window.GoldAI_V1_Connector = {


getOutput:function(){


if(!window.GoldAI_V1_Result){

return null;

}


let v1 = window.GoldAI_V1_Result;



return {


signal:
v1.signal || "WAIT 🟡",


confidence:
v1.confidence || 0,


entry:
v1.entry || 0,


stopLoss:
v1.stopLoss || 0,


takeProfit:
v1.takeProfit || 0,


// TP SYSTEM

tp1:
v1.takeProfit || 0,


tp2:
v1.takeProfit ? 
Number(v1.takeProfit) : 0,


tp3:
v1.takeProfit ?
Number(v1.takeProfit) : 0,



// Risk

capital:
Number(localStorage.getItem("capital") || 0),


lot:
0.01,


riskPercent:
2,



score:
v1.score || 0,


buyScore:
v1.buyScore || 0,


sellScore:
v1.sellScore || 0,


reason:
v1.reason || ""

};


},



update:function(){

console.log(
"✅ V1 Connector Updated"
);


}


};
console.log("CONNECTOR LOADED");
