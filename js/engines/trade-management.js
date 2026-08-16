// =====================================
// GoldAI — Trade Management (با اسپرد و بروکر)
// =====================================

window.GoldAI_Trade = {

  // ===== دریافت اسپرد از تنظیمات =====
  getSpread(cfg) {
    return cfg?.BROKER_SPREAD_PIPS || 0.5;
  },

  // ===== محاسبه Lot واقعی =====
  calculateLot(capital, riskPercent, slPips, symbol, cfg) {
    const riskAmount = capital * (riskPercent / 100);
    const spread = this.getSpread(cfg);
    const effectiveSL = slPips + spread;

    if (effectiveSL <= 0) return 0.01;

    // فرمول استاندارد: Lot = RiskAmount / (SL_Pips * PipValue)
    const pipValue = symbol.includes("JPY") ? 0.01 : 0.0001;
    const lot = riskAmount / (effectiveSL * pipValue * 1000);

    // محدودیت لات
    return Math.min(10, Math.max(0.01, Math.round(lot * 100) / 100));
  },

  // ===== ایجاد برنامه معاملاتی =====
  createTradePlan(signal, price, atr, capital, riskPercent, cfg) {
    if (!signal || signal.includes("WAIT") || !price) {
      return { signal, entry: price, lot: 0, riskReward: 0 };
    }

    const spread = this.getSpread(cfg);
    const slMult = cfg?.ATR_SL_MULT || 1.5;
    const tp1Mult = cfg?.ATR_TP1_MULT || 2.0;
    const tp2Mult = cfg?.ATR_TP2_MULT || 3.5;
    const tp3Mult = cfg?.ATR_TP3_MULT || 5.0;
    const tpCount = cfg?.TP_COUNT || 3;

    const isBuy = signal.includes("BUY");
    const atrValue = atr || 1.5;

    // ===== محاسبه SL با اسپرد =====
    let slPips;
    if (isBuy) {
      slPips = (price - (price - atrValue * slMult)) + spread;
      const slPrice = price - atrValue * slMult - spread;
      var sl = Math.round(slPrice * 100) / 100;
    } else {
      slPips = ((price + atrValue * slMult + spread) - price);
      const slPrice = price + atrValue * slMult + spread;
      var sl = Math.round(slPrice * 100) / 100;
    }

    // ===== TP ها =====
    let tp1, tp2, tp3;
    if (isBuy) {
      tp1 = Math.round((price + atrValue * tp1Mult) * 100) / 100;
      tp2 = Math.round((price + atrValue * tp2Mult) * 100) / 100;
      tp3 = Math.round((price + atrValue * tp3Mult) * 100) / 100;
    } else {
      tp1 = Math.round((price - atrValue * tp1Mult) * 100) / 100;
      tp2 = Math.round((price - atrValue * tp2Mult) * 100) / 100;
      tp3 = Math.round((price - atrValue * tp3Mult) * 100) / 100;
    }

    // ===== محاسبه Lot =====
    const lot = this.calculateLot(capital, riskPercent, slPips, cfg?.SYMBOL || "XAU/USD", cfg);

    // ===== ریسک به ریوارد =====
    const riskAmount = Math.abs(price - sl);
    const reward1 = Math.abs(tp1 - price);
    const rr1 = (reward1 / riskAmount) || 0;
    const reward2 = Math.abs(tp2 - price);
    const rr2 = (reward2 / riskAmount) || 0;
    const reward3 = Math.abs(tp3 - price);
    const rr3 = (reward3 / riskAmount) || 0;

    const riskReward = tpCount >= 2 ? (rr1 + rr2) / 2 : rr1;

    return {
      signal,
      entry: price,
      sl,
      tp1,
      tp2: tpCount >= 2 ? tp2 : undefined,
      tp3: tpCount >= 3 ? tp3 : undefined,
      lot,
      riskReward: Math.round(riskReward * 100) / 100,
      riskAmount: Math.round(riskAmount * 100) / 100,
      spreadUsed: spread,
      slPips: Math.round(slPips * 100) / 100
    };
  }
};
