// =====================================
// GoldAI Pro V2
// Analysis Controller
// =====================================


function startGoldAIAnalysis(){



    // دریافت خروجی V1

    if(!window.GoldAI_V1_Connector){


        alert(
            "V1 Connector Not Loaded"
        );


        return;

    }



    let result =
    window.GoldAI_V1_Connector.getOutput();




    if(!result){


        alert(
            "No V1 Data"
        );


        return;

    }





    // ذخیره خروجی برای V2

    window.GoldAI_V2_Data = result;




    // Dashboard

    if(window.GoldAI_Dashboard){


        window.GoldAI_Dashboard.render();


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


    if(window.GoldAI_V1_Connector){

        window.GoldAI_V1_Connector.update();

    }


    if(window.GoldAI_Dashboard){

        window.GoldAI_Dashboard.start();

    }


});
