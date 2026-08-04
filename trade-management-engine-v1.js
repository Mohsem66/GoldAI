/*
=========================================
GoldAI Trade Management Engine V1
Core + Configuration
=========================================
*/


(function(){


// ===============================
// ENGINE VERSION
// ===============================

const VERSION = "1.0.0";



// ===============================
// DEFAULT SETTINGS
// ===============================

const CONFIG = {


// Risk Management

riskPercent: 2,



// ATR Settings

atrMultiplier: 1.5,



// Break Even

breakEvenEnabled:true,

breakEvenRR:1,



// Trailing Stop

trailingEnabled:true,

trailingType:"ATR",

trailingMultiplier:1,



// Partial Close

partialCloseEnabled:true,



// Take Profit System

targets:[


    {
        enabled:true,
        rr:2,
        closePercent:30
    },


    {
        enabled:true,
        rr:5,
        closePercent:30
    },


    {
        enabled:true,
        rr:10,
        closePercent:40
    }


]

};



// ===============================
// LOAD USER SETTINGS
// ===============================


let savedConfig =
localStorage.getItem(
"GoldAI_Trade_Config"
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
        "Config Load Error"
        );

    }

}



// ===============================
// SAVE SETTINGS
// ===============================


function saveConfig(){


localStorage.setItem(

"GoldAI_Trade_Config",

JSON.stringify(CONFIG)

);


}




// ===============================
// GET SETTINGS
// ===============================


function getConfig(){


return CONFIG;


}




// ===============================
// UPDATE SETTINGS
// ===============================


function updateConfig(data){


Object.assign(

CONFIG,

data

);


saveConfig();


}




// ===============================
// ADD TP TARGET
// ===============================


function addTarget(
rr,
percent
){


CONFIG.targets.push({

enabled:true,

rr:Number(rr),

closePercent:Number(percent)

});


saveConfig();


}




// ===============================
// REMOVE TP TARGET
// ===============================


function removeTarget(index){


CONFIG.targets.splice(
index,
1
);


saveConfig();


}




// ===============================
// UPDATE TP TARGET
// ===============================


function updateTarget(

index,

rr,

percent

){


if(!CONFIG.targets[index])
return;



CONFIG.targets[index]={

enabled:true,

rr:Number(rr),

closePercent:Number(percent)

};


saveConfig();


}
// ===============================
// RISK MANAGEMENT ENGINE
// ===============================


function calculateRiskMoney(

capital,

riskPercent

){


let risk =

Number(capital) *

Number(riskPercent || CONFIG.riskPercent)

/

100;



return Number(
risk.toFixed(2)
);


}




// ===============================
// POSITION SIZE ENGINE
// ===============================


function calculateLotSize(data){


let capital =
Number(data.capital || 0);



let riskPercent =
Number(
data.riskPercent ||
CONFIG.riskPercent
);



let riskMoney =

calculateRiskMoney(

capital,

riskPercent

);



let stopDistance =

Math.abs(

Number(data.entry)

-

Number(data.stopLoss)

);



// جلوگیری از تقسیم بر صفر

if(stopDistance <=0){


return {

lot:0,

riskMoney

};


}




let lot =

riskMoney /

(
stopDistance * 100
);



if(lot < 0.01){

lot=0.01;

}



return {


lot:

Number(
lot.toFixed(2)
),


riskMoney,


riskPercent


};



}





// ===============================
// RISK REWARD CALCULATION
// ===============================


function calculateRR(data){


let risk =

Math.abs(

Number(data.entry)

-

Number(data.stopLoss)

);



let reward =

Math.abs(

Number(data.takeProfit)

-

Number(data.entry)

);



if(risk===0){

return 0;

}



return Number(

(reward/risk)

.toFixed(2)

);



}





// ===============================
// TRADE RISK SUMMARY
// ===============================


function getRiskSummary(data){


let lotData =

calculateLotSize(data);



return {


capital:

Number(data.capital || 0),


riskPercent:

lotData.riskPercent,


riskMoney:

lotData.riskMoney,


lot:

lotData.lot



};



}
// ===============================
// ATR STOP LOSS ENGINE
// ===============================


function calculateATRStopLoss(data){


let entry =

Number(data.entry);



let signal =

data.signal;



let atr =

Number(data.atr || 0);



let multiplier =

Number(
data.atrMultiplier ||
CONFIG.atrMultiplier
);



// اگر ATR موجود نبود

if(atr <=0){


atr = 5;


}



let distance =

atr * multiplier;



let stopLoss;



if(
signal.includes("BUY")
){


stopLoss =

entry - distance;



}



else if(
signal.includes("SELL")
){


stopLoss =

entry + distance;



}



return {


entry:

entry.toFixed(2),


stopLoss:

stopLoss.toFixed(2),


atr:

atr.toFixed(2),


distance:

distance.toFixed(2),


reason:

"ATR Dynamic Stop Loss"


};


}





