// ======================================
// GoldAI V1 Connector
// Connect V1 Engine To V2 Dashboard
// ======================================


(function(){


function getOutput(){


    if(!window.GoldAI_V1_Result){

        return null;

    }


    return window.GoldAI_V1_Result;


}



function update(){

    return getOutput();

}



window.GoldAI_V1_Connector = {


    getOutput,

    update


};



console.log(
"✅ GoldAI V1 Connector Loaded"
);



})();
