// =====================================
// GoldAI Pro V2
// AI Connector V2 Fixed
// =====================================
alert("AI CONNECTOR FILE LOADED");
window.GoldAI_Connector = {


analyze:function(){


let marketData = {

priceHistory:
window.priceHistory || [],

rsiHistory:
window.rsiHistory || [],

goldPrice:
Number(window.goldPrice || 0),

ema20:
window.ema20 || null,

ema50:
window.ema50 || null,

ema200:
window.ema200 || null,

candles:
window.candles || [],

timeframe:
window.timeframe || "M5"

};



let rsi = null;
let divergence = null;
let score = null;
let structure = null;
let atr = null;
let trade = null;
let conflict = null;



let rsiValue = null;
let atrValue = null;
let structureTrend = null;



// =====================
// RSI
// =====================

try{

if(
window.GoldAI_RSI_V2 &&
typeof window.GoldAI_RSI_V2.analyzeRSIEngine === "function"
){

rsi =
window.GoldAI_RSI_V2.analyzeRSIEngine(marketData);


rsiValue =
rsi?.value ??
rsi?.rsiValue ??
rsi?.rsi ??
null;

}

}catch(e){

console.log("RSI Error",e);

}



// =====================
// Divergence
// =====================

try{

if(
typeof analyzeRSIDivergence === "function"
){

divergence =
analyzeRSIDivergence(marketData);

}

}catch(e){}



// =====================
// Market Structure
// =====================

try{

if(
window.GoldAI_MarketStructure_V1 &&
typeof window.GoldAI_MarketStructure_V1.analyze === "function"
){

structure =
window.GoldAI_MarketStructure_V1.analyze(marketData);


structureTrend =
structure?.trend ??
structure?.direction ??
null;

}

}catch(e){}



// =====================
// Score
// =====================

try{

if(
typeof window.GoldAI_ScoreEngine === "function"
){

score =
window.GoldAI_ScoreEngine({

...marketData,

rsi:rsi,

divergence:divergence,

marketStructure:structure

});

}

}catch(e){

console.log("Score Error",e);

}



// =====================
// ATR
// =====================

try{

if(
window.GoldAI_ATR_Engine_V1 &&
typeof window.GoldAI_ATR_Engine_V1.GoldAI_ATR_Analyze === "function"
){

atr =
window.GoldAI_ATR_Engine_V1.GoldAI_ATR_Analyze(marketData);


atrValue =
atr?.value ??
atr?.atr ??
null;

}

}catch(e){}



// =====================
// Conflict
// =====================

try{

if(
window.GoldAI_Conflict_Filter_V1 &&
typeof window.GoldAI_Conflict_Filter_V1.runConflictFilter === "function"
){

conflict =
window.GoldAI_Conflict_Filter_V1.runConflictFilter(marketData);

}

}catch(e){}



// =====================
// Trade Plan
// =====================

try{

if(
window.GoldAI_Trade_Management_V1 &&
typeof window.GoldAI_Trade_Management_V1.createTradePlan === "function"
){

trade =
window.GoldAI_Trade_Management_V1.createTradePlan({

...marketData,

score:score,

atr:atr,

structure:structure

});

}

}catch(e){}



// =====================
// FINAL
// =====================

let finalSignal = "WAIT 🟡";

let confidence = 0;


if(score?.signal){

finalSignal = score.signal;

}


if(score?.confidence){

confidence = score.confidence;

}



return {


signal:finalSignal,


confidence:confidence,


entry:
trade?.entry || marketData.goldPrice,


stopLoss:
trade?.stopLoss || 0,


tp1:
trade?.tp1 || 0,


tp2:
trade?.tp2 || 0,


tp3:
trade?.tp3 || 0,


riskReward:
trade?.riskReward || "1:2",


aiScore:
score?.buyScore - score?.sellScore || 0,


reason:

"RSI + Score + Market Structure + ATR + Risk Management",



details:{


rsi:rsiValue,

divergence:divergence,

structure:structureTrend,

atr:atrValue,

conflict:conflict,

score:score

}


};


}


};
