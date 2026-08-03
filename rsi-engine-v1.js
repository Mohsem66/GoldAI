/*
====================================================
 GoldAI RSI Engine
 Version: 1.0
 Author: Mohsen

 Description:
 Professional RSI Analysis Module
 Designed for XAUUSD Scalping

 Features:
 - RSI Calculation
 - Overbought / Oversold Detection
 - RSI Strength
 - Buy/Sell Score
 - Confidence Adjustment
 - AI Reason Generator
 - Entry Quality Filter
 - Divergence Detection
 - Local History Storage

 Compatible With:
 goldPrice
 candles
 closePrices
 buyScore
 sellScore
 confidence
 aiScore

====================================================
*/


const RSI_CONFIG = {

    period: 14,

    overbought: 70,

    oversold: 30,

    strongOverbought: 80,

    strongOversold: 20,

    historyLimit: 50

};


/*
====================================================
 RSI Calculation
====================================================
*/

function calculateRSI(prices, period = RSI_CONFIG.period){

    if(!prices || prices.length <= period){

        return null;

    }


    let gains = 0;

    let losses = 0;


    for(let i = 1; i <= period; i++){

        let difference =
        prices[i] - prices[i-1];


        if(difference >= 0){

            gains += difference;

        }
        else{

            losses += Math.abs(difference);

        }

    }


    let averageGain =
    gains / period;


    let averageLoss =
    losses / period;



    if(averageLoss === 0){

        return 100;

    }


    let rs =
    averageGain / averageLoss;


    let rsi =
    100 - (100 / (1 + rs));


    return Number(rsi.toFixed(2));

}



/*
====================================================
 RSI Status Detector
====================================================
*/


function getRSIStatus(rsi){


    if(rsi === null){

        return "NO DATA";

    }



    if(rsi >= RSI_CONFIG.strongOverbought){

        return "🔴 Extreme Overbought";

    }



    if(rsi >= RSI_CONFIG.overbought){

        return "🔴 Overbought";

    }



    if(rsi <= RSI_CONFIG.strongOversold){

        return "🟢 Extreme Oversold";

    }



    if(rsi <= RSI_CONFIG.oversold){

        return "🟢 Oversold";

    }



    return "🟡 Neutral";


}



/*
====================================================
 RSI Strength
====================================================
*/


function getRSIStrength(rsi){


    if(rsi === null){

        return "Unknown";

    }



    if(rsi <= 20){

        return "Very Strong BUY";

    }



    if(rsi <= 30){

        return "Strong BUY";

    }



    if(rsi >= 80){

        return "Very Strong SELL";

    }



    if(rsi >= 70){

        return "Strong SELL";

    }



    if(rsi > 55){

        return "Bullish Momentum";

    }



    if(rsi < 45){

        return "Bearish Momentum";

    }



    return "Neutral";


}
/*
====================================================
 RSI Score Engine
 Adds RSI influence to GoldAI
====================================================
*/


function analyzeRSIScore(rsi, signalContext = {}){


    let rsiBuyScore = 0;

    let rsiSellScore = 0;

    let confidenceBonus = 0;



    if(rsi === null){

        return {

            rsiBuyScore,
            rsiSellScore,
            confidenceBonus

        };

    }



    /*
    Oversold Area
    Potential BUY Zone
    */


    if(rsi <= RSI_CONFIG.strongOversold){

        rsiBuyScore += 4;

        confidenceBonus += 4;

    }

    else if(rsi <= RSI_CONFIG.oversold){

        rsiBuyScore += 2;

        confidenceBonus += 2;

    }



    /*
    Overbought Area
    Potential SELL Zone
    */


    if(rsi >= RSI_CONFIG.strongOverbought){

        rsiSellScore += 4;

        confidenceBonus += 4;

    }

    else if(rsi >= RSI_CONFIG.overbought){

        rsiSellScore += 2;

        confidenceBonus += 2;

    }



    /*
    Momentum Zones
    */


    if(rsi > 55 && rsi < 70){

        rsiBuyScore += 1;

    }



    if(rsi < 45 && rsi > 30){

        rsiSellScore += 1;

    }



    /*
    Trend Compatibility Filter

    هماهنگی RSI با EMA Trend
    */


    if(signalContext.emaStatus){


        if(
            signalContext.emaStatus == "🟢 Bullish"
            &&
            rsi > 50
        ){

            rsiBuyScore += 1;

        }



        if(
            signalContext.emaStatus == "🔴 Bearish"
            &&
            rsi < 50
        ){

            rsiSellScore += 1;

        }


    }



    return {


        rsiBuyScore,

        rsiSellScore,

        confidenceBonus


    };


}




/*
====================================================
 RSI Divergence Detector
 Simple Price / RSI Divergence
====================================================
*/


function detectRSIDivergence(
prices,
rsiHistory
){


    if(
        !prices ||
        !rsiHistory ||
        prices.length < 5 ||
        rsiHistory.length < 5
    ){

        return "No Divergence";

    }



    let lastPrice =
    prices[prices.length-1];


    let previousPrice =
    prices[prices.length-5];



    let lastRSI =
    rsiHistory[rsiHistory.length-1];


    let previousRSI =
    rsiHistory[rsiHistory.length-5];




    /*
    Bullish Divergence

    Price Lower Low
    RSI Higher Low

    */


    if(
        lastPrice < previousPrice &&
        lastRSI > previousRSI
    ){

        return "🟢 Bullish Divergence";

    }




    /*
    Bearish Divergence

    Price Higher High
    RSI Lower High

    */


    if(
        lastPrice > previousPrice &&
        lastRSI < previousRSI
    ){

        return "🔴 Bearish Divergence";

    }



    return "No Divergence";


}



