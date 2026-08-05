// ======================================
// GoldAI Conflict Filter Engine V1
// Core + Configuration
// ======================================


(function(){



const VERSION = "1.0.0";



// ======================================
// ENGINE CONFIG
// ======================================


const CONFIG = {


// وزن موتورهای تحلیل

weights:{


    EMA:15,

    RSI:15,

    STRUCTURE:25,

    DIVERGENCE:15,

    MOMENTUM:20,

    ATR:10


},



// حداقل اعتماد برای سیگنال

minimumConfidence:70,



// حد تضاد شدید

highConflictPenalty:30,



// حالت سختگیرانه

strictMode:true


};





// ======================================
// LOAD CONFIG
// ======================================


let savedConfig =

localStorage.getItem(
"GoldAI_Conflict_Config"
);



if(savedConfig){


try{


Object.assign(

CONFIG,

JSON.parse(savedConfig)

);



}

catch(e){


console.log(
"Conflict Config Load Error"
);


}



}







// ======================================
// SAVE CONFIG
// ======================================


function saveConfig(){


localStorage.setItem(

"GoldAI_Conflict_Config",

JSON.stringify(CONFIG)

);


}







// ======================================
// UPDATE CONFIG
// ======================================


function updateConfig(data){


Object.assign(

CONFIG,

data

);


saveConfig();


}






// ======================================
// PLUGIN STORAGE
// ======================================


let plugins=[];





function registerPlugin(plugin){



if(
plugin &&
typeof plugin.analyze === "function"
){


plugins.push(plugin);


}



}






function getPlugins(){


return plugins;


}






// ======================================
// SIGNAL MEMORY
// ======================================


function createMemory(){


return {


buyScore:0,

sellScore:0,

conflictScore:0,


confidence:50,


reasons:[],


warnings:[],


confirmations:[]


};



}
// ======================================
// EMA ANALYSIS RULE
// ======================================


function analyzeEMA(data,memory){


if(!data.ema){

return;

}



let ema = data.ema;



let buy = 0;

let sell = 0;



if(
ema.trend === "Bullish"
){


buy += CONFIG.weights.EMA;



memory.confirmations.push(

"EMA Bullish Confirmed"

);


}



else if(
ema.trend === "Bearish"
){


sell += CONFIG.weights.EMA;



memory.confirmations.push(

"EMA Bearish Confirmed"

);


}



else{


memory.warnings.push(

"EMA Neutral"

);


}





memory.buyScore += buy;

memory.sellScore += sell;



}








// ======================================
// RSI ANALYSIS RULE
// ======================================


function analyzeRSI(data,memory){



if(!data.rsi){

return;

}



let rsi = data.rsi;



let value =

Number(rsi.rsiValue || 50);





// Bullish Momentum


if(
value >=45 &&
value <=65
){


memory.buyScore +=

CONFIG.weights.RSI;



memory.confirmations.push(

"RSI Bullish Momentum"

);


}





// Oversold BUY Zone


if(
value <30
){


memory.buyScore +=

10;



memory.confirmations.push(

"RSI Oversold Recovery"

);



}






// Overbought Warning


if(
value >70
){


memory.sellScore +=

10;



memory.warnings.push(

"RSI Overbought Warning"

);



}








// Extreme Conditions



if(
value >80
){


memory.sellScore +=

15;



memory.conflictScore +=10;



memory.warnings.push(

"RSI Extreme Overbought"

);

}
if(
value <20
){


memory.buyScore +=

25;


memory.conflictScore +=20;


memory.confidence -=15;


memory.warnings.push(

"RSI Extreme Oversold - SELL Risk Warning"

);

}

}


// ======================================
// MOMENTUM RULE
// ======================================


function analyzeMomentum(data,memory){



if(!data.momentum){

return;

}



let momentum =

data.momentum;





if(
momentum === "UP"
){


memory.buyScore +=

CONFIG.weights.MOMENTUM;



memory.confirmations.push(

"Momentum UP"

);



}






else if(
momentum === "DOWN"
){


memory.sellScore +=

CONFIG.weights.MOMENTUM;



memory.confirmations.push(

"Momentum DOWN"

);



}






else{


memory.warnings.push(

"Momentum Weak"

);



}



}
// ======================================
// MARKET STRUCTURE RULE
// ======================================


function analyzeStructure(data,memory){


if(!data.marketStructure){

return;

}



let structure = data.marketStructure;




// Bullish Structure


if(
structure.direction === "BULLISH"
){


memory.buyScore +=

CONFIG.weights.STRUCTURE;



memory.confirmations.push(

"Market Structure Bullish"

);



}




// Bearish Structure


else if(
structure.direction === "BEARISH"
){


memory.sellScore +=

CONFIG.weights.STRUCTURE;



memory.confirmations.push(

"Market Structure Bearish"

);



}




// BOS


if(structure.bos){


memory.buyScore +=5;



memory.confirmations.push(

"BOS Confirmed"

);



}



// CHOCH


if(structure.choch){


memory.conflictScore +=10;



memory.warnings.push(

"CHOCH Detected"

);



}




}








// ======================================
// DIVERGENCE RULE
// ======================================


function analyzeDivergence(data,memory){



if(!data.divergence){

return;

}



let div = data.divergence;




if(
div.type === "BULLISH"
){


memory.buyScore +=

CONFIG.weights.DIVERGENCE;



memory.confirmations.push(

"RSI Bullish Divergence"

);



}







else if(
div.type === "BEARISH"
){


memory.sellScore +=

CONFIG.weights.DIVERGENCE;



memory.confirmations.push(

"RSI Bearish Divergence"

);



}





}








// ======================================
// ATR MARKET CONDITION
// ======================================


function analyzeATR(data,memory){



if(!data.atr){

return;

}



let atr =

Number(data.atr);





if(
atr > 10
){


memory.warnings.push(

"High Volatility"

);



}





else if(
atr < 3
){


memory.warnings.push(

"Low Volatility"

);



}



else{


memory.confirmations.push(

"Normal Volatility"

);



}





}









// ======================================
// CONFLICT DETECTION ENGINE
// ======================================


function detectConflict(data,memory){



let buy =
memory.buyScore;



let sell =
memory.sellScore;



let difference =

Math.abs(
buy-sell
);




// تضاد شدید بین موتور ها


if(
memory.conflictScore >=20
){


memory.confidence -=

CONFIG.highConflictPenalty;



memory.warnings.push(

"High Indicator Conflict"

);



}




// اختلاف کم بین BUY و SELL


if(
difference <10
){


memory.confidence -=15;



memory.warnings.push(

"No Clear Direction"

);



}






// RSI Conflict Examples



if(

data.rsi &&

data.rsi.rsiValue >80 &&

buy > sell

){


memory.confidence -=20;



memory.warnings.push(

"BUY Against Extreme RSI"

);



}







if(

data.rsi &&

data.rsi.rsiValue <20 &&

sell > buy

){


memory.confidence -=20;



memory.warnings.push(

"SELL Against Extreme RSI"

);



}





}
// ======================================
// CONFIDENCE ENGINE
// ======================================


function calculateConfidence(data,memory){


let total =

memory.buyScore +

memory.sellScore;



let confidence =

50;



if(total > 0){


confidence +=

Math.abs(
memory.buyScore - memory.sellScore
)
*
0.8;


}




// کاهش بابت تضاد

confidence -=

memory.conflictScore;



if(confidence >100){

confidence=100;

}



if(confidence <0){

confidence=0;

}



memory.confidence =

Math.round(confidence);

// ======================================
// EXTREME RSI + WEAK TREND FILTER
// ======================================


if(
data &&
data.rsi &&
data.rsi.rsiValue > 85
&&
data.ema &&
data.ema.trend == "Bullish"
&&
memory.buyScore > memory.sellScore
){


memory.conflictScore +=15;


memory.confidence -=10;


memory.warnings.push(

"RSI Extreme + Weak Confirmation"

);


}

}


// ======================================
// FINAL DECISION ENGINE
// ======================================


function makeDecision(memory){



let signal="WAIT";





if(
memory.buyScore >
memory.sellScore
){


signal="BUY 🟢";


}






else if(
memory.sellScore >
memory.buyScore
){


signal="SELL 🔴";


}






// اگر تضاد شدید باشد

if(

memory.confidence <

CONFIG.minimumConfidence

&&

CONFIG.strictMode

){


signal="WAIT 🟡";


}




return signal;


}







// ======================================
// AI REASON GENERATOR
// ======================================


function generateReason(memory){



let result=[];



if(
memory.confirmations.length
){


result.push(

"✅ "

+

memory.confirmations.join(" + ")

);



}




if(
memory.warnings.length
){


result.push(

"⚠️ "

+

memory.warnings.join(" + ")

);



}




return result.join(

" | "

);



}







// ======================================
// MAIN FILTER FUNCTION
// ======================================


function runConflictFilter(data){



let memory =

createMemory();




// Analyze Engines


analyzeEMA(
data,
memory
);



analyzeRSI(
data,
memory
);



analyzeMomentum(
data,
memory
);



analyzeStructure(
data,
memory
);



analyzeDivergence(
data,
memory
);



analyzeATR(
data,
memory
);





// Detect Conflict


detectConflict(
data,
memory
);





// Confidence


calculateConfidence(
memory
);





// Decision


let signal =

makeDecision(
memory
);





return {


signal,


buyScore:

Math.round(
memory.buyScore
),


sellScore:

Math.round(
memory.sellScore
),


confidence:

memory.confidence,


reason:

generateReason(
memory
),


warnings:

memory.warnings,


confirmations:

memory.confirmations



};



}








// ======================================
// EXPORT
// ======================================


window.GoldAI_Conflict_Filter_V1={



version:VERSION,


runConflictFilter,


updateConfig,


saveConfig,


registerPlugin,


getPlugins,


getConfig



};





console.log(

"✅ GoldAI Conflict Filter Engine V1 Loaded"

);



})();  