// ===============================
// VOLATILITY CHECK
// ===============================


function analyzeVolatility(data){


let atr =

Number(data.atr || 0);



let level="NORMAL";



if(atr >= 10){


level="HIGH";


}


else if(atr <=3){


level="LOW";


}



return {


atr:

atr.toFixed(2),


level


};



}





// ===============================
// STOP LOSS UPDATE
// ===============================


function updateStopLoss(

currentSL,

newSL,

signal

){



if(
signal.includes("BUY")
){



// فقط اجازه حرکت به سمت بالا

if(Number(newSL)>Number(currentSL)){


return Number(newSL.toFixed(2));


}



}



if(
signal.includes("SELL")
){



// فقط اجازه حرکت به سمت پایین

if(Number(newSL)<Number(currentSL)){


return Number(newSL.toFixed(2));


}



}



return Number(
currentSL.toFixed(2)
);



}
// ===============================
// DYNAMIC TAKE PROFIT ENGINE
// ===============================


function calculateTakeProfits(data){


let entry =

Number(data.entry);



let stopLoss =

Number(data.stopLoss);



let signal =

data.signal;



let riskDistance =

Math.abs(
entry - stopLoss
);



let targets=[];



CONFIG.targets.forEach(
(target,index)=>{


if(
!target.enabled
){

return;

}



let price;



if(
signal.includes("BUY")
){


price =

entry +

(
riskDistance *
Number(target.rr)
);


}



else if(
signal.includes("SELL")
){


price =

entry -

(
riskDistance *
Number(target.rr)
);


}



targets.push({


level:

index + 1,


rr:

Number(target.rr),


price:

Number(
price.toFixed(2)
),


closePercent:

Number(
target.closePercent
)



});


});



let finalTP="-";



if(targets.length>0){


finalTP =

targets[
targets.length-1
].price;


}



return {


targets,


finalTP,


count:

targets.length,


riskDistance:

Number(
riskDistance.toFixed(2)
)



};



}





// ===============================
// ADD NEW TP DYNAMICALLY
// ===============================


function addDynamicTP(

rr,

percent

){


CONFIG.targets.push({


enabled:true,


rr:Number(rr),


closePercent:Number(percent)



});



saveConfig();



}





// ===============================
// CHECK TARGET VALIDITY
// ===============================


function validateTPPercent(){


let total=0;



CONFIG.targets.forEach(
target=>{


if(target.enabled){


total +=

Number(
target.closePercent
);


}


});



return {


valid:

total <=100,


totalPercent:

total



};



}
// ===============================
// PARTIAL CLOSE ENGINE
// ===============================


function calculatePartialClose(data){


let totalLot =

Number(
data.lot || 0
);



let remainingLot = totalLot;


let steps=[];



CONFIG.targets.forEach(
(target,index)=>{


if(
!target.enabled
){

return;

}



let closeLot =

totalLot *

(
Number(target.closePercent)
/100
);



remainingLot -= closeLot;



if(remainingLot < 0){

remainingLot=0;

}



steps.push({


target:

index+1,


rr:

target.rr,


closePercent:

target.closePercent,


closeLot:

Number(
closeLot.toFixed(2)
),


remainingLot:

Number(
remainingLot.toFixed(2)
)



});



});



return {


steps,


initialLot:

totalLot,


remainingLot:

Number(
remainingLot.toFixed(2)
)



};



}





// ===============================
// EXECUTION CHECK
// ===============================


function checkTargetHit(data){



let price =

Number(data.currentPrice);



let signal =

data.signal;



let hitTargets=[];



data.targets.forEach(
target=>{


let targetPrice =

Number(target.price);



if(
signal.includes("BUY")
){


if(price >= targetPrice){


hitTargets.push(target);


}



}



else if(
signal.includes("SELL")
){


if(price <= targetPrice){


hitTargets.push(target);


}



}



});



return hitTargets;



}





// ===============================
// REMAINING POSITION
// ===============================


function calculateRemainingPosition(

lot,

closedPercent

){


let remaining =

Number(lot)

*

(
1 -
Number(closedPercent)
/100
);



return Number(

remaining.toFixed(2)

);



}
// ===============================
// BREAK EVEN ENGINE
// ===============================