/*
====================================================
 RSI History Manager
====================================================
*/


function saveRSIHistory(rsi){


    let history = JSON.parse(

        localStorage.getItem("rsiHistory")
        ||
        "[]"

    );



    history.push(rsi);



    if(
        history.length >
        RSI_CONFIG.historyLimit
    ){

        history.shift();

    }



    localStorage.setItem(

        "rsiHistory",

        JSON.stringify(history)

    );



    return history;


}
/*
====================================================
 RSI Entry Quality Engine
 Determines entry quality based on RSI
====================================================
*/


function getRSIEntryQuality(
rsi,
signal,
emaStatus
){


    if(rsi === null){

        return "❌ No RSI Data";

    }



    /*
    BUY Conditions
    */


    if(signal.includes("BUY")){


        if(
            rsi <= 35 &&
            emaStatus == "🟢 Bullish"
        ){

            return "⭐⭐⭐⭐⭐ Excellent BUY Entry";

        }



        if(rsi < 50){

            return "⭐⭐⭐ Medium BUY Entry";

        }



        return "⏳ BUY Needs Confirmation";


    }




    /*
    SELL Conditions
    */


    if(signal.includes("SELL")){


        if(
            rsi >= 65 &&
            emaStatus == "🔴 Bearish"
        ){

            return "⭐⭐⭐⭐⭐ Excellent SELL Entry";

        }



        if(rsi > 50){

            return "⭐⭐⭐ Medium SELL Entry";

        }



        return "⏳ SELL Needs Confirmation";


    }



    return "⏳ Waiting";


}





/*
====================================================
 RSI AI Reason Generator
====================================================
*/


function generateRSIReason(
rsi,
status,
strength,
divergence
){


    let reason = "";



    if(status.includes("Oversold")){


        reason +=
        `
RSI:
اشباع فروش شناسایی شد 🟢<br>
`;

        reason +=
        `
Momentum:
احتمال برگشت صعودی وجود دارد<br>
`;


    }



    else if(status.includes("Overbought")){


        reason +=
        `
RSI:
اشباع خرید شناسایی شد 🔴<br>
`;

        reason +=
        `
Momentum:
احتمال اصلاح قیمت وجود دارد<br>
`;


    }



    else{


        reason +=
        `
RSI:
در محدوده متعادل است ⚪<br>
`;

    }




    reason +=

    `
Strength:
${strength}<br>
`;



    if(
        divergence !=
        "No Divergence"
    ){

        reason +=

        `
Divergence:
${divergence}<br>
`;

    }



    return reason;


}







/*
====================================================
 Main RSI Engine
 Main Function For GoldAI
====================================================
*/


function runRSIEngine(
closePrices,
context = {}
){



    let rsi =

    calculateRSI(
        closePrices,
        RSI_CONFIG.period
    );



    let status =

    getRSIStatus(rsi);



    let strength =

    getRSIStrength(rsi);



    let score =

    analyzeRSIScore(
        rsi,
        context
    );




    let rsiHistory =

    saveRSIHistory(rsi);



    let divergence =

    detectRSIDivergence(
        closePrices,
        rsiHistory
    );



    let entryQuality =

    getRSIEntryQuality(

        rsi,

        context.signal || "WAIT",

        context.emaStatus || "-"

    );



    let reason =

    generateRSIReason(

        rsi,

        status,

        strength,

        divergence

    );




    return {


        value:rsi,


        status:status,


        strength:strength,


        buyScore:score.rsiBuyScore,


        sellScore:score.rsiSellScore,


        confidenceBonus:
        score.confidenceBonus,


        divergence:divergence,


        entryQuality:entryQuality,


        reason:reason



    };


}
/*
====================================================
 GoldAI RSI Engine
 Part 4 / 4
 Version : 1.0
====================================================
*/


/*
====================================================
 RSI Health Check
====================================================
*/

function checkRSIEngine(){

    if(typeof calculateRSI !== "function"){
        return false;
    }

    if(typeof runRSIEngine !== "function"){
        return false;
    }

    return true;

}



/*
====================================================
 Safe Runner
====================================================
*/

function safeRunRSI(closePrices, context = {}){

    try{

        return runRSIEngine(closePrices, context);

    }

    catch(error){

        console.log("RSI Engine Error:", error);

        return {

            value:null,

            status:"ERROR",

            strength:"Unknown",

            buyScore:0,

            sellScore:0,

            confidenceBonus:0,

            divergence:"No Divergence",

            entryQuality:"Unavailable",

            reason:"RSI Engine Error"

        };

    }

}



/*
====================================================
 Engine Information
====================================================
*/

const RSI_ENGINE_INFO = {

    name:"GoldAI RSI Engine",

    version:"1.0",

    author:"Mohsen",

    indicator:"RSI",

    period:RSI_CONFIG.period

};



/*
====================================================
 Ready Message
====================================================
*/

console.log(

"GoldAI RSI Engine v1.0 Loaded"

);
