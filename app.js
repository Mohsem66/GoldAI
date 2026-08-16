// ============================================================
// فایل js/app.js - نسخه کامل و نهایی
// ============================================================

// ============================================================
// بخش ۱: متغیرهای سراسری
// ============================================================
let currentPrice = 0;
let priceHistory = [];
let currentSignal = { action: 'HOLD', strength: 0, confidence: 0 };
let layersData = {};
let newsData = [];
let chartInstance = null;
let updateInterval = null;

// ============================================================
// بخش ۲: مقداردهی اولیه
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 GoldAI v2.0 شروع به کار کرد');
    
    // تنظیم event listeners
    setupEventListeners();
    
    // دریافت داده‌های اولیه
    fetchInitialData();
    
    // شروع آپدیت خودکار
    startAutoUpdate();
    
    // نمایش وضعیت لایه‌ها
    updateLayerStatus();
});

// ============================================================
// بخش ۳: Event Listeners
// ============================================================
function setupEventListeners() {
    // دکمه‌های ناوبری
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
    
    // فرم بک‌تست
    const backtestForm = document.getElementById('backtest-form');
    if (backtestForm) {
        backtestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            runBacktestFromForm();
        });
    }
    
    // تنظیمات ریسک
    const riskSlider = document.getElementById('risk-per-trade');
    if (riskSlider) {
        riskSlider.addEventListener('input', function() {
            document.getElementById('risk-value').textContent = this.value + '%';
        });
    }
}

// ============================================================
// بخش ۴: دریافت داده‌ها
// ============================================================
async function fetchInitialData() {
    try {
        // دریافت قیمت
        await fetchPrice();
        
        // دریافت داده‌های تاریخی
        await fetchHistoricalData();
        
        // دریافت تحلیل
        await fetchAnalysis();
        
        // دریافت اخبار
        await fetchNews();
        
        // دریافت وضعیت سیستم
        await fetchSystemStatus();
        
    } catch (error) {
        console.error('❌ خطا در دریافت داده‌های اولیه:', error);
        showError('خطا در دریافت داده‌ها');
    }
}

// ============================================================
// بخش ۵: دریافت قیمت
// ============================================================
async function fetchPrice() {
    try {
        const response = await fetch('/api/gold/price');
        const result = await response.json();
        
        if (result.success && result.data) {
            currentPrice = result.data.price;
            updatePriceDisplay(result.data);
        }
    } catch (error) {
        console.error('❌ خطا در دریافت قیمت:', error);
        // استفاده از داده‌های شبیه‌سازی‌شده
        simulatePrice();
    }
}

function simulatePrice() {
    // شبیه‌سازی قیمت برای نمایش
    currentPrice = 1980 + Math.random() * 40;
    const change = (Math.random() - 0.5) * 0.02;
    
    updatePriceDisplay({
        price: currentPrice,
        change: change * 100,
        timestamp: new Date().toISOString()
    });
}

