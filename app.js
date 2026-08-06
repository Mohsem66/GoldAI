// =====================================
// GoldAI Pro V2
// Analysis Controller
// =====================================


function startGoldAIAnalysis(){



    // ===============================
    // Get Price Data From V1 / V2
    // ===============================


    let priceHistory =
        window.priceHistory ||
        window.goldPriceHistory ||
        JSON.parse(
            localStorage.getItem("priceHistory") || "[]"
        );



    let goldPrice =
        window.goldPrice || 0;



    // اگر تاریخچه نبود ولی قیمت هست
    // اجازه تحلیل بده

    if(priceHistory.length < 5 && !goldPrice){


        alert(
            "Waiting for price data..."
        );


        return;

    }




    // ===============================
    // AI Connector
    // ===============================

    if(!window.GoldAI_Connector){


        alert(
            "AI Connector Not Loaded"
        );


        return;

    }



    let result =
    window.GoldAI_Connector.analyze();


    if(!result){


        alert(
            "AI Analysis Failed"
        );


        return;

    }




    // ===============================
    // Dashboard Update
    // ===============================


    if(window.GoldAI_Dashboard){


        GoldAI_Dashboard.update(result);


    }




    // ===============================
    // Details Update
    // ===============================


    if(window.GoldAI_Details){


        GoldAI_Details.update({


            ...result.details,


            aiScore:
            result.aiScore,


            reason:
            result.reason


        });


    }





    // ===============================
    // History Save
    // ===============================


    if(window.GoldAI_History){


        GoldAI_History.add({


            signal:
            result.signal,


            entry:
            result.entry,


            stopLoss:
            result.stopLoss,


            takeProfit:
            result.tp1



        });


    }


}
// ======================================
// GoldAI Pro V2 STARTUP
// ======================================

document.addEventListener(
"DOMContentLoaded",
function(){


    if(window.GoldAI_V1_Connector){

        window.GoldAI_V1_Connector.update();

    }



    if(window.GoldAI_Dashboard){

        window.GoldAI_Dashboard.start();

    }



});
