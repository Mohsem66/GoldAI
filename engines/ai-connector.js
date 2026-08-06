// =====================================
// GoldAI Pro V2
// AI Connector
// =====================================


window.GoldAI_Connector = {


analyze:function(){



let marketData={


priceHistory:
window.priceHistory || [],


rsiHistory:
window.rsiHistory || [],


goldPrice:
window.goldPrice || 0,


ema20:
window.ema20 || null,


ema50:
window.ema50 || null,


ema200:
window.ema200 || null


};



let rsi=null;
let divergence=null;
let score=null;
let structure=null;
let atr=null;
let trade=null;
let conflict=null;



// RSI

try{

if(
window.GoldAI_RSI_V2 &&
typeof window.GoldAI_RSI_V2.analyzeRSIEngine==="function"
){

rsi =
window.GoldAI_RSI_V2.analyzeRSIEngine(marketData);

}

}catch(e){}



// Divergence

try{

if(typeof analyzeRSIDivergence==="function"){

divergence =
analyzeRSIDivergence(marketData);

}

}catch(e){}



// Score

try{

if(
window.GoldAI_ScoreEngine &&
typeof window.GoldAI_ScoreEngine==="function"
){

score =
window.GoldAI_ScoreEngine(marketData);

}

}catch(e){}



// Market Structure

try{

if(
window.GoldAI_MarketStructure_V1
){

structure =
window.GoldAI_MarketStructure_V1.analyze(marketData);

}

}catch(e){}



// ATR

try{

if(
window.GoldAI_ATR_Engine_V1
){

atr =
window.GoldAI_ATR_Engine_V1.GoldAI_ATR_Analyze(marketData);

}

}catch(e){}



// Trade Management

try{

if(
window.GoldAI_Trade_Management_V1
){

trade =
window.GoldAI_Trade_Management_V1.createTradePlan(marketData);

}

}catch(e){}



// Conflict Filter

try{

if(
window.GoldAI_Conflict_Filter_V1
){

conflict =
window.GoldAI_Conflict_Filter_V1.runConflictFilter(marketData);

}

}catch(e){}



return{


signal:

score?.signal ||
trade?.signal ||
"WAIT",



confidence:

score?.confidence ||
50,



entry:

trade?.entry ||
marketData.goldPrice,



stopLoss:

trade?.stopLoss ||
0,



tp1:

trade?.tp1 ||
0,


tp2:

trade?.tp2 ||
0,


tp3:

trade?.tp3 ||
0,



riskReward:

trade?.riskReward ||
"1:2",



aiScore:

score?.score ||
0,



reason:

"RSI + Score + Market Structure + ATR + Risk Management",



details:{


rsi,

divergence,

structure,

atr,

conflict


}


};



}


};
