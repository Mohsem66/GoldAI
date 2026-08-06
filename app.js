// =====================================
// GoldAI Pro V2
// Analysis Controller
// =====================================


function startGoldAIAnalysis(){


    let priceHistory =
    window.priceHistory || [];


    if(priceHistory.length < 20){

        alert(
        "Waiting for price data..."
        );

        return;

    }



    let result =
    GoldAI_Connector.analyze();



    if(!result){

        alert("AI Analysis Failed");

        return;

    }



    // ===============================
    // Dashboard Update
    // ===============================

    GoldAI_Dashboard.update(result);



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
    // Save History
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



    console.log(
        "GoldAI Result",
        result
    );


}
