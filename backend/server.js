const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // اگر نصب نیست: npm install node-fetch

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// =============================================
// 🔥 NEW: دریافت قیمت لحظه‌ای از Twelve Data
// =============================================
app.get('/api/price', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'XAU/USD';
    // Twelve Data expects symbol like "XAU/USD" -> "XAU/USD" is fine
    const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.price) {
      res.json({ price: parseFloat(data.price) });
    } else {
      res.status(500).json({ error: 'Failed to fetch price', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// 🔥 NEW: دریافت داده‌های تاریخی (برای بک‌تست)
// =============================================
app.get('/api/historical', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'XAU/USD';
    const interval = req.query.interval || '5min';
    const outputsize = req.query.outputsize || 120;
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.values) {
      res.json(data);
    } else {
      res.status(500).json({ error: 'Failed to fetch historical data', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// Firebase (همانند قبل)
// =============================================
const admin = require('firebase-admin');
const firebaseConfig = require('./firebase-config');

if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig.adminConfig);
}

const db = admin.firestore();
const auth = admin.auth();

// Routes (همان فایل‌های قبلی)
const authRoutes = require('./routes/auth');
const signalRoutes = require('./routes/signals');
const performanceRoutes = require('./routes/performance');
const mt5Routes = require('./routes/mt5');

app.use('/api/auth', authRoutes(auth, db));
app.use('/api/signals', signalRoutes(db));
app.use('/api/performance', performanceRoutes(db));
app.use('/api/mt5', mt5Routes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Online ✅',
    server: 'GoldAI Backend',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 GoldAI Backend started on http://localhost:${PORT}`);
  console.log(`📊 Price API: http://localhost:${PORT}/api/price?symbol=XAU/USD\n`);
});

module.exports = { app, db, auth };
