// =====================================
// GoldAI Pro V2
// Analysis Controller
// V1 Bridge
// =====================================


function startGoldAIAnalysis(){



    // دریافت خروجی مستقیم V1

    if(!window.GoldAI_V1_Result){


        alert(
            "No V1 Data. Run V1 Analysis First."
        );


        return;

    }



    let result =
    window.GoldAI_V1_Result;




    // ذخیره برای V2

    window.GoldAI_V2_Data = result;




    // Dashboard

    if(window.GoldAI_Dashboard){


        window.GoldAI_Dashboard.render(result);


    }




    // Details

    if(window.GoldAI_Details){


        window.GoldAI_Details.update({


            aiScore:
            result.score,


            reason:
            result.reason


        });


    }




    // History

    if(window.GoldAI_History){


        window.GoldAI_History.add({


            signal:
            result.signal,


            entry:
            result.entry,


            stopLoss:
            result.stopLoss,


            takeProfit:
            result.takeProfit



        });


    }





    // نمایش مستقیم اگر داشبورد آماده نبود

    if(document.getElementById("signal")){


        document.getElementById("signal").innerHTML =
        result.signal;


        document.getElementById("confidence").innerHTML =
        result.confidence + "%";


        document.getElementById("entry").innerHTML =
        result.entry;


        document.getElementById("sl").innerHTML =
        result.stopLoss;


        document.getElementById("tp1").innerHTML =
        result.takeProfit;


        document.getElementById("rr").innerHTML =
        result.riskReward;


    }



    console.log(
        "✅ GoldAI V2 Updated",
        result
    );

}



// ======================================
// GoldAI Pro V2 STARTUP
// ======================================


document.addEventListener(
"DOMContentLoaded",
function(){


console.log(
"GoldAI Pro V2 Ready"
);



});
