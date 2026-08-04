// ======================================================
// GoldAI Market Structure Engine
// Version 1.0
// Professional Market Structure Analysis
// HH / HL / LH / LL
// BOS / CHOCH
// Trend Engine
// By Mohsen + ChatGPT
// ======================================================



// =====================
// CONFIG
// =====================

const MARKET_STRUCTURE_CONFIG = {

    swingLookback:5,

    minSwingDistance:2,

    trendWeight:4,

    bosWeight:5,

    chochWeight:6,

    confirmationWeight:2,

    strongTrendThreshold:4,

    weakTrendThreshold:2

};




// ======================================================
// INTERNAL MEMORY
// ======================================================

let marketMemory={

    lastHigh:null,

    lastLow:null,

    previousHigh:null,

    previousLow:null,

    trend:"UNKNOWN",

    structure:"NONE"

};




// ======================================================
// RESULT TEMPLATE
// ======================================================

function createMarketResult(){

    return{

        trend:"UNKNOWN",

        structure:"NONE",

        bos:false,

        choch:false,

        swingHigh:null,

        swingLow:null,

        strength:"NONE",

        buyScore:0,

        sellScore:0,

        confidence:0,

        entryQuality:"LOW",

        warning:"",

        confirmation:"",

        reason:[]

    };

}




// ======================================================
// BASIC VALIDATION
// ======================================================

function isValidPriceArray(prices){

    return Array.isArray(prices)
    &&
    prices.length>=
    MARKET_STRUCTURE_CONFIG.swingLookback+2;

}




// ======================================================
// LAST PRICE
// ======================================================

function getLastPrice(prices){

    return prices[
        prices.length-1
    ];

}




// ======================================================
// PREVIOUS PRICE
// ======================================================

function getPreviousPrice(prices){

    return prices[
        prices.length-2
    ];

}




// ======================================================
// PRICE DIFFERENCE
// ======================================================

function getPriceDifference(a,b){

    return Number(
        (a-b).toFixed(2)
    );

}




// ======================================================
// PRICE DIRECTION
// ======================================================

function detectPriceDirection(prices){

    if(!isValidPriceArray(prices)){

        return "UNKNOWN";

    }


    let last=
    getLastPrice(prices);


    let previous=
    getPreviousPrice(prices);


    if(last>previous){

        return "UP";

    }


    if(last<previous){

        return "DOWN";

    }


    return "SIDEWAYS";

}




// ======================================================
// EXPORT HELPERS
// ======================================================

window.GoldAI_MarketStructure_Config=
MARKET_STRUCTURE_CONFIG;
// ======================================================
// SWING DETECTION ENGINE
// ======================================================


// =====================
// SWING HIGH
// =====================

function isSwingHigh(prices,index){

    if(
        index <
        MARKET_STRUCTURE_CONFIG.swingLookback ||

        index >=
        prices.length -
        MARKET_STRUCTURE_CONFIG.swingLookback
    ){

        return false;

    }


    let value = prices[index];


    for(

        let i=index-
        MARKET_STRUCTURE_CONFIG.swingLookback;

        i<=index+
        MARKET_STRUCTURE_CONFIG.swingLookback;

        i++

    ){

        if(i===index)
            continue;


        if(prices[i] >= value){

            return false;

        }

    }


    return true;

}




// =====================
// SWING LOW
// =====================

function isSwingLow(prices,index){

    if(
        index <
        MARKET_STRUCTURE_CONFIG.swingLookback ||

        index >=
        prices.length -
        MARKET_STRUCTURE_CONFIG.swingLookback
    ){

        return false;

    }


    let value = prices[index];


    for(

        let i=index-
        MARKET_STRUCTURE_CONFIG.swingLookback;

        i<=index+
        MARKET_STRUCTURE_CONFIG.swingLookback;

        i++

    ){

        if(i===index)
            continue;


        if(prices[i] <= value){

            return false;

        }

    }


    return true;

}




// ======================================================
// FIND ALL SWINGS
// ======================================================