function updatePriceDisplay(data) {
    const priceEl = document.getElementById('current-price');
    const changeEl = document.getElementById('price-change');
    const timeEl = document.getElementById('last-update');
    
    if (priceEl) {
        priceEl.textContent = `$${data.price.toFixed(2)}`;
    }
    
    if (changeEl && data.change !== undefined) {
        changeEl.textContent = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`;
        changeEl.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (timeEl && data.timestamp) {
        const date = new Date(data.timestamp);
        timeEl.textContent = `آخرین به‌روزرسانی: ${date.toLocaleTimeString('fa-IR')}`;
    }
}

// ============================================================
// بخش ۶: دریافت داده‌های تاریخی
// ============================================================
async function fetchHistoricalData() {
    try {
        const response = await fetch('/api/gold/historical?limit=100');
        const result = await response.json();
        
        if (result.success && result.data) {
            priceHistory = result.data;
            renderChart(priceHistory);
        }
    } catch (error) {
        console.error('❌ خطا در دریافت داده‌های تاریخی:', error);
        // استفاده از داده‌های شبیه‌سازی‌شده
        priceHistory = generateMockData();
        renderChart(priceHistory);
    }
}

function generateMockData() {
    const data = [];
    let price = 1980;
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
        const date = new Date(now);
        date.setMinutes(date.getMinutes() - (100 - i) * 5);
        
        const trend = Math.random() * 0.002 - 0.001;
        const noise = (Math.random() - 0.5) * 0.01;
        price = price * (1 + trend + noise);
        
        data.push({
            date: date,
            close: price,
            high: price * (1 + Math.random() * 0.005),
            low: price * (1 - Math.random() * 0.005),
            open: price * (1 + (Math.random() - 0.5) * 0.002)
        });
    }
    
    return data;
}

// ============================================================
// بخش ۷: دریافت تحلیل
// ============================================================
async function fetchAnalysis() {
    try {
        const prices = priceHistory.map(d => d.close);
        if (prices.length < 50) {
            console.warn('⚠️ داده‌های قیمتی کافی نیست');
            return;
        }
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prices })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            currentSignal = result.data;
            updateSignalDisplay(result.data);
            
            // به‌روزرسانی لایه‌ها
            if (result.data.layers) {
                layersData = result.data.layers;
                updateLayersDisplay(result.data.layers);
            }
        }
    } catch (error) {
        console.error('❌ خطا در دریافت تحلیل:', error);
        // استفاده از سیگنال شبیه‌سازی‌شده
        simulateSignal();
    }
}

function simulateSignal() {
    const actions = ['BUY', 'SELL', 'HOLD'];
    const action = actions[Math.floor(Math.random() * 3)];
    const strength = 40 + Math.random() * 50;
    const confidence = 50 + Math.random() * 40;
    
    currentSignal = { action, strength, confidence };
    updateSignalDisplay(currentSignal);
    
    // لایه‌های شبیه‌سازی‌شده
    const layers = {
        score: { value: 40 + Math.random() * 50, weight: 0.35, status: 'active' },
        ai: { value: 40 + Math.random() * 50, weight: 0.35, status: 'active' },
        news: { value: 40 + Math.random() * 50, weight: 0.15, status: 'active' },
        trade: { value: 40 + Math.random() * 50, weight: 0.15, status: 'active' },
        fundamental: { value: 0, weight: 0, status: 'disabled' },
        correlation: { value: 0, weight: 0, status: 'disabled' }
    };
    
    layersData = layers;
    updateLayersDisplay(layers);
}

function updateSignalDisplay(signal) {
    const statusEl = document.getElementById('signal-status');
    const strengthEl = document.getElementById('signal-strength');
    const confidenceEl = document.getElementById('signal-confidence');
    
    if (statusEl) {
        statusEl.textContent = signal.action || 'HOLD';
        statusEl.className = `signal-status signal-${(signal.action || 'hold').toLowerCase()}`;
    }
    
    if (strengthEl) {
        strengthEl.textContent = `${(signal.strength || 0).toFixed(1)}%`;
    }
    
    if (confidenceEl) {
        confidenceEl.textContent = `${(signal.confidence || 0).toFixed(1)}%`;
    }
}

// ============================================================
// بخش ۸: نمایش لایه‌ها
// ============================================================
function updateLayersDisplay(layers) {
    const grid = document.getElementById('layers-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const layerNames = {
        score: 'اسکور',
        ai: 'هوش مصنوعی',
        conflict: 'فیلتر تعارض',
        news: 'اخبار',
        trade: 'مدیریت معامله',
        fundamental: 'فاندامنتال',
        correlation: 'همبستگی'
    };
  const layerColors = {
        score: '#4caf50',
        ai: '#42a5f5',
        conflict: '#ff9800',
        news: '#9c27b0',
        trade: '#f44336',
        fundamental: '#888',
        correlation: '#888'
    };
    
    Object.keys(layers).forEach(key => {
        const layer = layers[key];
        const isActive = layer.status !== 'disabled';
        const value = layer.value || 0;
        
        const item = document.createElement('div');
        item.className = `layer-item ${!isActive ? 'disabled' : ''}`;
        
        item.innerHTML = `
            <div class="layer-name">
                ${layerNames[key] || key}
                ${!isActive ? '<span style="color:#f44336;font-size:0.7rem;"> (غیرفعال)</span>' : ''}
            </div>
            <div class="layer-value">${isActive ? value.toFixed(1) + '%' : 'غیرفعال'}</div>
            <div class="layer-bar">
                <div class="fill" style="width: ${isActive ? value : 0}%; background: ${isActive ? layerColors[key] || '#f0b90b' : '#333'};"></div>
            </div>
            <div style="font-size:0.7rem;color:#556677;margin-top:5px;">
                وزن: ${(layer.weight || 0).toFixed(2)}
            </div>
        `;
        
        grid.appendChild(item);
    });
}

function updateLayerStatus() {
    // به‌روزرسانی وضعیت لایه‌ها از تنظیمات
    const layers = {
        fundamental: { enabled: false },
        correlation: { enabled: false }
    };
    
    // نمایش در کنسول
    console.log('📊 وضعیت لایه‌ها:', layers);
}

// ============================================================
// بخش ۹: دریافت اخبار
// ============================================================
async function fetchNews() {
    try {
        const response = await fetch('/api/news');
        const result = await response.json();
        
        if (result.success && result.data) {
            newsData = result.data;
            updateNewsDisplay(result.data);
        }
    } catch (error) {
        console.error('❌ خطا در دریافت اخبار:', error);
        // استفاده از اخبار شبیه‌سازی‌شده
        const mockNews = [
            { id: 1, title: 'افزایش نرخ بهره فدرال رزرو', impact: 'high', sentiment: 'negative', time: new Date().toISOString() },
            { id: 2, title: 'کاهش تنش‌های ژئوپلیتیکی', impact: 'medium', sentiment: 'positive', time: new Date().toISOString() },
            { id: 3, title: 'افزایش تقاضای طلا در آسیا', impact: 'high', sentiment: 'positive', time: new Date().toISOString() }
        ];
        newsData = mockNews;
        updateNewsDisplay(mockNews);
    }
}

function updateNewsDisplay(news) {
    const list = document.getElementById('news-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!news || news.length === 0) {
        list.innerHTML = '<div style="color:#556677;text-align:center;padding:20px;">هیچ خبری یافت نشد</div>';
        return;
    }
    
    news.forEach(item => {
        const div = document.createElement('div');
        div.className = 'news-item';
        
        const impactColors = {
            high: '#f44336',
            medium: '#ff9800',
            low: '#4caf50'
        };
        
        const sentimentIcons = {
            positive: '👍',
            negative: '👎',
            neutral: '😐'
        };
        
        div.innerHTML = `
            <span class="impact ${item.impact}">${item.impact}</span>
            <span class="title">${item.title}</span>
            <span class="sentiment ${item.sentiment}">${sentimentIcons[item.sentiment] || '😐'}</span>
            <span style="font-size:0.7rem;color:#556677;">
                ${new Date(item.time).toLocaleTimeString('fa-IR')}
            </span>
        `;
        
        list.appendChild(div);
    });
}

// ============================================================
// بخش ۱۰: دریافت وضعیت سیستم
// ============================================================
async function fetchSystemStatus() {
    try {
        const response = await fetch('/api/status');
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ وضعیت سیستم:', result.data);
            updateSystemStatus(result.data);
        }
    } catch (error) {
        console.error('❌ خطا در دریافت وضعیت سیستم:', error);
    }
}

function updateSystemStatus(status) {
    const dot = document.querySelector('.status-dot');
    const label = document.querySelector('.status-bar span:last-child');
    
    if (dot && status.status === 'online') {
        dot.className = 'status-dot online';
        if (label) label.textContent = 'سیستم فعال';
    }
}

// ============================================================
// بخش ۱۱: رندر چارت
// ============================================================
function renderChart(data) {
    const canvas = document.getElementById('price-chart');
    if (!canvas) return;
    
    // اگر چارت قبلی وجود داشت، حذفش کن
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    // داده‌های چارت
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    });
    
    const prices = data.map(d => d.close);
    
    // ایجاد چارت جدید
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'قیمت طلا (XAU/USD)',
                data: prices,
                borderColor: '#f0b90b',
                backgroundColor: 'rgba(240, 185, 11, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#8899aa'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    },
                    ticks: {
                        color: '#556677',
                        maxTicksLimit: 20
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    },
                    ticks: {
                        color: '#556677'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// ============================================================
// بخش ۱۲: بک‌تست
// ============================================================
async function runBacktestFromForm() {
    const form = document.getElementById('backtest-form');
    const resultsDiv = document.getElementById('backtest-results');
    
    if (!form || !resultsDiv) return;
    
    const formData = new FormData(form);
    const config = {
        initialCapital: parseFloat(formData.get('initial-capital')) || 10000,
        startDate: formData.get('start-date') || '2024-01-01',
        endDate: formData.get('end-date') || '2024-12-31',
        spread: parseFloat(formData.get('spread')) || 0.0003,
        slippage: parseFloat(formData.get('slippage')) || 0.0001
    };
    
    // نمایش لودینگ
    resultsDiv.innerHTML = '<div class="loading"></div><p style="text-align:center;margin-top:10px;">در حال اجرای بک‌تست...</p>';
    
    try {
        const response = await fetch('/api/backtest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            displayBacktestResults(result.data, resultsDiv);
        } else {
            resultsDiv.innerHTML = `<div class="error-message show">خطا: ${result.error || 'نامشخص'}</div>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<div class="error-message show">خطا در ارتباط با سرور: ${error.message}</div>`;
    }
}

function displayBacktestResults(data, container) {
    const summary = data.summary || {};
    
    container.innerHTML = `
        <h4 style="color:#f0b90b;margin-bottom:15px;">📊 نتایج بک‌تست</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;">
            <div style="background:#0a0e17;padding:15px;border-radius:8px;text-align:center;">
                <div style="color:#556677;font-size:0.8rem;">سرمایه نهایی</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#f0b90b;">
                    $${(summary.finalCapital || 0).toFixed(2)}
                </div>
            </div>
            <div style="background:#0a0e17;padding:15px;border-radius:8px;text-align:center;">
                <div style="color:#556677;font-size:0.8rem;">بازده کل</div>
                <div style="font-size:1.5rem;font-weight:bold;color:${(summary.totalReturn || 0) >= 0 ? '#4caf50' : '#f44336'};">
                    ${(summary.totalReturn || 0).toFixed(2)}%
                </div>
            </div>
            <div style="background:#0a0e17;padding:15px;border-radius:8px;text-align:center;">
                <div style="color:#556677;font-size:0.8rem;">تعداد معاملات</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#e0e6ed;">
                    ${summary.totalTrades || 0}
                </div>
            </div>
            <div style="background:#0a0e17;padding:15px;border-radius:8px;text-align:center;">
                <div style="color:#556677;font-size:0.8rem;">نرخ برد</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#42a5f5;">
                    ${(summary.winRate || 0).toFixed(1)}%
                </div>
            </div>
            <div style="background:#0a0e17;padding:15px;border-radius:8px;text-align:center;">
                <div style="color:#556677;font-size:0.8rem;">Sharp Ratio</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#9c27b0;">
                    ${(summary.sharpeRatio || 0).toFixed(2)}
                </div>
            </div>
            <div style="background:#0a0e17;padding:15px;border-radius:8px;text-align:center;">
                <div style="color:#556677;font-size:0.8rem;">حداکثر ضرر</div>
                <div style="font-size:1.5rem;font-weight:bold;color:#f44336;">
                    ${(summary.maxDrawdown || 0).toFixed(2)}%
                </div>
            </div>
        </div>
        <div style="margin-top:15px;font-size:0.8rem;color:#556677;text-align:center;">
            اسپرد: ${(data.config?.spread || 0.0003).toFixed(4)} | Slippage: ${(data.config?.slippage || 0.0001).toFixed(4)}
        </div>
    `;
}

// ============================================================
// بخش ۱۳: آپدیت خودکار
// ============================================================
function startAutoUpdate() {
    // آپدیت هر ۵ ثانیه
    updateInterval = setInterval(() => {
        fetchPrice();
        fetchAnalysis();
        fetchNews();
    }, 5000);
    
    console.log('🔄 آپدیت خودکار شروع شد (هر ۵ ثانیه)');
}

// ============================================================
// بخش ۱۴: تغییر تب
// ============================================================
function switchTab(tabId) {
    // مخفی کردن همه تب‌ها
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // نمایش تب انتخاب شده
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.classList.add('active');
    }
    
    // به‌روزرسانی دکمه‌ها
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });
    
    // اگر تب بک‌تست است، چارت را رندر مجدد کن
    if (tabId === 'backtest' && priceHistory.length > 0) {
        renderChart(priceHistory);
    }
}

// ============================================================
// بخش ۱۵: نمایش خطا
// ============================================================
function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = `⚠️ ${message}`;
        errorEl.className = 'error-message show';
        
        setTimeout(() => {
            errorEl.className = 'error-message';
        }, 5000);
    }
}

// ============================================================
// بخش ۱۶: صادر کردن (برای تست)
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchPrice,
        fetchAnalysis,
        fetchNews,
        runBacktestFromForm,
        renderChart,
        switchTab
    };
}

console.log('✅ GoldAI v2.0 آماده کار است!');
