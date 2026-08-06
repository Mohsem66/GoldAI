// =====================================
// GoldAI Pro V2
// History Module
// =====================================


const GoldAI_History = {


    // =====================
    // Add Signal
    // =====================

    add(signal){


        let item = {

            id: Date.now(),

            time:
            new Date().toLocaleString("fa-IR"),


            signal:
            signal.signal || "WAIT",


            entry:
            signal.entry || "-",


            stopLoss:
            signal.stopLoss || "-",


            takeProfit:
            signal.takeProfit || "-",


            result:
            "OPEN",


            profit:
            0

        };


        GoldAI_Storage.saveHistory(item);


    },





    // =====================
    // Render History
    // =====================

    render(){


        const box =
        document.getElementById(
        "history-content"
        );


        if(!box) return;



        let history =
        GoldAI_Storage.getHistory();



        if(history.length === 0){

            box.innerHTML =
            `
            <div class="empty-history">
            📭 No History
            </div>
            `;

            return;

        }



        let html = `

        <div class="history-card">

        <h3>
        📜 Signal History
        </h3>

        `;



        history.forEach(item=>{


            html += `

            <div class="history-item">


            <b>
            ${item.signal}
            </b>


            <br>

            ⏰ ${item.time}

            <br>

            Entry:
            ${item.entry}


            <br>

            SL:
            ${item.stopLoss}


            <br>

            TP:
            ${item.takeProfit}


            <br>


            Result:
            ${item.result}


            <br>

            Profit:
            ${item.profit}$


            </div>

            `;


        });



        html += `</div>`;


        box.innerHTML = html;


    },





    // =====================
    // Statistics
    // =====================

    stats(){


        let history =
        GoldAI_Storage.getHistory();



        let win =
        history.filter(
        x=>x.result==="WIN"
        ).length;



        let loss =
        history.filter(
        x=>x.result==="LOSS"
        ).length;



        return {

            total:
            history.length,


            win,
            loss

        };


    }



};



window.GoldAI_History = GoldAI_History;
