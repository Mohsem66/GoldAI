# GoldAI Pro

Professional multi-engine **XAUUSD** signal system.

## Engines

| Engine | What it does |
|--------|----------------|
| Market Structure | HH/HL, LH/LL, BOS, CHoCH, Swings, Trend/Range |
| EMA | 20 / 50 / 200 — stack, slope, cross, distance |
| RSI | Wilder RSI + zones + cooling |
| Divergence | Regular + Hidden |
| MACD | Line, signal, histogram, cross |
| ADX | Trend strength vs range |
| ATR | Dynamic SL / TP / volatility |
| Volume | Spike + expansion |
| Support / Resistance | Clustered pivots |
| Candles | Hammer, engulfing, pin, doji |
| Liquidity | Equal H/L, stop sweeps (SMC) |
| Score + Conflict Filter | Final decision gate |
| Trade Management | Lot, multi-TP, R:R |

## Timeframes

- **M1 / M5** → scalp / entry  
- **H1** → higher-timeframe bias  

## Setup

1. Open `js/config.js`
2. Set your Twelve Data `API_KEY`
3. Open `index.html` (or GitHub Pages)

Without an API key, **Demo mode** generates synthetic candles so the UI still works.

## Signal pipeline

```
Multi-TF data
  → Structure + EMA + RSI + Div + MACD + ADX
  → Volume + S/R + Candles + Liquidity
  → Score Engine
  → Conflict Filter  (WAIT if conflict / low confidence)
  → ATR Trade Plan (SL / TP1-3 / Lot)
```

## Disclaimer

Educational use only. Not financial advice. Trade at your own risk.