function calculateBreakEven(data){


if(
!CONFIG.breakEvenEnabled
){

return {

active:false

};

}



let entry =

Number(data.entry);



let currentPrice =

Number(data.currentPrice);



let stopLoss =

Number(data.stopLoss);



let signal =

data.signal;



let risk =

Math.abs(
entry-stopLoss
);



if(risk<=0){

return {

active:false

};

}



let profit =

Math.abs(
currentPrice-entry
);



let currentRR =

profit / risk;



if(
currentRR >= CONFIG.breakEvenRR
){


return {


active:true,


newStopLoss:

entry.toFixed(2),


rr:

currentRR.toFixed(2),


reason:

"Break Even Activated"



};


}



return {


active:false,


newStopLoss:

stopLoss.toFixed(2)


};



}





// ===============================
// SMART TRAILING STOP ENGINE
// ===============================


function calculateTrailingStop(data){



if(
!CONFIG.trailingEnabled
){

return {


active:false


};

}



let signal =

data.signal;



let currentPrice =

Number(data.currentPrice);



let atr =

Number(data.atr || 0);



let multiplier =

Number(
CONFIG.trailingMultiplier
);



let distance =

atr * multiplier;



if(distance<=0){

distance=5;

}



let newSL;



if(
signal.includes("BUY")
){


newSL =

currentPrice-distance;



}



else if(
signal.includes("SELL")
){


newSL =

currentPrice+distance;



}



return {


active:true,


newStopLoss:

Number(
newSL.toFixed(2)
),


distance:

Number(
distance.toFixed(2)
),


type:

CONFIG.trailingType,


reason:

"Smart Trailing Stop"



};



}





// ===============================
// FINAL STOP UPDATE
// ===============================


function manageStopLoss(data){


let currentSL =

Number(data.stopLoss);



let newSL = currentSL;



let signal =

data.signal;



let breakEven =

calculateBreakEven(data);



if(
breakEven.active
){


newSL =

Number(
breakEven.newStopLoss
);


}



let trailing =

calculateTrailingStop(data);



if(
trailing.active
){



if(
signal.includes("BUY")
){


if(
trailing.newStopLoss > newSL
){


newSL =
trailing.newStopLoss;


}



}



if(
signal.includes("SELL")
){


if(
trailing.newStopLoss < newSL
){


newSL =
trailing.newStopLoss;


}



}


}



return {


oldSL:

currentSL.toFixed(2),


newSL:

Number(
newSL.toFixed(2)
),


breakEven,


trailing



};



}
// ===============================
// FINAL TRADE PLANNER
// ===============================


function createTradePlan(data){


let entry =

Number(data.entry);



let signal =

data.signal;



// 1) ATR Stop Loss

let slData =

calculateATRStopLoss({

    entry,

    signal,

    atr:data.atr

});



let stopLoss =

Number(
slData.stopLoss
);




// 2) Take Profit

let tpData =

calculateTakeProfits({

    entry,

    stopLoss,

    signal

});




// 3) Position Size

let position =

calculateLotSize({

    capital:data.capital,

    riskPercent:data.riskPercent,

    entry,

    stopLoss

});




// 4) Partial Close

let partial =

calculatePartialClose({

    lot:position.lot

});




// 5) Risk Reward

let finalTP =

Number(
tpData.finalTP
);



let rr =

calculateRR({

    entry,

    stopLoss,

    takeProfit:finalTP

});





return {


version:VERSION,


signal,


entry:

entry.toFixed(2),



stopLoss,


takeProfits:

tpData.targets,



finalTP,



riskReward:

rr,



position,


partialClose:partial,



breakEven:


calculateBreakEven({

    entry,

    stopLoss,

    currentPrice:data.currentPrice,

    signal

}),



trailing:


calculateTrailingStop({

    entry,

    stopLoss,

    currentPrice:data.currentPrice,

    atr:data.atr,

    signal

}),



volatility:


analyzeVolatility({

    atr:data.atr

}),



created:

new Date().toLocaleString()

};


}
// ===============================
// GOLD AI TRADE MANAGEMENT EXPORT
// ===============================


window.GoldAI_Trade_Management_V1={


    // Version

    version:VERSION,



    // Configuration

    getConfig,


    updateConfig,


    addTarget,


    removeTarget,


    updateTarget,



    // Risk

    calculateRiskMoney,


    calculateLotSize,


    calculateRR,


    getRiskSummary,



    // Stop Loss

    calculateATRStopLoss,


    analyzeVolatility,


    updateStopLoss,



    // Take Profit

    calculateTakeProfits,


    addDynamicTP,


    validateTPPercent,



    // Partial Close

    calculatePartialClose,


    checkTargetHit,


    calculateRemainingPosition,



    // Break Even + Trailing

    calculateBreakEven,


    calculateTrailingStop,


    manageStopLoss,



    // Final Planner

    createTradePlan



};



// ===============================
// ENGINE READY
// ===============================


console.log(

"✅ GoldAI Trade Management Engine V1 Loaded"

);


})();
