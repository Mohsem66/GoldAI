// ======================================================
// GoldAI Pro V2
// AI Connector
// Full V1 Engine Integration
// ======================================================


const GoldAI_AI = {


analyze(data){


let result = {

signal:"WAIT",

buyScore:0,

sellScore:0,

confidence:50,

details:{},

reason:[],

tradePlan:null

};



// =====================
// RSI ENGINE V2
// =====================

if(window.GoldAI_RSI_V2){


let rsi =
GoldAI_RSI_V2.analyzeRSIEngine(
data.priceHistory
);


data.rsi = rsi;


result.buyScore +=
rsi.buyScore || 0;


result.sellScore +=
rsi.sellScore || 0;


result.details.rsi =
rsi.rsiValue;


if(rsi.reason)
result.reason.push(rsi.reason);


}





// =====================
// RSI DIVERGENCE
// =====================

if(window.GoldAI_RSI_Divergence_V1){


let div =
GoldAI_RSI_Divergence_V1
.analyzeRSIDivergence(

data.priceHistory,

data.rsiHistory

);


result.details.divergence =
div.type || "NONE";


if(div.type==="BULLISH"){

result.buyScore += 3;

result.reason.push(
"Bullish Divergence"
);

}


if(div.type==="BEARISH"){

result.sellScore += 3;

result.reason.push(
"Bearish Divergence"
);

}


}





// =====================
// SCORE ENGINE
// =====================

if(window.GoldAIScoreEngine){


let score =
GoldAIScoreEngine(data);


result.buyScore +=
score.buyScore || 0;


result.sellScore +=
score.sellScore || 0;


}





// =====================
// MARKET STRUCTURE
// =====================

if(window.GoldAI_MarketStructure_V1){


let structure =
GoldAI_MarketStructure_V1.analyze(
data.priceHistory
);


result.details.structure =
structure;


if(structure.signal==="BULLISH"){

result.buyScore +=2;

}


if(structure.signal==="BEARISH"){

result.sellScore +=2;

}


}





// =====================
// ATR ENGINE
// =====================

if(window.GoldAI_ATR_Engine_V1){


let atr =
GoldAI_ATR_Engine_V1
.GoldAI_ATR_Analyze(
data.priceHistory
);


result.details.atr =
atr;


data.atr = atr;


}





// =====================
// TRADE MANAGEMENT
// =====================

if(window.GoldAI_Trade_Management_V1){


result.tradePlan =

GoldAI_Trade_Management_V1
.createTradePlan({

price:data.goldPrice,

signal:result.signal

});


}





// =====================
// CONFLICT FILTER
// =====================

if(window.GoldAI_Conflict_Filter_V1){


let conflict =

GoldAI_Conflict_Filter_V1
.runConflictFilter(result);



if(conflict==="BLOCK"){

result.signal="WAIT";

result.reason.push(
"Conflict Filter Block"
);

}


}





// =====================
// FINAL SIGNAL
// =====================

let diff =
result.buyScore -
result.sellScore;



if(diff>=2){

result.signal="BUY";

}

else if(diff<=-2){

result.signal="SELL";

}

else{

result.signal="WAIT";

}



result.confidence =

Math.min(

95,

50 + Math.abs(diff)*10

);



return result;


}


};



window.GoldAI_AI = GoldAI_AI;
