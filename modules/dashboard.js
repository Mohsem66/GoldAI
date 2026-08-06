// ======================================
// GoldAI Pro V2 Dashboard Module
// ======================================

(function(){

"use strict";


const VERSION = "1.0.0";



function getData(){


    if(window.GoldAI_V1_Connector){

        return window.GoldAI_V1_Connector.getOutput();

    }


    return {

        signal:"WAIT",
        confidence:0,
        entry:0,
        stopLoss:0,
        takeProfit:0,
        takeProfit2:0,
        takeProfit3:0,
        riskReward:"1:0",
        score:0,
        reason:"No Data"

    };

}




function renderDashboard(){


    const data = getData();



    const signal =
        document.getElementById("signal");


    const confidence =
        document.getElementById("confidence");


    const entry =
        document.getElementById("entry");


    const sl =
        document.getElementById("stopLoss");


    const tp1 =
        document.getElementById("tp1");


    const tp2 =
        document.getElementById("tp2");


    const tp3 =
        document.getElementById("tp3");


    const rr =
        document.getElementById("riskReward");


    const reason =
        document.getElementById("aiReason");





    if(signal)
        signal.innerHTML =
        data.signal;



    if(confidence)
        confidence.innerHTML =
        data.confidence + "%";



    if(entry)
        entry.innerHTML =
        data.entry;



    if(sl)
        sl.innerHTML =
        data.stopLoss;



    if(tp1)
        tp1.innerHTML =
        data.takeProfit;



    if(tp2)
        tp2.innerHTML =
        data.takeProfit2;



    if(tp3)
        tp3.innerHTML =
        data.takeProfit3;



    if(rr)
        rr.innerHTML =
        data.riskReward;



    if(reason)
        reason.innerHTML =
        data.reason;




    updateSignalStyle(
        data.signal
    );

}





function updateSignalStyle(signal){


    const box =
    document.getElementById("signal");


    if(!box)
        return;



    box.className="";



    if(signal==="BUY"){

        box.classList.add(
            "buy"
        );

    }
    else if(signal==="SELL"){

        box.classList.add(
            "sell"
        );

    }
    else{

        box.classList.add(
            "wait"
        );

    }

}




function startDashboard(){


    renderDashboard();



}




window.GoldAI_Dashboard = {


    version:VERSION,


    render:
        renderDashboard,


    start:
        startDashboard


};



console.log(
"✅ GoldAI V2 Dashboard Loaded"
);



})();
