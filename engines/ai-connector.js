// =====================================
// GoldAI Pro V2
// AI Connector
// Bridge Between V1 Engines and V2
// =====================================


window.GoldAI_Connector = {


    analyze:function(){


        let rsi = null;
        let divergence = null;
        let score = null;
        let structure = null;
        let atr = null;
        let trade = null;
        let conflict = null;


        let errors = [];



        // RSI

        try{

            if(typeof analyzeRSIEngine === "function"){

                rsi = analyzeRSIEngine();

            }

        }
        catch(e){

            errors.push("RSI Error");

        }





        // RSI Divergence

        try{

            if(typeof analyzeRSIDivergence === "function"){

                divergence = analyzeRSIDivergence();

            }

        }
        catch(e){

            errors.push("Divergence Error");

        }





        // Score Engine

        try{

            if(typeof GoldAIScoreEngine === "function"){

                score = GoldAIScoreEngine({});

            }

        }
        catch(e){

            errors.push("Score Error");

        }





        // Market Structure

        try{

            if(
            window.GoldAI_MarketStructure_V1 &&
            typeof window.GoldAI_MarketStructure_V1.analyze === "function"
            ){

                structure =
                window.GoldAI_MarketStructure_V1.analyze();

            }

        }
        catch(e){

            errors.push("Structure Error");

        }





        // ATR

        try{

            if(typeof GoldAI_ATR_Analyze === "function"){

                atr = GoldAI_ATR_Analyze();

            }

        }
        catch(e){

            errors.push("ATR Error");

        }





        // Trade Management

        try{

            if(typeof createTradePlan === "function"){

                trade = createTradePlan();

            }

        }
        catch(e){

            errors.push("Trade Error");

        }





        // Conflict Filter

        try{

            if(typeof runConflictFilter === "function"){

                conflict = runConflictFilter();

            }

        }
        catch(e){

            errors.push("Conflict Error");

        }





        let signal =
            score?.signal ||
            trade?.signal ||
            "WAIT";



        let confidence =
            score?.confidence ||
            50;



        return {


            signal:


                signal,



            confidence:


                confidence,



            entry:


                trade?.entry ||
                window.goldPrice ||
                0,



            stopLoss:


                trade?.stopLoss ||
                0,



            tp1:


                trade?.tp1 ||
                0,



            tp2:


                trade?.tp2 ||
                0,



            tp3:


                trade?.tp3 ||
                0,



            riskReward:


                trade?.riskReward ||
                "1:2",



            aiScore:


                score?.score ||
                0,



            reason:


                errors.length > 0
                ?
                "Engine Status: " + errors.join(" , ")
                :
                "RSI + Structure + Score + ATR Analysis",




            details:{


                rsi,

                divergence,

                structure,

                atr,

                conflict


            }


        };


    }


};



// Export

window.GoldAI_Connector = GoldAI_Connector;
