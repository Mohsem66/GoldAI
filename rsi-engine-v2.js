// ======================================================
// GoldAI RSI Engine v2
// Wilder RSI + Config System
// Version 2.0
// ======================================================


// =====================
// RSI CONFIG
// =====================

const RSI_CONFIG = {

    period: 14,

    levels:{
        extremeLow:20,
        oversold:30,
        middle:50,
        overbought:70,
        extremeHigh:80
    },

    weights:{
        oversold:3,
        overbought:3,
        divergence:4,
        trend:2
    }

};


// =====================
// WILDER RSI CALCULATION
// =====================

function calculateWilderRSI(prices, period = RSI_CONFIG.period){

    if(!prices || prices.length <= period){
        return null;
    }


    let gains = [];
    let losses = [];


    for(let i=1;i<prices.length;i++){

        let change = prices[i] - prices[i-1];


        if(change >= 0){

            gains.push(change);
            losses.push(0);

        }else{

            gains.push(0);
            losses.push(Math.abs(change));

        }

    }


    let avgGain = gains.slice(0,period)
        .reduce((a,b)=>a+b,0) / period;


    let avgLoss = losses.slice(0,period)
        .reduce((a,b)=>a+b,0) / period;



    for(let i=period;i<gains.length;i++){

        avgGain =
        ((avgGain*(period-1))+gains[i])
        /period;


        avgLoss =
        ((avgLoss*(period-1))+losses[i])
        /period;

    }



    if(avgLoss===0){
        return 100;
    }


    let rs = avgGain / avgLoss;


    let rsi =
    100 - (100/(1+rs));


    return Number(rsi.toFixed(2));

}



// =====================
// RSI ZONE DETECTION
// =====================

function detectRSIZone(rsi){

    if(rsi === null)
        return "NO DATA";


    if(rsi <= RSI_CONFIG.levels.extremeLow)
        return "EXTREME OVERSOLD";


    if(rsi <= RSI_CONFIG.levels.oversold)
        return "OVERSOLD";


    if(rsi >= RSI_CONFIG.levels.extremeHigh)
        return "EXTREME OVERBOUGHT";


    if(rsi >= RSI_CONFIG.levels.overbought)
        return "OVERBOUGHT";


    if(rsi >= 50)
        return "BULLISH NEUTRAL";


    if(rsi >= 30)
        return "NEUTRAL";


    return "WEAK OVERSOLD";

}
// ======================================================
// DIVERGENCE DETECTION
// Regular + Hidden Divergence
// ======================================================


function detectRSIDivergence(prices, rsiValues){

    if(!prices || !rsiValues || prices.length < 5)
        return "NONE";


    let priceOld = prices[prices.length-5];
    let priceNew = prices[prices.length-1];

    let rsiOld = rsiValues[rsiValues.length-5];
    let rsiNew = rsiValues[rsiValues.length-1];



    // Regular Bullish
    // Price lower low + RSI higher low

    if(priceNew < priceOld && rsiNew > rsiOld){

        return "REGULAR BULLISH";

    }



    // Regular Bearish
    // Price higher high + RSI lower high

    if(priceNew > priceOld && rsiNew < rsiOld){

        return "REGULAR BEARISH";

    }



    // Hidden Bullish
    // Price higher low + RSI lower low

    if(priceNew > priceOld && rsiNew < rsiOld){

        return "HIDDEN BULLISH";

    }



    // Hidden Bearish
    // Price lower high + RSI higher high

    if(priceNew < priceOld && rsiNew > rsiOld){

        return "HIDDEN BEARISH";

    }


    return "NONE";

}



// ======================================================
// RSI TREND POWER
// ======================================================


function detectRSITrend(rsi){

    if(rsi === null)
        return {
            trend:"UNKNOWN",
            power:0
        };


    if(rsi >= 60){

        return {
            trend:"STRONG BULLISH",
            power:2
        };

    }


    if(rsi >= 50){

        return {
            trend:"BULLISH",
            power:1
        };

    }



    if(rsi <= 40){

        return {
            trend:"STRONG BEARISH",
            power:2
        };

    }



    return {

        trend:"BEARISH",
        power:1

    };

}



// ======================================================
// RSI SCORE ENGINE
// ======================================================


function analyzeRSIEngine(prices,rsiValues){


    let result={

        rsi:null,
        zone:"",
        trend:"",
        divergence:"NONE",

        buyScore:0,
        sellScore:0,

        confidence:0,

        entryQuality:"LOW",

        reason:[]

    };



    let rsi =
    calculateWilderRSI(prices);



    result.rsi=rsi;


    result.zone=
    detectRSIZone(rsi);



    // Zone scoring

    if(rsi <= RSI_CONFIG.levels.oversold){

        result.buyScore += RSI_CONFIG.weights.oversold;

        result.reason.push(
        "RSI Oversold Zone"
        );

    }



    if(rsi >= RSI_CONFIG.levels.overbought){

        result.sellScore += RSI_CONFIG.weights.overbought;

        result.reason.push(
        "RSI Overbought Zone"
        );

    }



    let trend =
    detectRSITrend(rsi);


    result.trend =
    trend.trend;



    if(trend.trend.includes("BULL")){

        result.buyScore += trend.power;

    }


    if(trend.trend.includes("BEAR")){

        result.sellScore += trend.power;

    }



    // Confidence

    let total =
    result.buyScore + result.sellScore;


    result.confidence =
    Math.min(total*5,20);



    if(total >=4){

        result.entryQuality="HIGH";

    }

    else if(total>=2){

        result.entryQuality="MEDIUM";

    }

if(result.reason.length === 0){

    result.reason.push(
    "RSI Neutral Condition"
    );

}

    result.reason =
    result.reason.join(" + ");

    result.rsiValue = Number(rsi.toFixed(2));
    return result;

}



// ======================================================
// EXPORT FOR GoldAI
// ======================================================


window.GoldAI_RSI_V2 = {

    calculateWilderRSI,

    detectRSIZone,

    detectRSITrend,

    analyzeRSIEngine

};

