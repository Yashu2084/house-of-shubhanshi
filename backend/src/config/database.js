// ==============================================================================
// HOUSE OF SHUBHANSHI — POSTGRESQL DATABASE CLIENT & POOL
// ==============================================================================
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('./env');

let pool = null;
let pgliteInstance = null;
let isPostgresConnected = false;
let isEmbeddedPostgres = false;

/**
 * Initialize Database Connection & Tables
 */
async function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Try standard PostgreSQL connection via pg.Pool
  if (env.DATABASE_URL && !env.DATABASE_URL.includes('embedded')) {
    try {
      const ssl = env.DATABASE_URL.includes('sslmode=require') || env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false;

      const testPool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl,
        connectionTimeoutMillis: 3000
      });

      // Test connectivity
      const testRes = await testPool.query('SELECT 1 as connected');
      if (testRes.rows && testRes.rows.length > 0) {
        pool = testPool;
        isPostgresConnected = true;
        isEmbeddedPostgres = false;
        console.log('[Database] \x1b[32m✔ PostgreSQL connected successfully via pg.Pool.\x1b[0m');

        // Execute schema
        await pool.query(schemaSql);
        await seedDatabase(pool);
        await migrateRentals(pool);
        return;
      }
    } catch (err) {
      console.warn(`[Database Notice] Could not connect to external PostgreSQL at ${env.DATABASE_URL}: ${err.message}`);
    }
  }

  // Gracefully fallback to embedded PostgreSQL (PGlite) so all real PostgreSQL SQL queries execute without external server
  try {
    const { PGlite } = require('@electric-sql/pglite');
    const dataDir = path.resolve(__dirname, '../../../.postgres_data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    pgliteInstance = new PGlite(dataDir);
    await pgliteInstance.waitReady;
    isPostgresConnected = true;
    isEmbeddedPostgres = true;
    console.log('[Database] \x1b[32m✔ PostgreSQL active via embedded engine (data: .postgres_data). Full SQL & transactions supported.\x1b[0m');

    // Execute schema
    await pgliteInstance.exec(schemaSql);
    await seedDatabase(pgliteInstance);
    await migrateRentals(pgliteInstance);
  } catch (embeddedErr) {
    console.error('[Database Error] Failed to initialize embedded PostgreSQL:', embeddedErr);
    isPostgresConnected = false;
  }
}

/**
 * Execute Parameterized SQL Query
 * @param {string} text - SQL Query with $1, $2 parameters
 * @param {Array} params - Parameter values
 */
async function query(text, params = []) {
  if (pool) {
    return pool.query(text, params);
  } else if (pgliteInstance) {
    return pgliteInstance.query(text, params);
  } else {
    throw new Error('Database is disconnected. Please check your PostgreSQL server or DATABASE_URL.');
  }
}

/**
 * Execute in Transaction
 * @param {Function} callback - async (client) => { ... }
 */
async function transaction(callback) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else if (pgliteInstance) {
    return pgliteInstance.transaction(async (tx) => {
      return callback(tx);
    });
  } else {
    throw new Error('Database is disconnected');
  }
}

/**
 * Test Connection
 */
