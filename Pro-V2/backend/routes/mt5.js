const express = require('express');
const axios = require('axios');
const router = express.Router();

// MT5 Bridge - ابداً
// برای اتصال مستقیم MetaTrader 5

// اطلاعات اتصال (بعداً از .env)
const MT5_CONFIG = {
  server: process.env.MT5_SERVER || 'ICMarkets-Demo',
  login: process.env.MT5_LOGIN,
  password: process.env.MT5_PASSWORD
};

// اتصال Python script (درحال توسعه)
const PYTHON_SERVER = 'http://localhost:5001';

// ارسال سیگنال به MetaTrader 5
router.post('/send-signal', async (req, res) => {
  try {
    const { signal, entry, sl, tp1, tp2, tp3, volume } = req.body;

    // ارسال به Python script
    const response = await axios.post(`${PYTHON_SERVER}/execute-trade`, {
      signal: signal,
      entry: entry,
      stopLoss: sl,
      tp1: tp1,
      tp2: tp2,
      tp3: tp3,
      volume: volume,
      server: MT5_CONFIG.server,
      login: MT5_CONFIG.login
    }).catch(() => {
      return {
        data: {
          status: 'pending',
          message: 'Python Server در دسترس نیست'
        }
      };
    });

    res.json({
      message: '✅ سیگنال ارسال شد',
      status: response.data.status,
      details: response.data
    });

  } catch (error) {
    res.status(500).json({
      error: 'خطا در ارسال سیگنال',
      details: error.message
    });
  }
});

// دریافت قیمت فعلی طلا از MetaTrader
router.get('/current-price', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVER}/current-price`).catch(() => {
      return {
        data: {
          price: 0,
          status: 'unavailable'
        }
      };
    });

    res.json({
      price: response.data.price,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// دریافت موجودی حساب
router.get('/account-info/:uid', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVER}/account-info`).catch(() => {
      return {
        data: {
          balance: 0,
          equity: 0,
          freeMargin: 0,
          status: 'unavailable'
        }
      };
    });

    res.json({
      balance: response.data.balance,
      equity: response.data.equity,
      freeMargin: response.data.freeMargin,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// دریافت تاریخچه معاملات
router.get('/trades-history/:uid', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVER}/trades-history`).catch(() => {
      return {
        data: {
          trades: [],
          status: 'unavailable'
        }
      };
    });

    res.json({
      trades: response.data.trades || [],
      count: (response.data.trades || []).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
