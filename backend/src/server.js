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

// Static Files: Serve Frontend directly from /frontend
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

// Also serve /assets directly from frontend/assets
app.use('/assets', express.static(path.join(frontendDir, 'assets')));

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

// Fallback HTML routing for clean URLs if requested without .html
app.get('/:page', (req, res, next) => {
  const pageFile = path.join(frontendDir, `${req.params.page}.html`);
  res.sendFile(pageFile, (err) => {
    if (err) next();
  });
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
House of Shubhanshi
Server running on:
http://localhost:${portToUse}

Database:
Connected
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\x1b[33m[Server Notice] Port ${portToUse} is in use. Attempting fallback port ${Number(portToUse) + 1}...\x1b[0m`);
      const nextPort = Number(portToUse) + 1;
      const fallbackServer = app.listen(nextPort, () => {
        console.log(`
House of Shubhanshi
Server running on:
http://localhost:${nextPort}

Database:
Connected
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

