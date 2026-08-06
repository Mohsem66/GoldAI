// ======================================================
// GoldAI Pro V2
// AI Connector
// Connect Version 1 Engines
// ======================================================


const GoldAI_AI = {


analyze(data){


    let result = {

        signal:"WAIT",

        buyScore:0,

        sellScore:0,

        confidence:50,

        details:{},

        reason:[]

    };



    // =====================
    // RSI ENGINE V2
    // =====================


    if(window.GoldAI_RSI_V2){


        let rsiResult =
        GoldAI_RSI_V2.analyzeRSIEngine(
            data.priceHistory
        );



        data.rsi = rsiResult;



        result.buyScore +=
        rsiResult.buyScore || 0;



        result.sellScore +=
        rsiResult.sellScore || 0;



        result.details.rsi =
        rsiResult.rsiValue;



        if(rsiResult.reason){

            result.reason.push(
            rsiResult.reason
            );

        }


    }





    // =====================
    // RSI DIVERGENCE V1
    // =====================


    if(window.GoldAI_RSI_Divergence_V1){



        let divergence =
        GoldAI_RSI_Divergence_V1
        .analyzeRSIDivergence(

            data.priceHistory,

            data.rsiHistory

        );



        result.details.divergence =
        divergence.type || "NONE";



        if(divergence.type==="BULLISH"){


            result.buyScore += 3;


            result.reason.push(
            "Bullish Divergence"
            );


        }



        if(divergence.type==="BEARISH"){


            result.sellScore += 3;


            result.reason.push(
            "Bearish Divergence"
            );


        }


    }





    // =====================
    // SCORE ENGINE V1
    // =====================


    if(window.GoldAIScoreEngine){



        let score =
        GoldAIScoreEngine(data);



        result.buyScore +=
        score.buyScore || 0;



        result.sellScore +=
        score.sellScore || 0;



        if(score.reasons){

            result.reason.push(
            score.reasons
            );

        }


    }





    // =====================
    // FINAL DECISION
    // =====================


    let difference =
    result.buyScore -
    result.sellScore;




    if(difference >= 2){


        result.signal="BUY";


    }

    else if(difference <= -2){


        result.signal="SELL";


    }

    else{


        result.signal="WAIT";


    }




    result.confidence =

    Math.min(

        95,

        50 + Math.abs(difference)*10

    );





    return result;


}



};



// Export

window.GoldAI_AI = GoldAI_AI;
