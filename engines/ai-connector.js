// =====================================
// GoldAI Pro V2
// AI Connector V2 Fixed
// =====================================

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



let rsi=null;
let divergence=null;
let score=null;
let structure=null;
let atr=null;
let trade=null;
let conflict=null;

// Normalize Engine Outputs

let rsiValue = null;
let atrValue = null;
let structureTrend = null
  ;

// RSI

try{

if(window.GoldAI_RSI_V2?.analyzeRSIEngine){

rsi =
window.GoldAI_RSI_V2.analyzeRSIEngine();


rsiValue =
rsi?.value ??
rsi?.rsi ??
rsi?.RSI ??
null;

}

}catch(e){}

console.log("RSI Error",e);

}



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
window.GoldAI_ScoreEngine
){

score =
window.GoldAI_ScoreEngine(marketData);


console.log(score);

}

}catch(e){

console.log("Score Error",e);

}

console.log("Score Error",e);

}

// Market Structure

try{

if(
window.GoldAI_MarketStructure_V1?.analyze
){

structure =
window.GoldAI_MarketStructure_V1.analyze(marketData);


structureTrend =
structure?.trend ??
structure?.direction ??
structure?.market ??
null;

}

}catch(e){}

// ATR

try{

if(
window.GoldAI_ATR_Engine_V1?.GoldAI_ATR_Analyze
){

atr =
window.GoldAI_ATR_Engine_V1.GoldAI_ATR_Analyze(marketData);


atrValue =
atr?.value ??
atr?.atr ??
atr?.ATR ??
null;

}

}catch(e){}

// Conflict

try{

if(window.GoldAI_Conflict_Filter_V1?.runConflictFilter){

conflict =
window.GoldAI_Conflict_Filter_V1.runConflictFilter(marketData);

}

}catch(e){}



// Trade Plan

try{

if(window.GoldAI_Trade_Management_V1?.createTradePlan){

trade =
window.GoldAI_Trade_Management_V1.createTradePlan({

...marketData,

score,
atr,
structure

});

}

}catch(e){}




// FINAL SIGNAL

let finalSignal="WAIT";

let confidence=0;


if(score?.signal){

finalSignal = score.signal;

}


if(score?.confidence){

confidence = score.confidence;

}


if(score?.score){

confidence = Math.min(
95,
Math.max(
confidence,
score.score
)
);

}




return{


signal:finalSignal,


confidence,


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
score?.score || 0,


reason:

`
RSI:${rsi?.value || "-"}
|
Structure:${structure?.trend || "-"}
|
ATR:${atr?.value || "-"}
|
Conflict:${conflict?.status || "-"}
`,


details:{

rsi:rsiValue,

divergence:divergence,

structure:structureTrend,

atr:atrValue,

conflict:conflict

}

};



}


};
