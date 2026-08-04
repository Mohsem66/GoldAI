// ======================================================
// GoldAI RSI Divergence Engine
// Version 1.0
// Regular + Hidden Divergence
// ======================================================


// =====================
// CONFIG
// =====================

const DIVERGENCE_CONFIG = {

    lookback: 5,

    weights:{
        regular:4,
        hidden:3
    }

};



// =====================
// REGULAR BULLISH
// Price Lower Low
// RSI Higher Low
// =====================

function detectRegularBullish(prices, rsiValues){

    if(!prices || !rsiValues)
        return false;


    let priceOld = prices[prices.length - 5];
    let priceNew = prices[prices.length - 1];

    let rsiOld = rsiValues[rsiValues.length - 5];
    let rsiNew = rsiValues[rsiValues.length - 1];


    if(
        priceNew < priceOld &&
        rsiNew > rsiOld
    ){

        return true;

    }


    return false;

}



// =====================
// REGULAR BEARISH
// Price Higher High
// RSI Lower High
// =====================

function detectRegularBearish(prices, rsiValues){

    if(!prices || !rsiValues)
        return false;


    let priceOld = prices[prices.length - 5];
    let priceNew = prices[prices.length - 1];

    let rsiOld = rsiValues[rsiValues.length - 5];
    let rsiNew = rsiValues[rsiValues.length - 1];


    if(
        priceNew > priceOld &&
        rsiNew < rsiOld
    ){

        return true;

    }


    return false;

}



// =====================
// HIDDEN BULLISH
// Price Higher Low
// RSI Lower Low
// =====================

function detectHiddenBullish(prices,rsiValues){

    if(!prices || !rsiValues)
        return false;


    let priceOld = prices[prices.length - 5];
    let priceNew = prices[prices.length - 1];

    let rsiOld = rsiValues[rsiValues.length - 5];
    let rsiNew = rsiValues[rsiValues.length - 1];


    if(
        priceNew > priceOld &&
        rsiNew < rsiOld
    ){

        return true;

    }


    return false;

}



// =====================
// HIDDEN BEARISH
// Price Lower High
// RSI Higher High
// =====================

function detectHiddenBearish(prices,rsiValues){

    if(!prices || !rsiValues)
        return false;


    let priceOld = prices[prices.length - 5];
    let priceNew = prices[prices.length - 1];

    let rsiOld = rsiValues[rsiValues.length - 5];
    let rsiNew = rsiValues[rsiValues.length - 1];


    if(
        priceNew < priceOld &&
        rsiNew > rsiOld
    ){

        return true;

    }


    return false;

}




// ======================================================
// MAIN DIVERGENCE ANALYSIS
// ======================================================


function analyzeRSIDivergence(prices,rsiValues){


    let result = {

        type:"NONE",

        buyScore:0,

        sellScore:0,

        confidence:0,

        reason:"No RSI Divergence"

    };



    if(detectRegularBullish(prices,rsiValues)){


        result.type =
        "REGULAR BULLISH";


        result.buyScore =
        DIVERGENCE_CONFIG.weights.regular;


        result.confidence = 15;


        result.reason =
        "RSI Regular Bullish Divergence";


        return result;

    }



    if(detectRegularBearish(prices,rsiValues)){


        result.type =
        "REGULAR BEARISH";


        result.sellScore =
        DIVERGENCE_CONFIG.weights.regular;


        result.confidence = 15;


        result.reason =
        "RSI Regular Bearish Divergence";


        return result;

    }




    if(detectHiddenBullish(prices,rsiValues)){


        result.type =
        "HIDDEN BULLISH";


        result.buyScore =
        DIVERGENCE_CONFIG.weights.hidden;


        result.confidence = 10;


        result.reason =
        "RSI Hidden Bullish Divergence";


        return result;

    }




    if(detectHiddenBearish(prices,rsiValues)){


        result.type =
        "HIDDEN BEARISH";


        result.sellScore =
        DIVERGENCE_CONFIG.weights.hidden;


        result.confidence = 10;


        result.reason =
        "RSI Hidden Bearish Divergence";


        return result;

    }



    return result;

}




// ======================================================
// EXPORT
// ======================================================


window.GoldAI_RSI_Divergence_V1 = {

    analyzeRSIDivergence,

    detectRegularBullish,

    detectRegularBearish,

    detectHiddenBullish,

    detectHiddenBearish

};
