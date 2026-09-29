// ==============================================================================
// HOUSE OF SHUBHANSHI — FULL-STACK CONSOLIDATED SERVER
// Single Host: Express + Static Frontend + /api/* + PostgreSQL (pg)
// ==============================================================================
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const collectionRoutes = require('./routes/collection.routes');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const adminRoutes = require('./routes/admin.routes');
const rentalRoutes = require('./routes/rental.routes');

const app = express();

// Middleware: CORS (Allows same-origin and credentials)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware: Body & Cookie Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files: Serve Frontend public assets (images, videos, logo, etc.)
const frontendPublicDir = path.resolve(__dirname, '../../frontend/public');
app.use(express.static(frontendPublicDir));
app.use('/assets', express.static(path.join(frontendPublicDir, 'assets')));
app.use('/images', express.static(path.join(frontendPublicDir, 'images')));
app.use('/videos', express.static(path.join(frontendPublicDir, 'videos')));
app.use('/logo', express.static(path.join(frontendPublicDir, 'logo')));
app.use('/icons', express.static(path.join(frontendPublicDir, 'icons')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rentals', rentalRoutes);

// Health Check Endpoint (Actively tests PostgreSQL connectivity)
app.get('/api/health', async (req, res) => {
  const isDbConnected = await db.testConnection();
  if (isDbConnected) {
    return res.status(200).json({
      success: true,
      message: 'House of Shubhanshi backend is running',
      database: 'connected'
    });
  } else {
    return res.status(503).json({
      success: false,
      message: 'House of Shubhanshi backend is running',
      database: 'disconnected'
    });
  }
});

// Root & Page Redirection to Next.js Frontend (Port 3000)
app.get('/', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${frontendUrl}/" />
  <title>House of Shubhanshi</title>
  <style>
    body {
      background: #3B1D14;
      color: #FDFBF7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      border: 1px solid rgba(201, 160, 74, 0.4);
      padding: 40px;
      max-width: 520px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h1 { color: #C9A04A; font-family: serif; margin-bottom: 8px; font-size: 26px; }
    p { line-height: 1.6; color: #E8D8C8; font-size: 15px; margin: 12px 0; }
    a.btn {
      display: inline-block;
      margin-top: 18px;
      padding: 12px 28px;
      background: #C9A04A;
      color: #3B1D14;
      text-decoration: none;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-size: 13px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:inline-block;padding:4px 12px;background:rgba(201,160,74,0.15);color:#C9A04A;border:1px solid #C9A04A;border-radius:20px;font-size:12px;margin-bottom:16px;">
      Backend API & Database Active (Port 3001)
    </div>
    <h1>House of Shubhanshi</h1>
    <p>The backend API server and PostgreSQL database are online.</p>
    <p>Redirecting to the Next.js luxury storefront at <a href="${frontendUrl}" style="color: #C9A04A;">${frontendUrl}</a>...</p>
    <a class="btn" href="${frontendUrl}">Open Storefront</a>
    <script>window.location.replace("${frontendUrl}");</script>
  </div>
</body>
</html>`);
});

app.get('/:page', (req, res, next) => {
  if (req.params.page.startsWith('api')) return next();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return res.redirect(`${frontendUrl}/${req.params.page}`);
});

// Global Centralized Error Handler (Clean JSON, no leaked credentials/stacks)
app.use(errorHandler);

// Start Server
async function startServer(portToUse = env.PORT) {
  // 1. Initialize & Verify Database Connectivity
  await db.initDb();

  const isConnected = await db.testConnection();
  if (!isConnected) {
    console.error(`
\x1b[31m==================================================
CRITICAL: Database connection failed!
Server cannot start without database connectivity.
Please verify your PostgreSQL service or DATABASE_URL.
==================================================\x1b[0m
    `);
    process.exit(1);
  }

  // 2. Start Express Application
  const server = app.listen(portToUse, () => {
    console.log(`
\x1b[38;2;201;160;74m==================================================
 HOUSE OF SHUBHANSHI — LUXURY ATELIER & STOREFRONT
==================================================\x1b[0m
  \x1b[1mBackend API:\x1b[0m     http://localhost:${portToUse}
  \x1b[1mFrontend UI:\x1b[0m     http://localhost:3000
  \x1b[1mHealth Check:\x1b[0m    http://localhost:${portToUse}/api/health
  \x1b[1mDatabase:\x1b[0m        Connected (PostgreSQL)
\x1b[38;2;201;160;74m==================================================\x1b[0m
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\x1b[33m[Server Notice] Port ${portToUse} is in use. Attempting fallback port ${Number(portToUse) + 1}...\x1b[0m`);
      const nextPort = Number(portToUse) + 1;
      const fallbackServer = app.listen(nextPort, () => {
        console.log(`
\x1b[38;2;201;160;74m==================================================
 HOUSE OF SHUBHANSHI — LUXURY ATELIER & STOREFRONT
==================================================\x1b[0m
  \x1b[1mBackend API:\x1b[0m     http://localhost:${nextPort}
  \x1b[1mFrontend UI:\x1b[0m     http://localhost:3000
  \x1b[1mHealth Check:\x1b[0m    http://localhost:${nextPort}/api/health
  \x1b[1mDatabase:\x1b[0m        Connected (PostgreSQL)
\x1b[38;2;201;160;74m==================================================\x1b[0m
        `);
      });
      fallbackServer.on('error', (fErr) => {
        console.error(`\x1b[31m[Server Error] Could not bind to port ${nextPort}: ${fErr.message}\x1b[0m`);
      });
    } else {
      console.error('[Server Error]', err);
    }
  });
}

if (require.main === module) {
  startServer();
}

app.startServer = startServer;
module.exports = app;

