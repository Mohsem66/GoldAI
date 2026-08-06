// =====================================
// GoldAI Pro V2
// Details Module
// =====================================


const GoldAI_Details = {


    data:{},


    // =====================
    // Update Analysis Data
    // =====================

    update(data){

        this.data = data || {};

        this.render();

    },



    // =====================
    // Render Details
    // =====================

    render(){


        const box =
        document.getElementById(
        "details-content"
        );


        if(!box) return;



        let d = this.data;



        box.innerHTML = `


        <div class="details-card">


        <h3>
        📊 AI Analysis Details
        </h3>



        <div>
        EMA20:
        ${d.ema20 ?? "-"}
        </div>


        <div>
        EMA50:
        ${d.ema50 ?? "-"}
        </div>


        <div>
        EMA200:
        ${d.ema200 ?? "-"}
        </div>



        <hr>



        <div>
        RSI:
        ${d.rsi ?? "-"}
        </div>



        <div>
        MACD:
        ${d.macd ?? "-"}
        </div>



        <div>
        ATR:
        ${d.atr ?? "-"}
        </div>



        <hr>



        <div>
        Market Structure:
        ${d.structure ?? "-"}
        </div>



        <div>
        Divergence:
        ${d.divergence ?? "-"}
        </div>



        <hr>



        <div>
        🧠 AI Reason:
        <br>

        ${d.reason ?? "Waiting Analysis"}

        </div>



        <hr>



        <div>

        ⭐ Score

        <br>

        BUY:
        ${d.buyScore ?? 0}

        <br>

        SELL:
        ${d.sellScore ?? 0}

        </div>



        </div>


        `;


    }



};



window.GoldAI_Details = GoldAI_Details;
