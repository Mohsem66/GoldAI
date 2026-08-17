// =====================================
// GoldAI — Walk-Forward Backtest (educational)
// Uses only past bars at each step (no look-ahead)
// =====================================

window.GoldAI_Backtest = {
  runWalkForward(opts) {
    const closes = opts.closes || [];
    const highs = opts.highs || [];
    const lows = opts.lows || [];
    const vols = opts.volumes || [];
    const candles = opts.candles || [];
    const cfg = opts.cfg || window.GoldAI_Config;
    const warmup = opts.warmup || 50;
    const step = opts.step || 5;
    const horizon = opts.horizon || 5;

    const report = {
      method: "walk-forward",
      lookAheadSafe: true,
      totalBars: closes.length,
      trades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      netScore: 0,
      notes: [],
      samples: []
    };

    if (closes.length < warmup + horizon + 5) {
      report.notes.push("Not enough bars for walk-forward");
      return report;
    }

    let wins = 0, losses = 0, trades = 0;
    let net = 0;

    for (let i = warmup; i < closes.length - horizon; i += step) {
      const sliceCloses = closes.slice(0, i + 1);
      const sliceHighs = highs.slice(0, i + 1);
      const sliceLows = lows.slice(0, i + 1);
      const sliceVols = vols.slice(0, i + 1);
      const sliceCandles = candles.slice(0, i + 1);
      const price = sliceCloses[sliceCloses.length - 1];

      const ema = window.GoldAI_EMA.analyzeEMA(sliceCloses, price, cfg);
      const rsi = window.GoldAI_RSI.analyzeRSI(sliceCloses, cfg);
      const structure = window.GoldAI_MarketStructure.analyzeMarketStructure(sliceHighs, sliceLows, sliceCloses, cfg);
      const macd = window.GoldAI_MACD.analyzeMACD(sliceCloses);
      const adx = window.GoldAI_ADX.analyzeADX(sliceHighs, sliceLows, sliceCloses, cfg.ADX_PERIOD || 14);
      const atrL = window.GoldAI_ATR.analyzeATR(sliceHighs, sliceLows, sliceCloses, cfg);
      const volume = window.GoldAI_Volume.analyzeVolume(sliceVols, sliceCloses);
      const sr = window.GoldAI_SR.analyzeSR(sliceHighs, sliceLows, price, cfg);
      const candlesP = window.GoldAI_Candles.analyzeCandles(sliceCandles);
      const liq = window.GoldAI_Liquidity.analyzeLiquidity(sliceHighs, sliceLows, sliceCloses);

      const layers = {
        ema, rsi, divergence: { type: "NONE" }, structure, macd, adx,
        atr: atrL, volume, sr, candles: candlesP, liquidity: liq
      };
      const raw = window.GoldAI_Score.runScoreEngine(layers);
      const final = window.GoldAI_Conflict.runConflictFilter(raw, layers, cfg);

      if (!final.signal || final.signal.includes("WAIT")) continue;

      trades++;
      const future = closes[i + horizon];
      const change = ((future - price) / price) * 100;
      const isBuy = final.signal.includes("BUY");
      const isWin = (isBuy && change > 0) || (!isBuy && change < 0);

      if (isWin) { wins++; net += Math.abs(change); }
      else { losses++; net -= Math.abs(change); }

      if (report.samples.length < 12) {
        report.samples.push({
          bar: i,
          signal: final.signal,
          confidence: final.confidence,
          changePct: Number(change.toFixed(3)),
          result: isWin ? "WIN" : "LOSS"
        });
      }
    }

    report.trades = trades;
    report.wins = wins;
    report.losses = losses;
    report.winRate = trades > 0 ? Number(((wins / trades) * 100).toFixed(1)) : 0;
    report.netScore = Number(net.toFixed(2));
    report.notes.push("Educational only — not brokerage execution simulation");
    report.notes.push("Outcome = price change after " + horizon + " bars");
    return report;
  }
};
