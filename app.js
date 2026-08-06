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



    let data = {


        priceHistory:
        priceHistory,


        rsiHistory:
        window.rsiHistory || [],


        goldPrice:
        window.goldPrice || 0,


        ema20:
        window.ema20 || null,


        ema50:
        window.ema50 || null,


        ema200:
        window.ema200 || null

    };





    let result =
    GoldAI_AI.analyze(data);





    // Dashboard Update

    GoldAI_Dashboard.update({

        signal:
        result.signal,


        confidence:
        result.confidence,


        entry:
        data.goldPrice,


        stopLoss:
        result.signal==="BUY"
        ?
        data.goldPrice-10
        :
        data.goldPrice+10,


        takeProfit:
        result.signal==="BUY"
        ?
        data.goldPrice+20
        :
        data.goldPrice-20

    });





    // Details Update

    GoldAI_Details.update({

        ...result.details,


        buyScore:
        result.buyScore,


        sellScore:
        result.sellScore,


        reason:
        result.reason.join(" | ")

    });





    // Save History


    GoldAI_History.add({

        signal:
        result.signal,


        entry:
        data.goldPrice,


        stopLoss:
        result.signal==="BUY"
        ?
        data.goldPrice-10
        :
        data.goldPrice+10,


        takeProfit:
        result.signal==="BUY"
        ?
        data.goldPrice+20
        :
        data.goldPrice-20


    });



}
