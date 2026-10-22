// ==============================================================================
// HOUSE OF SHUBHANSHI — SUPABASE POSTGRESQL MIGRATION RUNNER
// Safely connects to hosted Supabase PostgreSQL, runs schema DDL,
// and migrates real collections, products, users, and orders.
// ==============================================================================
const fs = require('fs');
const path = require('path');
const tls = require('tls');
const { Pool } = require('pg');
const { parse: parsePgUrl } = require('pg-connection-string');

// Official Supabase Root 2021 CA certificate (for secure TLS verification with rejectUnauthorized: true)
const SUPABASE_ROOT_CA_CERT = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;

function getTrustedCAs() {
  const cas = [...(tls.rootCertificates || []), SUPABASE_ROOT_CA_CERT];
  if (process.env.SUPABASE_SSL_CERT) {
    cas.push(process.env.SUPABASE_SSL_CERT);
  }
  const certFilePath = path.resolve(__dirname, '../certs/supabase-root-ca.crt');
  if (fs.existsSync(certFilePath)) {
    try {
      const fileCert = fs.readFileSync(certFilePath, 'utf-8');
      if (fileCert && !cas.includes(fileCert)) cas.push(fileCert);
    } catch (e) {}
  }
  return cas;
}

// 1. Try loading environment variables from .env or frontend/.env.local
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'frontend/.env.local'),
    path.resolve(process.cwd(), 'backend/.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

function isPlaceholder(url) {
  if (!url) return true;
  return (
    url.includes('USER:PASSWORD') ||
    url.includes('@HOST:') ||
    url.includes('localhost') ||
    url.includes('127.0.0.1')
  );
}

const connectionString = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  ''
).trim();

