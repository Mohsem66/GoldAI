// =====================================
// GoldAI Pro V2
// Settings Module
// =====================================


const GoldAI_Settings = {


    // =====================
    // Render Settings
    // =====================

    render(){

        const container = document.getElementById(
            "settings-content"
        );


        if(!container) return;


        let settings = GoldAI_Storage.getSettings();



        container.innerHTML = `

        <div class="settings-card">

            <h3>⚙️ Settings</h3>


            <label>
            💰 Capital ($)
            </label>

            <input 
            id="capital-input"
            type="number"
            value="${settings.capital}"
            >


            <label>
            📊 Lot Size
            </label>

            <input
            id="lot-input"
            type="number"
            step="0.01"
            value="${settings.lot}"
            >


            <label>
            ⚠️ Risk %
            </label>

            <input
            id="risk-input"
            type="number"
            value="${settings.riskPercent}"
            >



            <label>
            🌐 Price Source
            </label>

            <select id="price-source">

                <option value="LIVE"
                ${settings.priceSource==="LIVE"?"selected":""}>
                Live Price
                </option>


                <option value="MANUAL"
                ${settings.priceSource==="MANUAL"?"selected":""}>
                Manual Price
                </option>

            </select>



            <button onclick="GoldAI_Settings.save()">
            💾 Save Settings
            </button>



            <button 
            class="danger-btn"
            onclick="GoldAI_Settings.reset()">

            🗑 Reset Data

            </button>


        </div>

        `;


    },




    // =====================
    // Save
    // =====================

    save(){


        let data = {


            capital:
            Number(
            document.getElementById(
            "capital-input"
            ).value
            ),


            lot:
            Number(
            document.getElementById(
            "lot-input"
            ).value
            ),


            riskPercent:
            Number(
            document.getElementById(
            "risk-input"
            ).value
            ),


            priceSource:
            document.getElementById(
            "price-source"
            ).value

        };



        GoldAI_Storage.saveSettings(data);



        alert(
        "✅ Settings Saved"
        );


    },





    // =====================
    // Reset
    // =====================

    reset(){


        if(confirm(
        "Reset all GoldAI data?"
        )){


            GoldAI_Storage.reset();



            alert(
            "Data Reset Complete"
            );


            this.render();

        }

    }


};



// Global Access

window.GoldAI_Settings = GoldAI_Settings;
