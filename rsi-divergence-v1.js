// ======================================================
// GoldAI RSI Divergence Engine
// Version 1.1
// Advanced Regular + Hidden Divergence
// Swing Detection + Strength System
// ======================================================


// =====================
// CONFIG
// =====================

const DIVERGENCE_CONFIG = {

    lookback:10,

    weights:{
        regular:5,
        hidden:3
    },

    confidence:{
        strong:25,
        medium:15,
        weak:8
    }

};



// ======================================================
// SWING DETECTION
// ======================================================


function getSwingPoints(values){


    if(!values || values.length < 10)
        return null;


    let oldValue =
    values[values.length-5];


    let newValue =
    values[values.length-1];


    return {

        old:oldValue,

        new:newValue

    };

}



// ======================================================
// STRENGTH CALCULATION
// ======================================================


function calculateStrength(
priceOld,
priceNew,
rsiOld,
rsiNew
){


    let priceDiff =
    Math.abs(priceNew-priceOld);


    let rsiDiff =
    Math.abs(rsiNew-rsiOld);



    if(priceDiff >= 1.5 && rsiDiff >= 10){

        return "STRONG";

    }



    if(priceDiff >= 0.7 && rsiDiff >= 5){

        return "MEDIUM";

    }



    return "WEAK";

}



// ======================================================
// REGULAR BULLISH
// Price Lower Low
// RSI Higher Low
// ======================================================


function detectRegularBullish(prices,rsiValues){


    let price =
    getSwingPoints(prices);


    let rsi =
    getSwingPoints(rsiValues);



    if(!price || !rsi)
        return null;



    if(
        price.new < price.old &&
        rsi.new > rsi.old
    ){

        return {

            strength:
            calculateStrength(
                price.old,
                price.new,
                rsi.old,
                rsi.new
            )

        };

    }


    return null;

}



// ======================================================
// REGULAR BEARISH
// Price Higher High
// RSI Lower High
// ======================================================


function detectRegularBearish(prices,rsiValues){


    let price =
    getSwingPoints(prices);


    let rsi =
    getSwingPoints(rsiValues);



    if(!price || !rsi)
        return null;



    if(
        price.new > price.old &&
        rsi.new < rsi.old
    ){

        return {

            strength:
            calculateStrength(
                price.old,
                price.new,
                rsi.old,
                rsi.new
            )

        };

    }


    return null;

}



// ======================================================
// HIDDEN BULLISH
// Price Higher Low
// RSI Lower Low
// ======================================================


function detectHiddenBullish(prices,rsiValues){


    let price =
    getSwingPoints(prices);


    let rsi =
    getSwingPoints(rsiValues);



    if(!price || !rsi)
        return null;



    if(
        price.new > price.old &&
        rsi.new < rsi.old
    ){

        return {

            strength:
            calculateStrength(
                price.old,
                price.new,
                rsi.old,
                rsi.new
            )

        };

    }


    return null;

}



// ======================================================
// HIDDEN BEARISH
// Price Lower High
// RSI Higher High
// ======================================================


function detectHiddenBearish(prices,rsiValues){


    let price =
    getSwingPoints(prices);


    let rsi =
    getSwingPoints(rsiValues);



    if(!price || !rsi)
        return null;



    if(
        price.new < price.old &&
        rsi.new > rsi.old
    ){

        return {

            strength:
            calculateStrength(
                price.old,
                price.new,
                rsi.old,
                rsi.new
            )

        };

    }


    return null;

}



// ======================================================
// MAIN ANALYSIS
// ======================================================


function analyzeRSIDivergence(
prices,
rsiValues
){


let result={


    type:"NONE",

    strength:"NONE",

    buyScore:0,

    sellScore:0,

    confidence:0,

    reason:"No RSI Divergence"


};



// Regular Bullish

let regularBull =
detectRegularBullish(
prices,
rsiValues
);


if(regularBull){


    result.type=
    "REGULAR BULLISH";


    result.strength=
    regularBull.strength;


    result.buyScore=
    DIVERGENCE_CONFIG.weights.regular;


    result.confidence=
    DIVERGENCE_CONFIG.confidence[
        regularBull.strength.toLowerCase()
    ];


    result.reason=
    "RSI Regular Bullish Divergence | Strength: "
    + regularBull.strength;


    return result;

}




// Regular Bearish

let regularBear =
detectRegularBearish(
prices,
rsiValues
);


if(regularBear){


    result.type=
    "REGULAR BEARISH";


    result.strength=
    regularBear.strength;


    result.sellScore=
    DIVERGENCE_CONFIG.weights.regular;


    result.confidence=
    DIVERGENCE_CONFIG.confidence[
        regularBear.strength.toLowerCase()
    ];


    result.reason=
    "RSI Regular Bearish Divergence | Strength: "
    + regularBear.strength;


    return result;

}




// Hidden Bullish

let hiddenBull =
detectHiddenBullish(
prices,
rsiValues
);


if(hiddenBull){


    result.type=
    "HIDDEN BULLISH";


    result.strength=
    hiddenBull.strength;


    result.buyScore=
    DIVERGENCE_CONFIG.weights.hidden;


    result.confidence=
    DIVERGENCE_CONFIG.confidence[
        hiddenBull.strength.toLowerCase()
    ];


    result.reason=
    "RSI Hidden Bullish Divergence | Strength: "
    + hiddenBull.strength;


    return result;

}




// Hidden Bearish

let hiddenBear =
detectHiddenBearish(
prices,
rsiValues
);


if(hiddenBear){


    result.type=
    "HIDDEN BEARISH";


    result.strength=
    hiddenBear.strength;


    result.sellScore=
    DIVERGENCE_CONFIG.weights.hidden;


    result.confidence=
    DIVERGENCE_CONFIG.confidence[
        hiddenBear.strength.toLowerCase()
    ];


    result.reason=
    "RSI Hidden Bearish Divergence | Strength: "
    + hiddenBear.strength;


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
