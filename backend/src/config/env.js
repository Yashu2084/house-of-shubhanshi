// ==============================================================================
// HOUSE OF SHUBHANSHI — ENVIRONMENT CONFIGURATION
// ==============================================================================
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (Checks root .env first, then backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/house_of_shubhanshi?schema=public';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'house_of_shubhanshi_default_secure_secret_2026');

if (!JWT_SECRET) {
  const errMsg = '[Configuration Error] JWT_SECRET environment variable is missing. Authentication cannot function securely.';
  if (NODE_ENV === 'production') {
    throw new Error(errMsg);
  } else {
    console.warn(`\x1b[33m${errMsg}\x1b[0m`);
  }
}

module.exports = {
  PORT,
  NODE_ENV,
  FRONTEND_URL,
  DATABASE_URL,
  JWT_SECRET: JWT_SECRET || 'house_of_shubhanshi_default_secure_secret_2026',
  COOKIE_EXPIRES_IN_MS: parseInt(process.env.COOKIE_EXPIRES_IN_MS || '604800000', 10), // 7 days
  ADMIN_NAME: process.env.ADMIN_NAME || 'House of Shubhanshi Atelier',
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@houseofshubhanshi.com').toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@Shubhanshi2026!',
  ADMIN_PHONE: process.env.ADMIN_PHONE || '+91 9560011351'
};
