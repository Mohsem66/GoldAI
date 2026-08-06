// =====================================
// GoldAI Pro V2
// Storage Module
// =====================================

const GoldAI_Storage = {

    // =====================
    // Default Settings
    // =====================

    defaultSettings: {
        capital: 97,
        lot: 0.01,
        riskPercent: 2,
        darkMode: true,
        alertSound: true,
        notifications: false,
        priceSource: "LIVE"
    },


    // =====================
    // Save Settings
    // =====================

    saveSettings(settings){

        let current = this.getSettings();

        let updated = {
            ...current,
            ...settings
        };

        localStorage.setItem(
            "goldai_settings",
            JSON.stringify(updated)
        );

        return updated;
    },


    // =====================
    // Get Settings
    // =====================

    getSettings(){

        let data = localStorage.getItem(
            "goldai_settings"
        );

        if(data){

            return JSON.parse(data);

        }else{

            localStorage.setItem(
                "goldai_settings",
                JSON.stringify(this.defaultSettings)
            );

            return this.defaultSettings;
        }
    },


    // =====================
    // Capital
    // =====================

    saveCapital(value){

        let settings = this.getSettings();

        settings.capital = Number(value);

        this.saveSettings(settings);
    },


    getCapital(){

        return this.getSettings().capital;
    },


    // =====================
    // Lot
    // =====================

    saveLot(value){

        let settings = this.getSettings();

        settings.lot = Number(value);

        this.saveSettings(settings);
    },


    getLot(){

        return this.getSettings().lot;
    },


    // =====================
    // Risk %
    // =====================

    saveRisk(value){

        let settings = this.getSettings();

        settings.riskPercent = Number(value);

        this.saveSettings(settings);
    },


    getRisk(){

        return this.getSettings().riskPercent;
    },


    // =====================
    // Signal History
    // =====================

    saveHistory(signal){

        let history = this.getHistory();


        history.unshift(signal);


        // نگهداری آخرین 100 سیگنال

        if(history.length > 100){

            history = history.slice(0,100);

        }


        localStorage.setItem(
            "goldai_history",
            JSON.stringify(history)
        );

    },


    getHistory(){

        let data = localStorage.getItem(
            "goldai_history"
        );


        return data ? JSON.parse(data) : [];

    },


    clearHistory(){

        localStorage.removeItem(
            "goldai_history"
        );

    },


    // =====================
    // Reset All Data
    // =====================

    reset(){

        localStorage.removeItem(
            "goldai_settings"
        );

        localStorage.removeItem(
            "goldai_history"
        );

        return true;
    }

};


// آماده استفاده برای سایر فایل‌ها

window.GoldAI_Storage = GoldAI_Storage;
