// ============================================================
// فایل backend/server.js - سرور بک‌اند
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// مسیرهای API
// ============================================================

// ۱. دریافت داده‌های قیمت طلا
app.get('/api/gold/price', async (req, res) => {
    try {
        // در نسخه واقعی، از API استفاده می‌شود
        // اینجا داده‌های شبیه‌سازی‌شده
        const currentPrice = 1980 + Math.random() * 40;
        const change = (Math.random() - 0.5) * 0.02;
        
        res.json({
            success: true,
            data: {
                price: currentPrice,
                change: change * 100,
                timestamp: new Date().toISOString(),
                high: currentPrice * (1 + Math.random() * 0.005),
                low: currentPrice * (1 - Math.random() * 0.005),
                volume: Math.floor(Math.random() * 10000 + 5000)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ۲. دریافت داده‌های تاریخی
app.get('/api/gold/historical', async (req, res) => {
    try {
        const { period = '1d', limit = 100 } = req.query;
        
        // تولید داده‌های تاریخی شبیه‌سازی‌شده
        const data = [];
        let price = 1980;
        const now = new Date();
        
        for (let i = 0; i < limit; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - (limit - i));
            
            // شبیه‌سازی حرکت قیمت
            const trend = Math.random() * 0.002 - 0.001;
            const noise = (Math.random() - 0.5) * 0.01;
            price = price * (1 + trend + noise);
            
            data.push({
                date: date.toISOString(),
                open: price * (1 + (Math.random() - 0.5) * 0.002),
                high: price * (1 + Math.random() * 0.005),
                low: price * (1 - Math.random() * 0.005),
                close: price,
                volume: Math.floor(Math.random() * 10000 + 5000)
            });
        }
        
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ۳. تحلیل سیگنال
app.post('/api/analyze', async (req, res) => {
    try {
        const { prices, indicators } = req.body;
        
        if (!prices || prices.length < 50) {
            return res.status(400).json({
                success: false,
                error: 'داده‌های قیمتی کافی نیست'
            });
        }
        
        // اینجا تحلیل واقعی انجام می‌شود
        // فعلاً یک پاسخ شبیه‌سازی‌شده
        const signal = {
            action: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)],
            strength: Math.random() * 100,
            confidence: 50 + Math.random() * 40,
            layers: {
                score: { value: Math.random() * 100, weight: 0.35 },
                ai: { value: Math.random() * 100, weight: 0.35 },
                news: { value: Math.random() * 100, weight: 0.15 },
                trade: { value: Math.random() * 100, weight: 0.15 }
            }
        };
        
        res.json({
            success: true,
            data: signal
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ۴. بک‌تست
app.post('/api/backtest', async (req, res) => {
    try {
        const config = req.body;
        
        // شبیه‌سازی بک‌تست
        const totalTrades = Math.floor(Math.random() * 100 + 50);
        const winRate = 40 + Math.random() * 30;
        const totalReturn = (Math.random() - 0.3) * 50;
        
        res.json({
            success: true,
            data: {
                summary: {
                    totalTrades,
                    winRate,
                    totalReturn,
                    sharpeRatio: (Math.random() * 2 + 0.5),
                    maxDrawdown: Math.random() * 20 + 5
                },
                trades: [],
                equity: []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ۵. اخبار
app.get('/api/news', async (req, res) => {
    try {
        const mockNews = [
            { id: 1, title: 'افزایش نرخ بهره فدرال رزرو', impact: 'high', sentiment: 'negative', time: new Date().toISOString() },
            { id: 2, title: 'کاهش تنش‌های ژئوپلیتیکی', impact: 'medium', sentiment: 'positive', time: new Date().toISOString() },
            { id: 3, title: 'افزایش تقاضای طلا در آسیا', impact: 'high', sentiment: 'positive', time: new Date().toISOString() },
            { id: 4, title: 'قیمت نفت افزایش یافت', impact: 'low', sentiment: 'neutral', time: new Date().toISOString() }
        ];
        
        res.json({
            success: true,
            data: mockNews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ۶. وضعیت سیستم
app.get('/api/status', async (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'online',
            version: '2.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            layers: {
                score: { enabled: true, status: 'active' },
                ai: { enabled: true, status: 'active' },
                conflict: { enabled: true, status: 'active' },
                news: { enabled: true, status: 'active' },
                trade: { enabled: true, status: 'active' },
                fundamental: { enabled: false, status: 'disabled' },
                correlation: { enabled: false, status: 'disabled' }
            }
        }
    });
});

// ============================================================
// مسیرهای استاتیک (برای Frontend)
// ============================================================
app.use(express.static(path.join(__dirname, '..')));

// ============================================================
// مدیریت خطاها
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        success: false,
        error: 'خطای داخلی سرور',
        message: err.message
    });
});

// ============================================================
// راه‌اندازی سرور
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 GoldAI Trading System v2.0.0`);
    console.log(`📈 API endpoints:`);
    console.log(`   GET  /api/gold/price`);
    console.log(`   GET  /api/gold/historical`);
    console.log(`   POST /api/analyze`);
    console.log(`   POST /api/backtest`);
    console.log(`   GET  /api/news`);
    console.log(`   GET  /api/status`);
});

// صادر کردن برای تست
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
}
