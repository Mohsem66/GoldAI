# GoldAI Pro

Professional multi-engine signal system for **XAUUSD** and major FX pairs.

## Engines

| Engine | What it does |
|--------|----------------|
| Market Structure | HH/HL, LH/LL, BOS, CHoCH, Swings, Trend/Range (per-series memory) |
| EMA | 20 / 50 / 200 — stack, slope, cross (graceful if EMA200 missing) |
| RSI | Wilder RSI + zones |
| Divergence | Regular + Hidden (aligned price/RSI series) |
| MACD | Line, signal, histogram, cross |
| ADX | Trend strength vs range |
| ATR | Dynamic SL / TP / volatility |
| Volume | Spike + expansion |
| Support / Resistance | Clustered pivots |
| Candles | Hammer, engulfing, pin, doji |
| Liquidity | Equal H/L, stop sweeps (SMC) |
| Score + Conflict Filter | Final decision gate |
| Trade Management | Lot, multi-TP, R:R |

> **Note:** Fundamental & Correlation engines are **simulated** (not live data). They have very low weight and always emit warnings.

## Data modes

| Mode | Meaning |
|------|---------|
| **LIVE** | Price + candles from backend / Twelve Data |
| **MIXED** | Live price + synthetic candles |
| **DEMO** | Fully synthetic — signals forced to WAIT |

## Setup

### Backend (recommended)

```bash
cd backend
cp .env.example .env
# Put your Twelve Data key in .env:
# TWELVE_DATA_API_KEY=your_key_here
npm install
npm start
```

Frontend talks to `http://localhost:5000/api` (see `js/config.js` → `BACKEND_URL`).

### Frontend only

Open `index.html`. Without backend / API key the app runs in **Demo** mode (safe, no tradable signals).

> **Security:** Never commit real API keys. `.env` is in `.gitignore`.

## Signal pipeline

```
Multi-TF data (prefer backend)
  → Structure + EMA + RSI + Div + MACD + ADX
  → Volume + S/R + Candles + Liquidity
  → Score Engine (simulated macro = very low weight)
  → Conflict Filter  (WAIT if conflict / low confidence / Demo data)
  → ATR Trade Plan (SL / TP1-3 / Lot)
```

## Settings (UI)

All main controls are in one card:

- Capital ($)
- Risk (%)
- TP count
- Manual lot (0 = auto)
- SL / TP ATR multipliers
- Strategy (scalp / swing)

## Disclaimer

Educational use only. Not financial advice.
**Confidence is a technical score (0–100), not a real win-probability.**
Trade at your own risk.
