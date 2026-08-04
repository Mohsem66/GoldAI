// ======================================================
// GoldAI Score Engine
// Version 1.0
// Core Decision System
// ======================================================



function GoldAIScoreEngine(data){


    let buyScore = 0;
    let sellScore = 0;

    let reasons = [];



    // =====================
    // دریافت امتیازها
    // =====================


    if(data.rsi){

    buyScore += data.rsi.buyScore || 0;

    sellScore += data.rsi.sellScore || 0;

    if(data.rsi.rsiValue !== undefined){

    reasons.push(
        "RSI(" + data.rsi.rsiValue + ") Zone: " 
        + data.rsi.zone 
        + " | " 
        + data.rsi.reason
    );

    }
    else if(data.rsi.reason){

        reasons.push(
            "RSI: " + data.rsi.reason
        );

    }

    }
// =====================
// RSI + EMA CONFLICT FILTER
// =====================

if(data.rsi && data.ema){

    // RSI Overbought + EMA Bearish
    if(
        data.rsi.rsiValue >= 70 &&
        data.ema.sellScore > data.ema.buyScore
    ){

        sellScore += 2;

        reasons.push(
            "RSI Overbought + EMA Bearish Conflict"
        );

    }


    // RSI Oversold + EMA Bullish
    if(
        data.rsi.rsiValue <= 30 &&
        data.ema.buyScore > data.ema.sellScore
    ){

        buyScore += 2;

        reasons.push(
            "RSI Oversold + EMA Bullish Reversal"
        );

    }

}
// =====================
// RSI DIVERGENCE
// =====================

// =====================
// RSI DIVERGENCE BOOST
// =====================

// =====================
// DIVERGENCE + EMA CONFIRMATION
// =====================

if(data.divergence){

    buyScore += data.divergence.buyScore || 0;

    sellScore += data.divergence.sellScore || 0;


    if(data.divergence.type !== "NONE"){


        reasons.push(
            "Divergence: " + data.divergence.reason
        );


        // Divergence Strength Boost

        if(data.divergence.strength === "STRONG"){

            data.divergence.confidence += 10;

        }

        else if(data.divergence.strength === "MEDIUM"){

            data.divergence.confidence += 5;

        }

        else if(data.divergence.strength === "WEAK"){

            data.divergence.confidence += 2;

        }



        // EMA Confirmation

        if(
            data.divergence.type.includes("BULLISH") &&
            data.ema &&
            data.ema.buyScore > data.ema.sellScore
        ){

            buyScore += 2;

            reasons.push(
                "Divergence confirmed by EMA Bullish"
            );

        }



        if(
            data.divergence.type.includes("BEARISH") &&
            data.ema &&
            data.ema.sellScore > data.ema.buyScore
        ){

            sellScore += 2;

            reasons.push(
                "Divergence confirmed by EMA Bearish"
            );

        }

    }

}

    if(data.ema){

        buyScore += data.ema.buyScore || 0;

        sellScore += data.ema.sellScore || 0;


        if(data.ema.reason){

            reasons.push(
                "EMA: " + data.ema.reason
            );

        }

    }

// =====================
// MARKET STRUCTURE ENGINE
// =====================


if(data.marketStructure){


    buyScore += 
    data.marketStructure.buyScore || 0;


    sellScore += 
    data.marketStructure.sellScore || 0;



    if(data.marketStructure.reason){

        reasons.push(
            "Structure: "
            +
            data.marketStructure.reason
        );

    }



    if(data.marketStructure.bos){

        reasons.push(
            "🔥 BOS Confirmed"
        );

    }



    if(data.marketStructure.choch){

        reasons.push(
            "⚠️ CHOCH Detected"
        );

    }

}
// =====================
// MARKET STRUCTURE + EMA FILTER
// =====================

if(data.marketStructure && data.ema){


    if(
        data.marketStructure.trend === "BULLISH" &&
        data.ema.buyScore > data.ema.sellScore
    ){

        buyScore += 2;

        reasons.push(
            "Structure + EMA Bullish Confirmation ✅"
        );

    }


    else if(
        data.marketStructure.trend === "BEARISH" &&
        data.ema.sellScore > data.ema.buyScore
    ){

        sellScore += 2;

        reasons.push(
            "Structure + EMA Bearish Confirmation ✅"
        );

    }



    else if(
        data.marketStructure.trend === "BULLISH" &&
        data.ema.sellScore > data.ema.buyScore
    ){

        buyScore -= 1;

        reasons.push(
            "Bullish Structure but EMA Conflict ⚠️"
        );

    }



    else if(
        data.marketStructure.trend === "BEARISH" &&
        data.ema.buyScore > data.ema.sellScore
    ){

        sellScore -= 1;

        reasons.push(
            "Bearish Structure but EMA Conflict ⚠️"
        );

    }

}
    // =====================
    // Momentum
    // =====================


    if(data.priceMove){

        if(data.priceMove > 0){

            buyScore += 1;

            reasons.push(
                "Price Momentum UP"
            );

        }

        else if(data.priceMove < 0){

            sellScore += 1;

            reasons.push(
                "Price Momentum DOWN"
            );

        }

    }




    // =====================
    // Final Signal
    // =====================


    let signal = "WAIT 🟡";


    if(buyScore > sellScore){

        signal = "BUY 🟢";

    }

    else if(sellScore > buyScore){

        signal = "SELL 🔴";

    }



    // =====================
    // Confidence
    // =====================


    let confidence =
Math.abs(buyScore - sellScore) * 10;


// RSI Confidence Boost

if(data.rsi){

    confidence += data.rsi.confidence || 0;

}


if(confidence > 100){

    confidence = 100;

}


// RSI Confidence Boost

if(data.rsi){

    confidence += data.rsi.confidence || 0;

}


if(confidence > 100){

    confidence = 100;

}



    if(confidence > 100){

        confidence = 100;

    }



    // =====================
    // Entry Quality
    // =====================


    let entryQuality="LOW";


    if(confidence >= 80){

        entryQuality="HIGH";

    }

    else if(confidence >=50){

        entryQuality="MEDIUM";

    }

    return {


        signal,

        buyScore,

        sellScore,

        confidence,

        entryQuality,

        reason:
        cleanAIReason(reasons);


    };


}

function cleanAIReason(reasons){

    let unique = [];

    reasons.forEach(item=>{

        if(
            item &&
            !unique.includes(item)
        ){

            unique.push(item);

        }

    });

    return unique.join(" + ");

}
// Export
window.GoldAI_ScoreEngine =
GoldAIScoreEngine;