function detectSwingPoints(prices){

    let highs=[];

    let lows=[];


    if(!isValidPriceArray(prices)){

        return{

            highs,

            lows

        };

    }



    for(

        let i=
        MARKET_STRUCTURE_CONFIG.swingLookback;

        i<
        prices.length-
        MARKET_STRUCTURE_CONFIG.swingLookback;

        i++

    ){


        if(
            isSwingHigh(
                prices,
                i
            )
        ){

            highs.push({

                index:i,

                price:prices[i]

            });

        }



        if(
            isSwingLow(
                prices,
                i
            )
        ){

            lows.push({

                index:i,

                price:prices[i]

            });

        }

    }



    return{

        highs,

        lows

    };

}




// ======================================================
// LAST SWING HIGH
// ======================================================

function getLastSwingHigh(prices){

    let swings =
    detectSwingPoints(prices);


    if(
        swings.highs.length===0
    ){

        return null;

    }


    return swings.highs[
        swings.highs.length-1
    ];

}




// ======================================================
// LAST SWING LOW
// ======================================================

function getLastSwingLow(prices){

    let swings =
    detectSwingPoints(prices);


    if(
        swings.lows.length===0
    ){

        return null;

    }


    return swings.lows[
        swings.lows.length-1
    ];

}
// ======================================================
// MARKET STRUCTURE ENGINE
// HH / HL / LH / LL
// ======================================================


// =====================
// DETECT STRUCTURE
// =====================

function detectMarketStructure(prices){

    let result={

        trend:"UNKNOWN",

        structure:"NONE",

        strength:0,

        buyScore:0,

        sellScore:0,

        reason:[]

    };


    let swings=
    detectSwingPoints(prices);


    if(
        swings.highs.length<2 ||
        swings.lows.length<2
    ){

        result.reason.push(
            "Not enough swing points"
        );

        return result;

    }



    let lastHigh=
    swings.highs[swings.highs.length-1];

    let prevHigh=
    swings.highs[swings.highs.length-2];



    let lastLow=
    swings.lows[swings.lows.length-1];

    let prevLow=
    swings.lows[swings.lows.length-2];



    let HH=
    lastHigh.price>prevHigh.price;

    let LH=
    lastHigh.price<prevHigh.price;

    let HL=
    lastLow.price>prevLow.price;

    let LL=
    lastLow.price<prevLow.price;



    // =====================
    // BULLISH
    // =====================

    if(HH && HL){

        result.trend="BULLISH";

        result.structure="HH-HL";

        result.strength=2;

        result.buyScore+=4;

        result.reason.push(
            "Higher High"
        );

        result.reason.push(
            "Higher Low"
        );

    }



    // =====================
    // BEARISH
    // =====================

    else if(LH && LL){

        result.trend="BEARISH";

        result.structure="LH-LL";

        result.strength=2;

        result.sellScore+=4;

        result.reason.push(
            "Lower High"
        );

        result.reason.push(
            "Lower Low"
        );

    }



    // =====================
    // TRANSITION
    // =====================

    else if(HH && LL){

        result.trend="VOLATILE";

        result.structure="HH-LL";

        result.buyScore+=1;

        result.sellScore+=1;

        result.reason.push(
            "Mixed Structure"
        );

    }



    else if(LH && HL){

        result.trend="RANGE";

        result.structure="LH-HL";

        result.reason.push(
            "Range Market"
        );

    }



    // =====================
    // TREND POWER
    // =====================

    if(result.strength>=2){

        result.reason.push(
            "Strong Structure"
        );

    }

    else{

        result.reason.push(
            "Weak Structure"
        );

    }



    return result;

}
// ======================================================
// BOS / CHOCH ENGINE
// ======================================================


// =====================
// BREAK OF STRUCTURE
// =====================

function detectBreakOfStructure(prices){

    let result={

        bos:false,

        direction:"NONE",

        buyScore:0,

        sellScore:0,

        confidence:0,

        reason:""

    };


    let swings=
    detectSwingPoints(prices);


    if(
        swings.highs.length<2 ||
        swings.lows.length<2
    ){

        return result;

    }


    let lastPrice=
    getLastPrice(prices);


    let lastHigh=
    swings.highs[
        swings.highs.length-1
    ].price;


    let lastLow=
    swings.lows[
        swings.lows.length-1
    ].price;



    // Bullish BOS

    if(lastPrice>lastHigh){

        result.bos=true;

        result.direction="BULLISH";

        result.buyScore=5;

        result.confidence=15;

        result.reason=
        "Bullish Break Of Structure";

        return result;

    }



    // Bearish BOS

    if(lastPrice<lastLow){

        result.bos=true;

        result.direction="BEARISH";

        result.sellScore=5;

        result.confidence=15;

        result.reason=
        "Bearish Break Of Structure";

        return result;

    }


    return result;

}




