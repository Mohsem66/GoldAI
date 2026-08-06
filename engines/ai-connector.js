// =====================================
// GoldAI Pro V2
// AI Connector
// Connect V1 Engines
// =====================================


const GoldAI_AI = {


    analyze(data){


        let result = {

            buyScore:0,

            sellScore:0,

            confidence:0,

            reason:[],

            details:{}

        };



        // =====================
        // RSI Engine
        // =====================

        if(window.GoldAI_RSI_V2){


            let rsi =
            GoldAI_RSI_V2.analyzeRSIEngine(
                data.priceHistory
            );


            result.buyScore +=
            rsi.buyScore || 0;


            result.sellScore +=
            rsi.sellScore || 0;



            result.details.rsi =
            rsi.rsiValue;


            result.reason.push(
            rsi.reason
            );


        }





        // =====================
        // Divergence
        // =====================

        if(window.GoldAI_RSI_Divergence_V1){


            let div =
            GoldAI_RSI_Divergence_V1
            .analyzeRSIDivergence(
                data.priceHistory,
                data.rsiHistory
            );


            result.details.divergence =
            div.signal || "NONE";


            if(div.type==="BULLISH"){

                result.buyScore += 3;

            }


            if(div.type==="BEARISH"){

                result.sellScore += 3;

            }


        }





        // =====================
        // Score Engine
        // =====================

        if(window.GoldAI_Score_Engine){


            let score =
            GoldAI_Score_Engine(
                data
            );


            result.buyScore +=
            score.buyScore || 0;


            result.sellScore +=
            score.sellScore || 0;


        }





        // =====================
        // Final Decision
        // =====================


        let diff =
        Math.abs(
        result.buyScore -
        result.sellScore
        );


        result.confidence =
        Math.min(
        95,
        50 + diff*10
        );



        if(result.buyScore >
           result.sellScore){


            result.signal="BUY";


        }
        else if(
        result.sellScore >
        result.buyScore
        ){


            result.signal="SELL";


        }
        else{


            result.signal="WAIT";


        }




        return result;


    }



};



window.GoldAI_AI = GoldAI_AI;
