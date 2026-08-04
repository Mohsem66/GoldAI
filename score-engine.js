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


        if(data.rsi.reason){

            reasons.push(
                "RSI: " + data.rsi.reason
            );

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
        reasons.join(" + ")


    };


}



// Export

window.GoldAI_ScoreEngine =
GoldAIScoreEngine;