// =====================
// CHANGE OF CHARACTER
// =====================

function detectCHOCH(prices){

    let result={

        choch:false,

        direction:"NONE",

        buyScore:0,

        sellScore:0,

        confidence:0,

        reason:""

    };


    let structure=
    detectMarketStructure(prices);




    if(
        marketMemory.trend==="BULLISH" &&
        structure.trend==="BEARISH"
    ){

        result.choch=true;

        result.direction="BEARISH";

        result.sellScore=6;

        result.confidence=20;

        result.reason=
        "Bearish Change Of Character";

    }




    else if(
        marketMemory.trend==="BEARISH" &&
        structure.trend==="BULLISH"
    ){

        result.choch=true;

        result.direction="BULLISH";

        result.buyScore=6;

        result.confidence=20;

        result.reason=
        "Bullish Change Of Character";

    }



    marketMemory.trend=
    structure.trend;


    return result;

}
// ======================================================
// MARKET STRUCTURE SCORE ENGINE
// Score + Confidence + Quality
// ======================================================


function analyzeMarketStructure(prices, confirmations={}){


    let result =
    createMarketResult();



    // =====================
    // Structure Analysis
    // =====================

    let structure =
    detectMarketStructure(prices);



    result.trend =
    structure.trend;


    result.structure =
    structure.structure;


    result.buyScore +=
    structure.buyScore;


    result.sellScore +=
    structure.sellScore;


    result.reason.push(
        ...structure.reason
    );



    // =====================
    // BOS Analysis
    // =====================

    let bos =
    detectBreakOfStructure(prices);


    if(bos.bos){


        result.bos=true;


        result.buyScore +=
        bos.buyScore;


        result.sellScore +=
        bos.sellScore;


        result.confidence +=
        bos.confidence;


        result.reason.push(
            bos.reason
        );

    }




    // =====================
    // CHOCH Analysis
    // =====================

    let choch =
    detectCHOCH(prices);


    if(choch.choch){


        result.choch=true;


        result.buyScore +=
        choch.buyScore;


        result.sellScore +=
        choch.sellScore;


        result.confidence +=
        choch.confidence;


        result.reason.push(
            choch.reason
        );

    }




    // =====================
    // EMA Confirmation
    // =====================

    if(confirmations.ema){


        if(
            confirmations.ema.buyScore >
            confirmations.ema.sellScore
        ){

            result.buyScore +=2;

            result.confirmation =
            "EMA Bullish Confirmed";

        }


        else if(
            confirmations.ema.sellScore >
            confirmations.ema.buyScore
        ){

            result.sellScore +=2;

            result.confirmation =
            "EMA Bearish Confirmed";

        }

    }





    // =====================
    // RSI Confirmation
    // =====================

    if(confirmations.rsi){


        if(
            confirmations.rsi.buyScore >
            confirmations.rsi.sellScore
        ){

            result.buyScore +=1;

            result.reason.push(
                "RSI Supports BUY"
            );

        }


        else if(
            confirmations.rsi.sellScore >
            confirmations.rsi.buyScore
        ){

            result.sellScore +=1;

            result.reason.push(
                "RSI Supports SELL"
            );

        }

    }




    // =====================
    // Divergence Confirmation
    // =====================

    if(confirmations.divergence){


        result.buyScore +=
        confirmations.divergence.buyScore || 0;


        result.sellScore +=
        confirmations.divergence.sellScore || 0;



        if(
            confirmations.divergence.type &&
            confirmations.divergence.type !== "NONE"
        ){

            result.reason.push(

            "Divergence: "
            +
            confirmations.divergence.reason

            );

        }

    }




    // =====================
    // FINAL CONFIDENCE
    // =====================

    let difference =
    Math.abs(
        result.buyScore -
        result.sellScore
    );


    result.confidence +=
    difference * 8;



    if(result.confidence>100){

        result.confidence=100;

    }




    // =====================
    // ENTRY QUALITY
    // =====================


    if(result.confidence>=80){

        result.entryQuality="HIGH";

    }

    else if(result.confidence>=50){

        result.entryQuality="MEDIUM";

    }

    else{

        result.entryQuality="LOW";

    }



    // =====================
    // WARNING
    // =====================


    if(
        result.buyScore ===
        result.sellScore
    ){

        result.warning =
        "Market Structure Unclear";

    }



    result.reason =
    result.reason.join(" + ");



    return result;

}
// ======================================================
// AI REASON BUILDER
// Market Structure Explanation Engine
// ======================================================