async function testConnection() {
  try {
    const res = await query('SELECT 1 as num');
    return res && res.rows && res.rows.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Seed Database with Initial Admin, Patrons, Collections & Products
 */
async function seedDatabase(executor) {
  const bcrypt = require('bcryptjs');

  const checkUsers = await (executor.query ? executor.query('SELECT COUNT(*) as count FROM users') : executor.query('SELECT COUNT(*) as count FROM users'));
  const userCount = parseInt(checkUsers.rows[0].count, 10);

  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('[Database] Seeding initial House of Shubhanshi atelier catalog...');

  const adminPass = env.ADMIN_PASSWORD || 'Admin@Shubhanshi2026!';
  const adminHash = bcrypt.hashSync(adminPass, 10);
  const custHash = bcrypt.hashSync('Customer@2026', 10);

  const q = (text, params) => executor.query(text, params);

  // 1. Users
  await q(
    `INSERT INTO users (id, name, email, phone, password_hash, role, dob, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    ['usr_admin_01', env.ADMIN_NAME, env.ADMIN_EMAIL.toLowerCase(), env.ADMIN_PHONE, adminHash, 'ADMIN', '1995-01-01']
  );

  await q(
    `INSERT INTO users (id, name, email, phone, password_hash, role, dob, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    ['usr_cust_01', 'Yash Vardhan', 'yash@example.com', '+91 9876543210', custHash, 'CUSTOMER', '1998-05-14']
  );

  await q(
    `INSERT INTO users (id, name, email, phone, password_hash, role, dob, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    ['usr_cust_02', 'Ananya Sharma', 'ananya@example.com', '+91 9811223344', custHash, 'CUSTOMER', '2000-11-20']
  );

  // 2. Collections
  await q(
    `INSERT INTO collections (id, name, slug, description, image, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    ['col_01', 'The Heritage Edit', 'the-heritage-edit', 'Handcrafted zardozi, heirloom silks, and timeless royal silhouettes.', 'assets/images/collection/noor-set.jpg', true]
  );

  await q(
    `INSERT INTO collections (id, name, slug, description, image, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    ['col_02', 'The Royal Velvet Edit', 'the-royal-velvet-edit', 'Deep jewel tones with 300+ hours of marodi needlework.', 'assets/images/collection/shubh-lehenga.jpg', true]
  );

  await q(
    `INSERT INTO collections (id, name, slug, description, image, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    ['col_03', 'The Festive Soirée', 'the-festive-soiree', 'Luminous metallic tissue weaves and ethereal silhouettes.', 'assets/images/collection/zariya-edit.jpg', true]
  );

  // 3. Products
  await q(
    `INSERT INTO products (id, name, slug, description, price, compare_at_price, image, images, category, fabric, color, size, material, featured, stock, is_active, collection_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
    [
      'prod_01',
      'The Noor Set',
      'the-noor-set',
      'An ode to luminous celebrations. Tailored from handspun raw mulberry silk, featuring elaborate dabka, nakshi, and zardozi threadwork along the scalloped neckline and cuffs. Paired with a gossamer organza dupatta kissed with antique gold badla sprigs.',
      48500,
      54000,
      'assets/images/collection/noor-set.jpg',
      JSON.stringify(['assets/images/collection/noor-set.jpg']),
      'RAW SILK & ORGANZA',
      'Pure Raw Silk & Organza',
      'Warm Ivory with Antique Gold',
      'S, M, L, Bespoke',
      'Raw Mulberry Silk',
      true,
      12,
      true,
      'col_01'
    ]
  );

  await q(
    `INSERT INTO products (id, name, slug, description, price, compare_at_price, image, images, category, fabric, color, size, material, featured, stock, is_active, collection_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
    [
      'prod_02',
      'The Shubh Lehenga',
      'the-shubh-lehenga',
      'The defining silhouette of the House. A deep terracotta velvet ceremonial lehenga handwoven by master karigars with over 320 hours of intricate marodi and salma sitara needlework.',
      82000,
      95000,
      'assets/images/collection/shubh-lehenga.jpg',
      JSON.stringify(['assets/images/collection/shubh-lehenga.jpg']),
      'ROYAL VELVET COUTURE',
      'Micro-Velvet & Tissue Silk',
      'Deep Terracotta & Antique Gold',
      'S, M, L, Bespoke',
      'Royal Silk Velvet',
      true,
      6,
      true,
      'col_02'
    ]
  );

  await q(
    `INSERT INTO products (id, name, slug, description, price, compare_at_price, image, images, category, fabric, color, size, material, featured, stock, is_active, collection_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
    [
      'prod_03',
      'The Zariya Edit',
      'the-zariya-edit',
      'Lightweight opulence woven on traditional pit looms. Crafted from genuine antique gold metallic tissue with hand-embroidered resham and badla border accents.',
      36000,
      42000,
      'assets/images/collection/zariya-edit.jpg',
      JSON.stringify(['assets/images/collection/zariya-edit.jpg']),
      'HERITAGE DRAPE',
      'Pure Tissue Silk Saree',
      'Antique Gold & Champagne',
      'Free Size (5.5m + 1m Blouse)',
      'Tissue Silk Weave',
      true,
      15,
      true,
      'col_03'
    ]
  );

  await q(
    `INSERT INTO products (id, name, slug, description, price, compare_at_price, image, images, category, fabric, color, size, material, featured, stock, is_active, collection_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
    [
      'prod_04',
      'The Aabha Collection',
      'the-aabha-collection',
      'Regal flared anarkali ensemble in pure chanderi, adorned with delicate rose gold gota patti, fine sequin borders, and handcrafted potli tassels.',
      64000,
      72000,
      'assets/images/collection/aabha-collection.jpg',
      JSON.stringify(['assets/images/collection/aabha-collection.jpg']),
      'ROYAL RESHAM EDITION',
      'Handwoven Chanderi Silk',
      'Blush Terracotta & Rose Gold',
      'S, M, L, XL',
      'Pure Chanderi Silk',
      true,
      8,
      true,
      'col_01'
    ]
  );

  // 4. Sample Orders for Yash Vardhan
  await q(
    `INSERT INTO orders (id, order_number, user_id, total_amount, status, payment_status, shipping_address, phone, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')`,
    ['ord_sample_01', 'HS10001', 'usr_cust_01', 48500, 'DISPATCHED', 'PAID', '42, Gulmohar Enclave, New Delhi 110049', '+91 9876543210']
  );

  await q(
    `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '3 days')`,
    ['item_01', 'ord_sample_01', 'prod_01', 'The Noor Set', 1, 48500]
  );

  await q(
    `INSERT INTO orders (id, order_number, user_id, total_amount, status, payment_status, shipping_address, phone, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '14 days', NOW() - INTERVAL '10 days')`,
    ['ord_sample_02', 'HS10002', 'usr_cust_01', 36000, 'DELIVERED', 'PAID', '42, Gulmohar Enclave, New Delhi 110049', '+91 9876543210']
  );

  await q(
    `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '14 days')`,
    ['item_02', 'ord_sample_02', 'prod_03', 'The Zariya Edit', 1, 36000]
  );

  console.log('[Database] ✔ Initial seed completed successfully.');
}

/**
 * Ensure luxury garments have realistic rental configurations and sample rental data
 */
async function migrateRentals(executor) {
  const q = (text, params) => executor.query(text, params);

  try {
    // 1. Configure rental parameters for signature atelier pieces (allowing custom rentals up to 30 days)
    await q(`
      UPDATE products 
      SET is_rentable = true, 
          rental_base_price = 4500, 
          rental_price_per_day = 1200, 
          minimum_rental_days = 1, 
          maximum_rental_days = 30, 
          rental_deposit = 10000, 
          rental_available_stock = 3
      WHERE id = 'prod_01' AND (rental_base_price IS NULL OR rental_base_price = 0)
    `);

    await q(`
      UPDATE products 
      SET is_rentable = true, 
          rental_base_price = 8500, 
          rental_price_per_day = 2500, 
          minimum_rental_days = 2, 
          maximum_rental_days = 30, 
          rental_deposit = 20000, 
          rental_available_stock = 2
      WHERE id = 'prod_02' AND (rental_base_price IS NULL OR rental_base_price = 0)
    `);

    await q(`
      UPDATE products 
      SET is_rentable = true, 
          rental_base_price = 3500, 
          rental_price_per_day = 900, 
          minimum_rental_days = 1, 
          maximum_rental_days = 30, 
          rental_deposit = 8000, 
          rental_available_stock = 4
      WHERE id = 'prod_03' AND (rental_base_price IS NULL OR rental_base_price = 0)
    `);

    await q(`
      UPDATE products 
      SET maximum_rental_days = 30 
      WHERE maximum_rental_days IS NULL OR maximum_rental_days < 30
    `);

    // 2. Check if rentals table has rows; if empty, seed sample rentals for patron Yash Vardhan
    const countRes = await q('SELECT COUNT(*) as count FROM rentals');
    const rentalCount = parseInt(countRes.rows[0].count, 10);

    if (rentalCount === 0) {
      console.log('[Database] Seeding sample rental reservations...');

      // Sample 1: Upcoming Active/Reserved Rental for Yash Vardhan (The Noor Set)
      const ordRental1 = 'ord_rnt_01';
      const itemRental1 = 'item_rnt_01';
      const rnt1 = 'rnt_001';

      await q(
        `INSERT INTO orders (id, order_number, user_id, total_amount, rental_deposit_total, status, payment_status, shipping_address, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '1 day', NOW())
         ON CONFLICT (id) DO NOTHING`,
        [ordRental1, 'HS10003', 'usr_cust_01', 16900, 10000, 'RECEIVED', 'PAID', '42, Gulmohar Enclave, New Delhi 110049', '+91 9876543210']
      );

      await q(
        `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, purchase_type, rental_days, rental_start_date, rental_end_date, rental_price, security_deposit, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '4 days', $9, $10, NOW() - INTERVAL '1 day')
         ON CONFLICT (id) DO NOTHING`,
        [itemRental1, ordRental1, 'prod_01', 'The Noor Set (Rental - 3 Days)', 1, 6900, 'RENT', 3, 6900, 10000]
      );

      await q(
        `INSERT INTO rentals (id, order_id, order_item_id, product_id, user_id, start_date, end_date, rental_days, rental_price, security_deposit, status, deposit_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '4 days', $6, $7, $8, 'RESERVED', 'HELD', NOW() - INTERVAL '1 day', NOW())
         ON CONFLICT (id) DO NOTHING`,
        [rnt1, ordRental1, itemRental1, 'prod_01', 'usr_cust_01', 3, 6900, 10000]
      );

      // Sample 2: Completed / Returned Rental for Yash Vardhan (The Zariya Edit)
      const ordRental2 = 'ord_rnt_02';
      const itemRental2 = 'item_rnt_02';
      const rnt2 = 'rnt_002';

      await q(
        `INSERT INTO orders (id, order_number, user_id, total_amount, rental_deposit_total, status, payment_status, shipping_address, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days')
         ON CONFLICT (id) DO NOTHING`,
        [ordRental2, 'HS10004', 'usr_cust_01', 13300, 8000, 'DELIVERED', 'PAID', '42, Gulmohar Enclave, New Delhi 110049', '+91 9876543210']
      );

      await q(
        `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, purchase_type, rental_days, rental_start_date, rental_end_date, rental_price, security_deposit, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '16 days', $9, $10, NOW() - INTERVAL '20 days')
         ON CONFLICT (id) DO NOTHING`,
        [itemRental2, ordRental2, 'prod_03', 'The Zariya Edit (Rental - 3 Days)', 1, 5300, 'RENT', 3, 5300, 8000]
      );

      await q(
        `INSERT INTO rentals (id, order_id, order_item_id, product_id, user_id, start_date, end_date, rental_days, rental_price, security_deposit, status, returned_at, refund_amount, deposit_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '16 days', $6, $7, $8, 'RETURNED', NOW() - INTERVAL '16 days', 8000, 'REFUNDED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '16 days')
         ON CONFLICT (id) DO NOTHING`,
        [rnt2, ordRental2, itemRental2, 'prod_03', 'usr_cust_01', 3, 5300, 8000]
      );

      console.log('[Database] ✔ Rental seed completed.');
    }
  } catch (err) {
    console.warn('[Database Notice] migrateRentals notice:', err.message);
  }
}

module.exports = {
  query,
  transaction,
  initDb,
  testConnection,
  get isPostgresConnected() {
    return isPostgresConnected;
  },
  get isEmbeddedPostgres() {
    return isEmbeddedPostgres;
  }
};
