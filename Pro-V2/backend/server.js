const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// بارگذاری متغیرهای محیطی
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Firebase Initialization
const admin = require('firebase-admin');
const firebaseConfig = require('./firebase-config');

if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig.adminConfig);
}

const db = admin.firestore();
const auth = admin.auth();

// Import Routes
const authRoutes = require('./routes/auth');
const signalRoutes = require('./routes/signals');
const performanceRoutes = require('./routes/performance');
const mt5Routes = require('./routes/mt5');

// Routes
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

// Error Handler
app.use((err, req, res, next) => {
  console.error('خطا:', err);
  res.status(500).json({
    error: 'خطای سرور',
    message: err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 GoldAI Backend شروع شد!`);
  console.log(`📍 آدرس: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, db, auth };
