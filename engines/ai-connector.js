// ======================================
// GoldAI Pro V2
// V1 Engine Connector
// ======================================

(function(){

"use strict";


const VERSION = "1.0.0";


// دریافت خروجی آماده از Version 1
function getV1Output(){


    let result = {

        signal: "WAIT",

        confidence: 0,

        entry: 0,

        stopLoss: 0,

        takeProfit: 0,

        takeProfit2: 0,

        takeProfit3: 0,

        riskReward: "1:0",

        buyScore: 0,

        sellScore: 0,

        score: 0,

        reason: "Waiting for analysis"

    };



    try{


        // اگر موتور اصلی V1 خروجی global داشته باشد

        if(window.GoldAI_Last_Result){


            const v1 = window.GoldAI_Last_Result;


            result.signal =
                v1.signal ||
                v1.direction ||
                "WAIT";


            result.confidence =
                v1.confidence ||
                v1.aiConfidence ||
                0;


            result.entry =
                v1.entry ||
                v1.entryPrice ||
                0;


            result.stopLoss =
                v1.stopLoss ||
                v1.sl ||
                0;


            result.takeProfit =
                v1.takeProfit ||
                v1.tp ||
                0;


            result.takeProfit2 =
                v1.takeProfit2 ||
                0;


            result.takeProfit3 =
                v1.takeProfit3 ||
                0;


            result.riskReward =
                v1.riskReward ||
                v1.rr ||
                "1:0";


            result.buyScore =
                v1.buyScore ||
                0;


            result.sellScore =
                v1.sellScore ||
                0;


            result.score =
                v1.score ||
                Math.abs(
                    result.buyScore -
                    result.sellScore
                );


            result.reason =
                v1.reason ||
                "AI Analysis Complete";


        }



    }catch(error){

        console.log(
            "GoldAI Connector Error:",
            error
        );

    }



    return result;

}





function publishToDashboard(){


    const data = getV1Output();


    window.GoldAI_V2_Data = data;


    return data;

}




window.GoldAI_V1_Connector = {


    version: VERSION,


    getOutput:
        getV1Output,


    update:
        publishToDashboard


};



console.log(
"✅ GoldAI V1 Connector Loaded"
);



})();