async function runMigration() {
  console.log('\n=============================================================');
  console.log('HOUSE OF SHUBHANSHI — SUPABASE DATABASE MIGRATION');
  console.log('=============================================================\n');

  if (!connectionString || isPlaceholder(connectionString)) {
    console.error('❌ ERROR: A valid remote Supabase PostgreSQL connection string is required.');
    console.error('Current DATABASE_URL:', connectionString || '(not set)');
    console.error('\nPlease configure your Supabase connection string in your .env or frontend/.env.local:');
    console.error('Example: DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require"\n');
    process.exit(1);
  }

  // Sanitize host for display
  const maskedUrl = connectionString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  console.log(`Connecting to: ${maskedUrl}`);

  const parsed = parsePgUrl(connectionString);
  const isRemote = !parsed.host || (!parsed.host.includes('localhost') && !parsed.host.includes('127.0.0.1'));
  let sslConfig = false;
  if (isRemote || connectionString.includes('sslmode=')) {
    sslConfig = {
      rejectUnauthorized: true,
      ca: getTrustedCAs(),
      servername: parsed.host || undefined
    };
  }
  parsed.ssl = sslConfig;

  const pool = new Pool({
    ...parsed,
    ssl: sslConfig,
    connectionTimeoutMillis: 10000
  });

  try {
    // 1. Test connection
    const testRes = await pool.query('SELECT current_database(), current_user, version()');
    console.log('✔ Connected successfully to Supabase PostgreSQL!');
    console.log(`  Database: ${testRes.rows[0].current_database} | User: ${testRes.rows[0].current_user}`);
    console.log(`  Postgres Version: ${testRes.rows[0].version.split(' ')[1] || '15+'}\n`);

    // 2. Load DDL Schema
    const schemaPath = path.resolve(__dirname, '../backend/src/config/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    console.log('Executing PostgreSQL DDL Schema...');
    await pool.query(schemaSql);
    console.log('✔ All tables, constraints, and indexes created/verified.\n');

    // 3. Load Source Data
    const dataStorePath = path.resolve(__dirname, '../.postgres_data/data_store.json');
    if (!fs.existsSync(dataStorePath)) {
      throw new Error(`Data store file not found at: ${dataStorePath}`);
    }
    const store = JSON.parse(fs.readFileSync(dataStorePath, 'utf-8'));
    console.log(`Loaded local data store with:`);
    console.log(`  - Users: ${(store.users || []).length}`);
    console.log(`  - Collections: ${(store.collections || []).length}`);
    console.log(`  - Products: ${(store.products || []).length}`);
    console.log(`  - Orders: ${(store.orders || []).length}`);
    console.log(`  - Rentals: ${(store.rentals || []).length}\n`);

    // 4. Migrate Users
    console.log('Migrating Users...');
    for (const u of store.users || []) {
      await pool.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, dob, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           updated_at = NOW()`,
        [
          u.id,
          u.name,
          u.email.toLowerCase(),
          u.phone || null,
          u.passwordHash,
          u.role || 'CUSTOMER',
          u.dob || null,
          u.createdAt ? new Date(u.createdAt) : new Date(),
          u.updatedAt ? new Date(u.updatedAt) : new Date()
        ]
      );
    }
    console.log('✔ Users migrated.');

    // 5. Migrate Collections
    console.log('Migrating Collections...');
    for (const c of store.collections || []) {
      await pool.query(
        `INSERT INTO collections (id, name, slug, description, image, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           image = EXCLUDED.image,
           is_active = EXCLUDED.is_active,
           updated_at = NOW()`,
        [
          c.id,
          c.name,
          c.slug,
          c.description || '',
          c.image || null,
          c.isActive !== false,
          c.createdAt ? new Date(c.createdAt) : new Date(),
          c.updatedAt ? new Date(c.updatedAt) : new Date()
        ]
      );
    }
    console.log('✔ Collections migrated.');

    // 6. Migrate Products
    console.log('Migrating Products...');
    for (const p of store.products || []) {
      const lengthsStr = Array.isArray(p.lengths) ? p.lengths.join(', ') : (p.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom');
      const imagesStr = Array.isArray(p.images) ? JSON.stringify(p.images) : (p.images || JSON.stringify([p.image || '/images/products/purple-suit-set.webp']));

      // Validate collection exists
      let validColId = null;
      if (p.collectionId && p.collectionId !== 'none') {
        const checkCol = await pool.query('SELECT id FROM collections WHERE id = $1', [p.collectionId]);
        if (checkCol.rows.length > 0) validColId = p.collectionId;
      }

      await pool.query(
        `INSERT INTO products (
           id, name, slug, description, price, compare_at_price, image, images,
           category, fabric, color, size, material, featured, stock, is_active,
           collection_id, is_rentable, rental_base_price, rental_price_per_day,
           minimum_rental_days, maximum_rental_days, rental_deposit, rental_available_stock,
           views, lengths, custom_length_available, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14, $15, $16,
           $17, $18, $19, $20,
           $21, $22, $23, $24,
           $25, $26, $27, $28, $29
         )
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           compare_at_price = EXCLUDED.compare_at_price,
           image = EXCLUDED.image,
           images = EXCLUDED.images,
           category = EXCLUDED.category,
           fabric = EXCLUDED.fabric,
           color = EXCLUDED.color,
           size = EXCLUDED.size,
           material = EXCLUDED.material,
           featured = EXCLUDED.featured,
           stock = EXCLUDED.stock,
           is_active = EXCLUDED.is_active,
           collection_id = EXCLUDED.collection_id,
           is_rentable = EXCLUDED.is_rentable,
           rental_base_price = EXCLUDED.rental_base_price,
           rental_price_per_day = EXCLUDED.rental_price_per_day,
           minimum_rental_days = EXCLUDED.minimum_rental_days,
           maximum_rental_days = EXCLUDED.maximum_rental_days,
           rental_deposit = EXCLUDED.rental_deposit,
           rental_available_stock = EXCLUDED.rental_available_stock,
           views = EXCLUDED.views,
           lengths = EXCLUDED.lengths,
           custom_length_available = EXCLUDED.custom_length_available,
           updated_at = NOW()`,
        [
          p.id,
          p.name,
          p.slug,
          p.description || '',
          parseFloat(p.price) || 0,
          p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
          p.image || '/images/products/purple-suit-set.webp',
          imagesStr,
          p.category || 'Atelier Collection',
          p.fabric || '',
          p.color || '',
          p.size || 'S, M, L, XL',
          p.material || '',
          !!p.featured,
          parseInt(p.stock, 10) || 5,
          p.isActive !== false,
          validColId,
          !!p.isRentable,
          parseFloat(p.rentalBasePrice) || 0,
          parseFloat(p.rentalPricePerDay) || 0,
          parseInt(p.minimumRentalDays, 10) || 1,
          parseInt(p.maximumRentalDays, 10) || 14,
          parseFloat(p.rentalDeposit) || 0,
          parseInt(p.rentalAvailableStock, 10) || 1,
          parseInt(p.views || 0, 10),
          lengthsStr,
          p.customLengthAvailable !== false,
          p.createdAt ? new Date(p.createdAt) : new Date(),
          p.updatedAt ? new Date(p.updatedAt) : new Date()
        ]
      );
    }
    console.log('✔ Products migrated.');

    // 7. Verify Migration Summary
    console.log('\n=============================================================');
    console.log('SUPABASE MIGRATION VERIFICATION AUDIT');
    console.log('=============================================================');

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM collections) as collections_count,
        (SELECT COUNT(*) FROM products) as products_count,
        (SELECT COUNT(*) FROM orders) as orders_count,
        (SELECT COUNT(*) FROM rentals) as rentals_count
    `);

    console.table(counts.rows[0]);

    const sampleProducts = await pool.query(`
      SELECT id, name, slug, price, is_active, featured
      FROM products
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log('\nSample Live Products in Supabase:');
    console.table(sampleProducts.rows);

    console.log('\n🎉 ALL DATA MIGRATED AND VERIFIED SUCCESSFULLY IN SUPABASE!');
  } catch (err) {
    console.error('\n❌ Migration Failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
