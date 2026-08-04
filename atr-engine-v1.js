// ======================================================
// GoldAI ATR Risk Engine
// Version 2.0
// Dynamic Risk Management Module
// ======================================================


// =====================
// CONFIG
// =====================

const ATR_ENGINE_CONFIG = {


    period:14,


    // ضریب فاصله استاپ
    stopMultiplier:1.5,


    // ضریب تارگت
    targetMultiplier:3,


    // حداقل فاصله SL
    minStopDistance:5,


    // حداکثر فاصله SL
    maxStopDistance:50,


    // ریسک پیش فرض
    riskPercent:2

};
// =====================
// ATR CALCULATION
// =====================


function calculateATR(prices){


    if(
        !prices ||
        prices.length < ATR_ENGINE_CONFIG.period + 1
    ){

        return null;

    }



    let trueRanges = [];



    for(
        let i = 1;
        i < prices.length;
        i++
    ){


        let range =
        Math.abs(
            prices[i] - prices[i-1]
        );


        trueRanges.push(range);


    }




    let recentRanges =
    trueRanges.slice(
        -ATR_ENGINE_CONFIG.period
    );



    let sum =
    recentRanges.reduce(
        (total,value)=> total + value,
        0
    );



    let atr =
    sum / recentRanges.length;



    return Number(
        atr.toFixed(2)
    );

}




// =====================
// VOLATILITY CHECK
// =====================


function detectVolatility(atr){


    if(!atr){

        return "UNKNOWN";

    }



    if(atr >= 5){

        return "HIGH";

    }


    else if(atr >= 2){

        return "MEDIUM";

    }


    else{

        return "LOW";

    }


}
// =====================
// DYNAMIC SL / TP CALCULATOR
// =====================


function calculateDynamicRisk(
    entry,
    signal,
    prices
){


    let atr =
    calculateATR(prices);



    if(!atr){

        return {

            atr:0,

            volatility:"UNKNOWN",

            stopLoss:entry,

            takeProfit:entry,

            riskReward:"1:0"

        };

    }



    let volatility =
    detectVolatility(atr);



    let stopDistance =
    atr *
    ATR_ENGINE_CONFIG.stopMultiplier;



    let targetDistance =
    atr *
    ATR_ENGINE_CONFIG.targetMultiplier;




    // محدود کردن فاصله استاپ

    if(
        stopDistance <
        ATR_ENGINE_CONFIG.minStopDistance
    ){

        stopDistance =
        ATR_ENGINE_CONFIG.minStopDistance;

    }



    if(
        stopDistance >
        ATR_ENGINE_CONFIG.maxStopDistance
    ){

        stopDistance =
        ATR_ENGINE_CONFIG.maxStopDistance;

    }




    let stopLoss;

    let takeProfit;



    if(
        signal.includes("BUY")
    ){


        stopLoss =
        entry - stopDistance;


        takeProfit =
        entry + targetDistance;


    }



    else if(
        signal.includes("SELL")
    ){


        stopLoss =
        entry + stopDistance;


        takeProfit =
        entry - targetDistance;


    }



    let risk =
    Math.abs(
        entry - stopLoss
    );



    let reward =
    Math.abs(
        takeProfit - entry
    );



    let rr =
    reward / risk;



    return {


        atr:


        Number(
            atr.toFixed(2)
        ),



        volatility,



        stopLoss:


        Number(
            stopLoss.toFixed(2)
        ),



        takeProfit:


        Number(
            takeProfit.toFixed(2)
        ),



        riskReward:


        "1:" +
        rr.toFixed(1)

    };


}
// =====================
// RISK MANAGEMENT
// =====================


function calculateRiskAmount(
    capital,
    riskPercent
){


    if(
        !capital ||
        !riskPercent
    ){

        return 0;

    }



    return Number(
        (
            capital *
            riskPercent /
            100
        )
        .toFixed(2)
    );


}




// =====================
// LOT SIZE ESTIMATION
// =====================


function calculateSuggestedLot(
    capital,
    riskPercent
){


    let riskMoney =
    calculateRiskAmount(
        capital,
        riskPercent
    );



    if(
        riskMoney <=0
    ){

        return 0.01;

    }



    let lot =
    riskMoney / 100;



    if(lot < 0.01){

        lot = 0.01;

    }



    return Number(
        lot.toFixed(2)
    );


}




// =====================
// COMPLETE RISK REPORT
// =====================


function generateRiskReport(
    entry,
    signal,
    prices,
    capital
){


    let dynamicRisk =
    calculateDynamicRisk(
        entry,
        signal,
        prices
    );



    let riskMoney =
    calculateRiskAmount(
        capital,
        ATR_ENGINE_CONFIG.riskPercent
    );



    let lot =
    calculateSuggestedLot(
        capital,
        ATR_ENGINE_CONFIG.riskPercent
    );



    return {


        ...dynamicRisk,


        riskMoney,


        suggestedLot:lot,


        riskPercent:
        ATR_ENGINE_CONFIG.riskPercent


    };

}
// =====================
// GOLD AI RISK ADAPTER
// =====================


function GoldAI_ATR_Analyze(
    entry,
    signal,
    prices,
    capital
){


    let result =
    calculateDynamicRisk(
        entry,
        signal,
        prices
    );


    let risk =
    calculateRiskAmount(
        capital,
        ATR_ENGINE_CONFIG.riskPercent
    );


    return {


        stopLoss:
        result.stopLoss,


        takeProfit:
        result.takeProfit,


        atr:
        result.atr,


        volatility:
        result.volatility,


        riskReward:
        result.riskReward,


        riskMoney:
        risk

    };

}
// =====================
// EXPORT
// =====================

window.GoldAI_ATR_Engine_V1 = {


    calculateATR,

    detectVolatility,

    calculateDynamicRisk,

    calculateRiskAmount,

    calculateSuggestedLot,

    generateRiskReport,

    GoldAI_ATR_Analyze

};