function buildMarketAIReason(result){


    let reason=[];



    // =====================
    // Trend Reason
    // =====================

    if(result.trend==="BULLISH"){

        reason.push(
            "Market Structure صعودی 📈"
        );

    }


    else if(result.trend==="BEARISH"){

        reason.push(
            "Market Structure نزولی 📉"
        );

    }


    else{

        reason.push(
            "Market Structure نامشخص ⚠️"
        );

    }




    // =====================
    // Structure Reason
    // =====================

    if(result.structure==="HH-HL"){

        reason.push(
            "Higher High + Higher Low تایید شد ✅"
        );

    }


    else if(result.structure==="LH-LL"){

        reason.push(
            "Lower High + Lower Low تایید شد ✅"
        );

    }



    // =====================
    // BOS / CHOCH
    // =====================

    if(result.bos){

        reason.push(
            "Break Of Structure فعال شد 🔥"
        );

    }


    if(result.choch){

        reason.push(
            "Change Of Character detected ⚠️"
        );

    }




    // =====================
    // Confirmation
    // =====================

    if(result.confirmation){

        reason.push(
            result.confirmation
        );

    }




    return reason.join(" + ");

}




// ======================================================
// MARKET STATUS
// ======================================================

function getMarketStructureStatus(result){


    if(result.confidence>=80){

        return "STRONG STRUCTURE";

    }


    if(result.confidence>=50){

        return "VALID STRUCTURE";

    }


    return "WAIT FOR CONFIRMATION";

}




// ======================================================
// FINAL FORMAT
// ======================================================

function formatMarketStructureResult(result){


    return {


        trend:
        result.trend,


        structure:
        result.structure,


        bos:
        result.bos,


        choch:
        result.choch,


        strength:
        result.strength,


        buyScore:
        result.buyScore,


        sellScore:
        result.sellScore,


        confidence:
        result.confidence,


        entryQuality:
        result.entryQuality,


        status:
        getMarketStructureStatus(result),


        warning:
        result.warning,


        reason:
        buildMarketAIReason(result)


    };


}
// ======================================================
// GOLD AI MARKET STRUCTURE API
// FINAL EXPORT
// ======================================================



function runMarketStructureEngine(
    prices,
    confirmations={}
){


    let analysis =
    analyzeMarketStructure(
        prices,
        confirmations
    );


    return formatMarketStructureResult(
        analysis
    );

}




// ======================================================
// DEBUG INFO
// ======================================================

function getMarketStructureInfo(){


    return {

        name:
        "GoldAI Market Structure Engine",


        version:
        "1.0",


        features:[

            "Swing High / Low",

            "HH HL LH LL",

            "Break Of Structure",

            "Change Of Character",

            "Trend Detection",

            "EMA Confirmation",

            "RSI Confirmation",

            "Divergence Support",

            "AI Scoring"

        ]

    };

}





// ======================================================
// EXPORT TO GOLD AI
// ======================================================


window.GoldAI_MarketStructure_V1 = {


    // Main Engine

    analyze:
    runMarketStructureEngine,


    // Core Functions

    detectSwingPoints,

    detectMarketStructure,

    detectBreakOfStructure,

    detectCHOCH,


    // Helpers

    buildMarketAIReason,

    getMarketStructureStatus,

    getMarketStructureInfo

};
