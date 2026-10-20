// ==============================================================================
// HOUSE OF SHUBHANSHI — UNIFIED DATA ACCESS LAYER (Next.js / Node.js)
// Supports PostgreSQL via pg.Pool (with automatic cloud environment support:
// DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, SUPABASE_DATABASE_URL)
// with resilient fallback to persistent JSON storage in .postgres_data or /tmp.
// ==============================================================================
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let isPostgresInitialized = false;

// ------------------------------------------------------------------------------
// INITIAL SEED DATA (Real House of Shubhanshi Collections & Products)
// ------------------------------------------------------------------------------
const DEFAULT_ADMIN = {
  id: 'usr_admin_master',
  name: 'House of Shubhanshi Atelier',
  email: 'admin@houseofshubhanshi.com',
  phone: '+91 9560011351',
  passwordHash: '$2b$10$aevfzhTBrx9AzfkhuGy5HeUCqwetZ.9HrSBHxdltNJw.Sba4QS1zu', // Admin@Shubhanshi2026!
  role: 'ADMIN',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const DEFAULT_COLLECTIONS = [
  {
    id: 'col_bridal',
    name: 'Bridal & Wedding Collection',
    slug: 'bridal-wedding-collection',
    description: 'Heirloom lehengas, regal silhouettes, and bespoke ensembles crafted for the modern Indian bride.',
    image: '/images/future/future-01.webp',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'col_festive',
    name: 'Festive & Sangeet',
    slug: 'festive-sangeet',
    description: 'Vibrant anarkalis and flowy shararas designed for ease, graceful movement, and celebration.',
    image: '/images/future/future-02.webp',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'col_pret',
    name: 'Everyday Pret & Suiting',
    slug: 'everyday-pret',
    description: 'Effortless straight-fit kurta sets with refined threadwork and soft organza dupattas.',
    image: '/images/future/future-03.webp',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod_real_purple',
    name: 'Purple Embroidered Kurta Set',
    slug: 'purple-suit-set',
    description: 'Deep purple straight-fit kurta set with delicate gold embroidery along the collar, placket, and cuffs. Accompanied by a matching sheer dupatta with fine scallop-edge detailing.',
    price: 4499,
    compareAtPrice: 5999,
    image: '/images/products/purple-suit-set.webp',
    images: '["/images/products/purple-suit-set.webp"]',
    category: 'Suit Sets',
    fabric: 'Silk Blend & Organza',
    color: 'Purple',
    size: 'XS, S, M, L, XL, XXL',
    material: 'Pure Chanderi Silk with Organza Dupatta',
    featured: true,
    stock: 12,
    isActive: true,
    collectionId: 'col_pret',
    isRentable: true,
    rentalBasePrice: 1199,
    rentalPricePerDay: 350,
    minimumRentalDays: 2,
    maximumRentalDays: 14,
    rentalDeposit: 2500,
    rentalAvailableStock: 4,
    views: 0,
    lengths: 'Standard (42"), Petite (39"), Tall (45"), Custom',
    customLengthAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_real_brown',
    name: 'Earth Brown Flared Lehenga Set',
    slug: 'brown-lehenga-set',
    description: 'Rich earthy brown flared lehenga skirt paired with a statement halter neck blouse adorned with ornate golden cutwork embroidery.',
    price: 5599,
    compareAtPrice: 7499,
    image: '/images/products/brown-lehenga-set.webp',
    images: '["/images/products/brown-lehenga-set.webp"]',
    category: 'Lehengas',
    fabric: 'Crepe Silk Blend',
    color: 'Earth Brown',
    size: 'XS, S, M, L, XL',
    material: 'Heavy Crepe Silk with Hand Embroidered Border',
    featured: true,
    stock: 8,
    isActive: true,
    collectionId: 'col_bridal',
    isRentable: true,
    rentalBasePrice: 1499,
    rentalPricePerDay: 450,
    minimumRentalDays: 2,
    maximumRentalDays: 14,
    rentalDeposit: 3000,
    rentalAvailableStock: 3,
    views: 0,
    lengths: 'Standard (42"), Petite (39"), Tall (45"), Custom',
    customLengthAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_real_green',
    name: 'Emerald Green Flared Anarkali Set',
    slug: 'green-anarkali-set',
    description: 'Flared emerald green anarkali silhouette accented with soft gathers, paired with a royal blue contrast dupatta finished with an antique gold border.',
    price: 6699,
    compareAtPrice: 8999,
    image: '/images/products/green-anarkali-set.webp',
    images: '["/images/products/green-anarkali-set.webp"]',
    category: 'Anarkalis',
    fabric: 'Georgette Silk Blend',
    color: 'Emerald Green',
    size: 'XS, S, M, L, XL',
    material: 'Georgette Silk with Contrast Zari Dupatta',
    featured: true,
    stock: 10,
    isActive: true,
    collectionId: 'col_festive',
    isRentable: true,
    rentalBasePrice: 1799,
    rentalPricePerDay: 550,
    minimumRentalDays: 2,
    maximumRentalDays: 14,
    rentalDeposit: 3500,
    rentalAvailableStock: 3,
    views: 0,
    lengths: 'Standard (42"), Petite (39"), Tall (45"), Custom',
    customLengthAvailable: true,
    createdAt: new Date().toISOString()
  }
];

// Fallback JSON Storage in memory & file system
let memStore = null;

function getStoreFilePath() {
  const primary = path.resolve(process.cwd(), '../.postgres_data/data_store.json');
  if (fs.existsSync(path.dirname(primary))) {
    return primary;
  }
  const secondary = path.resolve(process.cwd(), '.postgres_data/data_store.json');
  if (fs.existsSync(path.dirname(secondary))) {
    return secondary;
  }
  // Serverless fallback (/tmp is writable in Vercel/AWS Lambda)
  return path.join('/tmp', 'shubhanshi_data_store.json');
}

function loadMemStore() {
  if (memStore) return memStore;
  const filePath = getStoreFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      memStore = JSON.parse(content);
      if (memStore && Array.isArray(memStore.users)) {
        const adminUser = memStore.users.find(u => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
        if (adminUser && adminUser.passwordHash === '$2a$10$DLx5rj2avGproI71zsDWaOhE/Tw3pTyFQbssA3iGYeR9gahPLv1jq') {
          adminUser.passwordHash = DEFAULT_ADMIN.passwordHash;
          saveMemStore();
        }
      }
      return memStore;
    }
  } catch (e) {
    console.warn('[DB] Could not read JSON store file:', e.message);
  }

  // Pre-populate with default seed data
  memStore = {
    users: [DEFAULT_ADMIN],
    collections: [...DEFAULT_COLLECTIONS],
    products: [...DEFAULT_PRODUCTS],
    orders: [],
    rentals: []
  };
  saveMemStore();
  return memStore;
}

function saveMemStore() {
  if (!memStore) return;
  const filePath = getStoreFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(memStore, null, 2), 'utf-8');
  } catch (e) {
    // Ignore in read-only environments
  }
}

// ------------------------------------------------------------------------------
// POSTGRESQL POOL INITIALIZATION (Global reuse for Serverless / Next.js)
function isPlaceholderUrl(url) {
  if (!url) return true;
  return (
    url.includes('@HOST:') ||
    url.includes('HOST:5432') ||
    url.includes('USER:PASSWORD') ||
    url.includes('your_') ||
    url.includes('example.com')
  );
}

function getDbUrl() {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
    process.env.SUPABASE_DATABASE_URL
  ].filter(Boolean);

  for (const url of candidates) {
    const trimmed = url.trim();
    if (trimmed && !isPlaceholderUrl(trimmed)) {
      return trimmed;
    }
  }

  return '';
}

function getPgPool() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    return null;
  }

  // In local dev without FORCE_PG flag, skip localhost Postgres if not running
  if (
    process.env.NODE_ENV !== 'production' &&
    !process.env.FORCE_PG &&
    (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))
  ) {
    return null;
  }

  // Reuse global pool across hot lambdas
  if (global.__shubhanshiPgPool) {
    return global.__shubhanshiPgPool;
  }

  try {
    const { Pool } = require('pg');
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
    const ssl = (isProduction || isRemote || dbUrl.includes('sslmode='))
      ? { rejectUnauthorized: false }
      : false;

    const pool = new Pool({
      connectionString: dbUrl,
      ssl,
      connectionTimeoutMillis: 3000,
      statement_timeout: 4000,
      query_timeout: 4000,
      idleTimeoutMillis: 10000,
      max: 5
    });

    pool.on('error', (err) => {
      console.warn('[DB Pool Error]', err.message);
    });

    global.__shubhanshiPgPool = pool;
    return pool;
  } catch (err) {
    console.warn('[DB] Failed to initialize PostgreSQL pool:', err.message);
    return null;
  }
}

/**
 * Ensure database schema, tables, and baseline data exist
 */
async function ensureTables() {
  const pool = getPgPool();
  if (!pool || isPostgresInitialized) return;
  isPostgresInitialized = true;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
        dob VARCHAR(30),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collections (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        compare_at_price NUMERIC(12, 2),
        image TEXT NOT NULL,
        images TEXT,
        category VARCHAR(100),
        fabric VARCHAR(100),
        color VARCHAR(100),
        size VARCHAR(100),
        material VARCHAR(100),
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        stock INTEGER NOT NULL DEFAULT 10,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        collection_id VARCHAR(50) REFERENCES collections(id) ON DELETE SET NULL,
        is_rentable BOOLEAN NOT NULL DEFAULT FALSE,
        rental_base_price NUMERIC(12, 2) DEFAULT 0,
        rental_price_per_day NUMERIC(12, 2) DEFAULT 0,
        minimum_rental_days INTEGER DEFAULT 1,
        maximum_rental_days INTEGER DEFAULT 14,
        rental_deposit NUMERIC(12, 2) DEFAULT 0,
        rental_available_stock INTEGER DEFAULT 1,
        views INTEGER NOT NULL DEFAULT 0,
        lengths TEXT DEFAULT 'Standard (42"), Petite (39"), Tall (45"), Custom',
        custom_length_available BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE collections ALTER COLUMN image TYPE TEXT;
      ALTER TABLE products ALTER COLUMN image TYPE TEXT;
      ALTER TABLE products ALTER COLUMN images TYPE TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS lengths TEXT DEFAULT 'Standard (42"), Petite (39"), Tall (45"), Custom';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_length_available BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    // Ensure default admin exists
    const adminCheck = await pool.query('SELECT id, password_hash FROM users WHERE LOWER(email) = $1', [DEFAULT_ADMIN.email.toLowerCase()]);
    if (adminCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT (email) DO NOTHING`,
        [DEFAULT_ADMIN.id, DEFAULT_ADMIN.name, DEFAULT_ADMIN.email.toLowerCase(), DEFAULT_ADMIN.phone, DEFAULT_ADMIN.passwordHash, DEFAULT_ADMIN.role]
      );
    } else if (adminCheck.rows[0]?.password_hash === '$2a$10$DLx5rj2avGproI71zsDWaOhE/Tw3pTyFQbssA3iGYeR9gahPLv1jq') {
      await pool.query('UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2', [DEFAULT_ADMIN.passwordHash, DEFAULT_ADMIN.email.toLowerCase()]);
    }

    // Ensure default collections exist if table is empty
    const colCheck = await pool.query('SELECT COUNT(*) as count FROM collections');
    if (parseInt(colCheck.rows[0]?.count || 0, 10) === 0) {
      for (const col of DEFAULT_COLLECTIONS) {
        await pool.query(
          `INSERT INTO collections (id, name, slug, description, image, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT (slug) DO NOTHING`,
          [col.id, col.name, col.slug, col.description, col.image, col.isActive]
        );
      }
    }

    // Ensure default products exist if table is empty
    const prodCheck = await pool.query('SELECT COUNT(*) as count FROM products');
    if (parseInt(prodCheck.rows[0]?.count || 0, 10) === 0) {
      for (const prod of DEFAULT_PRODUCTS) {
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
            $25, $26, $27, NOW(), NOW()
          ) ON CONFLICT (slug) DO NOTHING`,
          [
            prod.id, prod.name, prod.slug, prod.description, prod.price, prod.compareAtPrice,
            prod.image, prod.images, prod.category, prod.fabric, prod.color, prod.size,
            prod.material, prod.featured, prod.stock, prod.isActive, prod.collectionId,
            prod.isRentable, prod.rentalBasePrice, prod.rentalPricePerDay, prod.minimumRentalDays,
            prod.maximumRentalDays, prod.rentalDeposit, prod.rentalAvailableStock,
            prod.views || 0, prod.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom',
            prod.customLengthAvailable !== false
          ]
        );
      }
    }
  } catch (err) {
    console.warn('[DB ensureTables Notice]', err.message);
  }
}

// ------------------------------------------------------------------------------
// UNIFIED DATA CLIENT
// ------------------------------------------------------------------------------
const db = {
  async testConnection() {
    const rawUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
    if (rawUrl && isPlaceholderUrl(rawUrl)) {
      return {
        ok: false,
        error: 'Database URL is an unconfigured template placeholder (USER:PASSWORD@HOST). Please provide real PostgreSQL credentials in environment variables.',
        type: 'placeholder'
      };
    }
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT 1 as ok');
        await ensureTables();
        return { ok: !!res.rows, type: 'postgres' };
      } catch (e) {
        console.warn('[DB testConnection Error]', e.message);
        return { ok: false, error: e.message, type: 'fallback' };
      }
    }
    return { ok: true, type: 'memstore' };
  },

  user: {
    async findUnique({ where }) {
      const pool = getPgPool();
      if (pool) {
        try {
          await ensureTables();
          if (where.email) {
            const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [where.email.trim()]);
            if (res.rows[0]) {
              const u = res.rows[0];
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                passwordHash: u.password_hash || u.passwordHash,
                role: u.role,
                dob: u.dob || null,
                createdAt: u.created_at,
                updatedAt: u.updated_at
              };
            }
          }
          if (where.id) {
            const res = await pool.query('SELECT * FROM users WHERE id = $1', [where.id]);
            if (res.rows[0]) {
              const u = res.rows[0];
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                passwordHash: u.password_hash || u.passwordHash,
                role: u.role,
                dob: u.dob || null,
                createdAt: u.created_at,
                updatedAt: u.updated_at
              };
            }
          }
        } catch (e) {
          console.warn('[DB User Error]', e.message);
        }
      }

      // Memory Store fallback
      const store = loadMemStore();
      if (where.email) {
        return store.users.find(u => u.email.toLowerCase() === where.email.trim().toLowerCase()) || null;
      }
      if (where.id) {
        return store.users.find(u => u.id === where.id) || null;
      }
      return null;
    },

    async create({ data }) {
      const pool = getPgPool();
      const id = data.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const role = data.role || 'CUSTOMER';
      const hash = data.passwordHash || (data.password ? await bcrypt.hash(data.password, 10) : '');

      if (pool) {
        try {
          await ensureTables();
          const res = await pool.query(
            `INSERT INTO users (id, name, email, phone, password_hash, role, dob, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id, name, email, phone, role, dob, created_at as "createdAt"`,
            [id, data.name, data.email.toLowerCase().trim(), data.phone || null, hash, role, data.dob || null]
          );
          return res.rows[0];
        } catch (e) {
          console.warn('[DB User Create Error]', e.message);
        }
      }

      const store = loadMemStore();
      const newUser = {
        id,
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || '',
        passwordHash: hash,
        role,
        dob: data.dob || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.users.push(newUser);
      saveMemStore();
      return newUser;
    },

    async update({ where, data }) {
      const pool = getPgPool();
      if (pool) {
        try {
          await ensureTables();
          if (data.name) {
            await pool.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [data.name, where.id]);
          }
          if (data.phone !== undefined) {
            await pool.query('UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2', [data.phone, where.id]);
          }
          if (data.email) {
            await pool.query('UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2', [data.email.toLowerCase().trim(), where.id]);
          }
          if (data.dob !== undefined) {
            await pool.query('UPDATE users SET dob = $1, updated_at = NOW() WHERE id = $2', [data.dob, where.id]);
          }
          if (data.passwordHash) {
            await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [data.passwordHash, where.id]);
          }
          if (data.role) {
            await pool.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [data.role, where.id]);
          }
        } catch (e) {
          console.warn('[DB User Update Error]', e.message);
        }
      }

      const store = loadMemStore();
      const user = store.users.find(u => u.id === where.id || (where.email && u.email.toLowerCase() === where.email.toLowerCase()));
      if (user) {
        Object.assign(user, data, { updatedAt: new Date().toISOString() });
        saveMemStore();
        return user;
      }
      return null;
    },

    async findMany() {
      const pool = getPgPool();
      if (pool) {
        try {
          await ensureTables();
          const res = await pool.query('SELECT id, name, email, phone, role, dob, created_at as "createdAt" FROM users ORDER BY created_at DESC');
          if (res.rows && res.rows.length > 0) {
            return res.rows;
          }
        } catch (e) {
          console.warn('[DB Users findMany Error]', e.message);
        }
      }
      const store = loadMemStore();
      return store.users.map(({ passwordHash, ...safeUser }) => safeUser);
    }
  },

  product: {
    async findMany({ where = {} } = {}) {
      const pool = getPgPool();
      if (pool) {
        try {
          await ensureTables();
          let sql = 'SELECT * FROM products';
          const params = [];
          if (where.isActive !== undefined) {
            sql += ' WHERE is_active = $1';
            params.push(where.isActive);
          }
          sql += ' ORDER BY created_at DESC';
          const res = await pool.query(sql, params);
          if (res.rows && res.rows.length > 0) {
            return res.rows.map(r => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              description: r.description,
              price: parseFloat(r.price),
              compareAtPrice: r.compare_at_price ? parseFloat(r.compare_at_price) : null,
              image: r.image,
              images: r.images,
              category: r.category,
              fabric: r.fabric,
              color: r.color,
              size: r.size,
              material: r.material,
              featured: !!r.featured,
              stock: parseInt(r.stock, 10),
              isActive: !!r.is_active,
              collectionId: r.collection_id,
              isRentable: !!r.is_rentable,
              rentalBasePrice: r.rental_base_price ? parseFloat(r.rental_base_price) : 0,
              rentalPricePerDay: r.rental_price_per_day ? parseFloat(r.rental_price_per_day) : 0,
              minimumRentalDays: r.minimum_rental_days ? parseInt(r.minimum_rental_days, 10) : 1,
              maximumRentalDays: r.maximum_rental_days ? parseInt(r.maximum_rental_days, 10) : 14,
              rentalDeposit: r.rental_deposit ? parseFloat(r.rental_deposit) : 0,
              rentalAvailableStock: r.rental_available_stock ? parseInt(r.rental_available_stock, 10) : 1,
              views: parseInt(r.views || 0, 10),
              lengths: r.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom',
              customLengthAvailable: r.custom_length_available !== undefined ? !!r.custom_length_available : true,
              createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
            }));
          }
        } catch (e) {
          console.warn('[DB Product findMany Error]', e.message);
        }
      }

      const store = loadMemStore();
      let list = store.products;
      if (where.isActive !== undefined) {
        list = list.filter(p => p.isActive === where.isActive);
      }
      return list;
    },

    async findUnique({ where }) {
      const all = await db.product.findMany();
      if (where.id) return all.find(p => p.id === where.id) || null;
      if (where.slug) return all.find(p => p.slug === where.slug) || null;
      return null;
    },

    async create({ data }) {
      const pool = getPgPool();
      const store = loadMemStore();
      const id = data.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      let baseSlug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'product';

      // Normalize lengths to a comma-separated string for PostgreSQL TEXT column
      const lengthsStr = Array.isArray(data.lengths)
        ? data.lengths.join(', ')
        : (data.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom');

      // Sanitize collectionId: empty string or 'none' must be null for foreign key constraints
      let sanitizedCollectionId = data.collectionId && data.collectionId !== 'none' ? data.collectionId : null;

      const newProd = {
        id,
        name: data.name,
        slug: baseSlug,
        description: data.description || '',
        price: parseFloat(data.price) || 0,
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
        image: data.image || '/images/products/purple-suit-set.webp',
        images: Array.isArray(data.images) ? JSON.stringify(data.images) : (data.images || JSON.stringify([data.image || '/images/products/purple-suit-set.webp'])),
        category: data.category || 'Atelier Collection',
        fabric: data.fabric || '',
        color: data.color || '',
        size: data.size || 'S, M, L, XL',
        material: data.material || '',
        featured: !!data.featured,
        stock: parseInt(data.stock, 10) || 5,
        isActive: data.isActive !== undefined ? !!data.isActive : true,
        collectionId: sanitizedCollectionId,
        isRentable: !!data.isRentable,
        rentalBasePrice: parseFloat(data.rentalBasePrice) || 0,
        rentalPricePerDay: parseFloat(data.rentalPricePerDay) || 0,
        minimumRentalDays: parseInt(data.minimumRentalDays, 10) || 1,
        maximumRentalDays: parseInt(data.maximumRentalDays, 10) || 14,
        rentalDeposit: parseFloat(data.rentalDeposit) || 0,
        rentalAvailableStock: parseInt(data.rentalAvailableStock, 10) || 1,
        views: data.views !== undefined ? parseInt(data.views, 10) : 0,
        lengths: lengthsStr,
        customLengthAvailable: data.customLengthAvailable !== undefined ? !!data.customLengthAvailable : true,
        createdAt: new Date().toISOString()
      };

      if (pool) {
        try {
          await ensureTables();

          // Verify collection exists if provided; otherwise nullify to avoid foreign key failure
          if (sanitizedCollectionId) {
            const colCheck = await pool.query('SELECT id FROM collections WHERE id = $1', [sanitizedCollectionId]);
            if (colCheck.rows.length === 0) {
              sanitizedCollectionId = null;
              newProd.collectionId = null;
            }
          }

          // Check for duplicate slug and append unique suffix if needed
          const slugCheck = await pool.query('SELECT id FROM products WHERE slug = $1', [newProd.slug]);
          if (slugCheck.rows.length > 0) {
            newProd.slug = `${newProd.slug}-${Date.now().toString(36)}`;
          }

          await pool.query(
            `INSERT INTO products (
              id, name, slug, description, price, compare_at_price, image, images,
              category, fabric, color, size, material, featured, stock, is_active,
              collection_id, is_rentable, rental_base_price, rental_price_per_day,
              minimum_rental_days, maximum_rental_days, rental_deposit, rental_available_stock,
              views, lengths, custom_length_available,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20,
              $21, $22, $23, $24,
              $25, $26, $27,
              NOW(), NOW()
            )`,
            [
              newProd.id, newProd.name, newProd.slug, newProd.description, newProd.price, newProd.compareAtPrice,
              newProd.image, newProd.images, newProd.category, newProd.fabric, newProd.color, newProd.size,
              newProd.material, newProd.featured, newProd.stock, newProd.isActive, newProd.collectionId,
              newProd.isRentable, newProd.rentalBasePrice, newProd.rentalPricePerDay, newProd.minimumRentalDays,
              newProd.maximumRentalDays, newProd.rentalDeposit, newProd.rentalAvailableStock,
              newProd.views, newProd.lengths, newProd.customLengthAvailable
            ]
          );
        } catch (pgErr) {
          console.error('[DB Product Create PG Error]', pgErr.message);
          throw new Error('Database error saving product: ' + pgErr.message);
        }
      }

      store.products.unshift(newProd);
      saveMemStore();
      return newProd;
    },

    async update({ where, data }) {
      const pool = getPgPool();
      let updatedProd = null;

      if (pool && where.id) {
        try {
          await ensureTables();
          const fields = [];
          const params = [];
          let paramIdx = 1;

          if (data.name !== undefined) { fields.push(`name = $${paramIdx++}`); params.push(data.name); }
          if (data.slug !== undefined) { fields.push(`slug = $${paramIdx++}`); params.push(data.slug); }
          if (data.description !== undefined) { fields.push(`description = $${paramIdx++}`); params.push(data.description); }
          if (data.price !== undefined) { fields.push(`price = $${paramIdx++}`); params.push(parseFloat(data.price)); }
          if (data.compareAtPrice !== undefined) { fields.push(`compare_at_price = $${paramIdx++}`); params.push(data.compareAtPrice ? parseFloat(data.compareAtPrice) : null); }
          if (data.image !== undefined) { fields.push(`image = $${paramIdx++}`); params.push(data.image); }
          if (data.images !== undefined) {
            const imgStr = Array.isArray(data.images) ? JSON.stringify(data.images) : data.images;
            fields.push(`images = $${paramIdx++}`); params.push(imgStr);
          }
          if (data.category !== undefined) { fields.push(`category = $${paramIdx++}`); params.push(data.category); }
          if (data.fabric !== undefined) { fields.push(`fabric = $${paramIdx++}`); params.push(data.fabric); }
          if (data.color !== undefined) { fields.push(`color = $${paramIdx++}`); params.push(data.color); }
          if (data.size !== undefined) { fields.push(`size = $${paramIdx++}`); params.push(data.size); }
          if (data.material !== undefined) { fields.push(`material = $${paramIdx++}`); params.push(data.material); }
          if (data.featured !== undefined) { fields.push(`featured = $${paramIdx++}`); params.push(!!data.featured); }
          if (data.stock !== undefined) { fields.push(`stock = $${paramIdx++}`); params.push(parseInt(data.stock, 10)); }
          if (data.isActive !== undefined) { fields.push(`is_active = $${paramIdx++}`); params.push(!!data.isActive); }

          if (data.collectionId !== undefined) {
            let colId = data.collectionId && data.collectionId !== 'none' ? data.collectionId : null;
            if (colId) {
              const colCheck = await pool.query('SELECT id FROM collections WHERE id = $1', [colId]);
              if (colCheck.rows.length === 0) colId = null;
            }
            fields.push(`collection_id = $${paramIdx++}`);
            params.push(colId);
          }

          if (data.isRentable !== undefined) { fields.push(`is_rentable = $${paramIdx++}`); params.push(!!data.isRentable); }
          if (data.rentalBasePrice !== undefined) { fields.push(`rental_base_price = $${paramIdx++}`); params.push(parseFloat(data.rentalBasePrice)); }
          if (data.rentalPricePerDay !== undefined) { fields.push(`rental_price_per_day = $${paramIdx++}`); params.push(parseFloat(data.rentalPricePerDay)); }
          if (data.minimumRentalDays !== undefined) { fields.push(`minimum_rental_days = $${paramIdx++}`); params.push(parseInt(data.minimumRentalDays, 10)); }
          if (data.maximumRentalDays !== undefined) { fields.push(`maximum_rental_days = $${paramIdx++}`); params.push(parseInt(data.maximumRentalDays, 10)); }
          if (data.rentalDeposit !== undefined) { fields.push(`rental_deposit = $${paramIdx++}`); params.push(parseFloat(data.rentalDeposit)); }
          if (data.rentalAvailableStock !== undefined) { fields.push(`rental_available_stock = $${paramIdx++}`); params.push(parseInt(data.rentalAvailableStock, 10)); }
          if (data.views !== undefined) { fields.push(`views = $${paramIdx++}`); params.push(parseInt(data.views, 10)); }

          if (data.lengths !== undefined) {
            const lengthsStr = Array.isArray(data.lengths) ? data.lengths.join(', ') : data.lengths;
            fields.push(`lengths = $${paramIdx++}`);
            params.push(lengthsStr);
          }
          if (data.customLengthAvailable !== undefined) { fields.push(`custom_length_available = $${paramIdx++}`); params.push(!!data.customLengthAvailable); }

          if (fields.length > 0) {
            fields.push(`updated_at = NOW()`);
            params.push(where.id);
            const updateRes = await pool.query(
              `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
              params
            );
            if (updateRes.rows && updateRes.rows.length > 0) {
              const r = updateRes.rows[0];
              updatedProd = {
                id: r.id,
                name: r.name,
                slug: r.slug,
                description: r.description,
                price: parseFloat(r.price),
                compareAtPrice: r.compare_at_price ? parseFloat(r.compare_at_price) : null,
                image: r.image,
                images: r.images,
                category: r.category,
                fabric: r.fabric,
                color: r.color,
                size: r.size,
                material: r.material,
                featured: !!r.featured,
                stock: parseInt(r.stock, 10),
                isActive: !!r.is_active,
                collectionId: r.collection_id,
                isRentable: !!r.is_rentable,
                rentalBasePrice: r.rental_base_price ? parseFloat(r.rental_base_price) : 0,
                rentalPricePerDay: r.rental_price_per_day ? parseFloat(r.rental_price_per_day) : 0,
                minimumRentalDays: r.minimum_rental_days ? parseInt(r.minimum_rental_days, 10) : 1,
                maximumRentalDays: r.maximum_rental_days ? parseInt(r.maximum_rental_days, 10) : 14,
                rentalDeposit: r.rental_deposit ? parseFloat(r.rental_deposit) : 0,
                rentalAvailableStock: r.rental_available_stock ? parseInt(r.rental_available_stock, 10) : 1,
                views: parseInt(r.views || 0, 10),
                lengths: r.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom',
                customLengthAvailable: r.custom_length_available !== undefined ? !!r.custom_length_available : true,
                createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
              };
            }
          }
        } catch (pgErr) {
          console.error('[DB Product Update PG Error]', pgErr.message);
          throw new Error('Database error updating product: ' + pgErr.message);
        }
      }

      const store = loadMemStore();
      const idx = store.products.findIndex(p => p.id === where.id);
      if (idx !== -1) {
        store.products[idx] = { ...store.products[idx], ...data, updatedAt: new Date().toISOString() };
        saveMemStore();
        return updatedProd || store.products[idx];
      }
      return updatedProd;
    },

    async incrementViews(id) {
      const pool = getPgPool();
      if (pool) {
        try {
          await pool.query('UPDATE products SET views = COALESCE(views, 0) + 1 WHERE id = $1 OR slug = $1', [id]);
        } catch (e) {
          console.warn('[DB incrementViews Error]', e.message);
        }
      }
      const store = loadMemStore();
      const prod = store.products.find(p => p.id === id || p.slug === id);
      if (prod) {
        prod.views = (prod.views || 0) + 1;
        saveMemStore();
        return prod;
      }
      return null;
    },

    async delete({ where }) {
      const pool = getPgPool();
      let removed = null;

      if (pool && where.id) {
        try {
          await ensureTables();
          const res = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [where.id]);
          if (res.rows && res.rows.length > 0) {
            removed = res.rows[0];
          }
        } catch (pgErr) {
          console.error('[DB Product Delete PG Error]', pgErr.message);
          // If foreign key constraint prevents permanent deletion, deactivate instead
          try {
            await pool.query('UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [where.id]);
          } catch (e2) {}
          throw new Error('Database delete error: ' + pgErr.message);
        }
      }

      const store = loadMemStore();
      const idx = store.products.findIndex(p => p.id === where.id);
      if (idx !== -1) {
        const memRemoved = store.products.splice(idx, 1)[0];
        saveMemStore();
        return removed || memRemoved;
      }
      return removed;
    }
  },

  collection: {
    async findMany({ where = {} } = {}) {
      const pool = getPgPool();
      if (pool) {
        try {
          await ensureTables();
          let sql = 'SELECT * FROM collections';
          const params = [];
          if (where.isActive !== undefined) {
            sql += ' WHERE is_active = $1';
            params.push(where.isActive);
          }
          sql += ' ORDER BY created_at ASC';
          const res = await pool.query(sql, params);
          if (res.rows && res.rows.length > 0) {
            return res.rows.map(r => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              description: r.description,
              image: r.image,
              isActive: !!r.is_active,
              createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
            }));
          }
        } catch (e) {
          console.warn('[DB Collection findMany PG Error]', e.message);
        }
      }

      const store = loadMemStore();
      let list = store.collections;
      if (where.isActive !== undefined) {
        list = list.filter(c => c.isActive === where.isActive);
      }
      return list;
    },

    async findUnique({ where }) {
      const all = await db.collection.findMany();
      if (where.id) return all.find(c => c.id === where.id) || null;
      if (where.slug) return all.find(c => c.slug === where.slug) || null;
      return null;
    },

    async create({ data }) {
      const pool = getPgPool();
      const store = loadMemStore();
      const id = data.id || `col_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const newCol = {
        id,
        name: data.name,
        slug,
        description: data.description || '',
        image: data.image || '/images/future/future-01.webp',
        isActive: data.isActive !== undefined ? !!data.isActive : true,
        createdAt: new Date().toISOString()
      };

      if (pool) {
        try {
          await ensureTables();
          await pool.query(
            `INSERT INTO collections (id, name, slug, description, image, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [newCol.id, newCol.name, newCol.slug, newCol.description, newCol.image, newCol.isActive]
          );
        } catch (pgErr) {
          console.error('[DB Collection Create PG Error]', pgErr.message);
          throw new Error('Database error saving collection: ' + pgErr.message);
        }
      }

      store.collections.push(newCol);
      saveMemStore();
      return newCol;
    },

    async update({ where, data }) {
      const pool = getPgPool();
      let updatedCol = null;

      if (pool && where.id) {
        try {
          await ensureTables();
          const fields = [];
          const params = [];
          let paramIdx = 1;
          if (data.name !== undefined) { fields.push(`name = $${paramIdx++}`); params.push(data.name); }
          if (data.slug !== undefined) { fields.push(`slug = $${paramIdx++}`); params.push(data.slug); }
          if (data.description !== undefined) { fields.push(`description = $${paramIdx++}`); params.push(data.description); }
          if (data.image !== undefined) { fields.push(`image = $${paramIdx++}`); params.push(data.image); }
          if (data.isActive !== undefined) { fields.push(`is_active = $${paramIdx++}`); params.push(!!data.isActive); }

          if (fields.length > 0) {
            fields.push(`updated_at = NOW()`);
            params.push(where.id);
            const res = await pool.query(
              `UPDATE collections SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
              params
            );
            if (res.rows && res.rows.length > 0) {
              const r = res.rows[0];
              updatedCol = {
                id: r.id,
                name: r.name,
                slug: r.slug,
                description: r.description,
                image: r.image,
                isActive: !!r.is_active,
                createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
              };
            }
          }
        } catch (pgErr) {
          console.error('[DB Collection Update PG Error]', pgErr.message);
          throw new Error('Database error updating collection: ' + pgErr.message);
        }
      }

      const store = loadMemStore();
      const idx = store.collections.findIndex(c => c.id === where.id);
      if (idx !== -1) {
        store.collections[idx] = { ...store.collections[idx], ...data, updatedAt: new Date().toISOString() };
        saveMemStore();
        return updatedCol || store.collections[idx];
      }
      return updatedCol;
    },

    async delete({ where }) {
      const pool = getPgPool();
      let removed = null;

      if (pool && where.id) {
        try {
          await ensureTables();
          // Nullify foreign key references on associated products first
          await pool.query('UPDATE products SET collection_id = NULL WHERE collection_id = $1', [where.id]);
          const res = await pool.query('DELETE FROM collections WHERE id = $1 RETURNING *', [where.id]);
          if (res.rows && res.rows.length > 0) {
            removed = res.rows[0];
          }
        } catch (pgErr) {
          console.error('[DB Collection Delete PG Error]', pgErr.message);
          throw new Error('Database delete error: ' + pgErr.message);
        }
      }

      const store = loadMemStore();
      const idx = store.collections.findIndex(c => c.id === where.id);
      if (idx !== -1) {
        const memRemoved = store.collections.splice(idx, 1)[0];
        saveMemStore();
        return removed || memRemoved;
      }
      return removed;
    }
  },

  order: {
    async findMany({ where = {} } = {}) {
      const store = loadMemStore();
      let list = store.orders;
      if (where.userId) {
        list = list.filter(o => o.userId === where.userId);
      }
      return list;
    },

    async findUnique({ where }) {
      const store = loadMemStore();
      if (where.id) return store.orders.find(o => o.id === where.id) || null;
      if (where.orderNumber) return store.orders.find(o => o.orderNumber === where.orderNumber) || null;
      return null;
    },

    async create({ data }) {
      const store = loadMemStore();
      const id = data.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const orderNumber = `HS${Math.floor(10000 + Math.random() * 90000)}`;

      const newOrder = {
        id,
        orderNumber,
        userId: data.userId || 'guest',
        user: data.user || null,
        items: data.items || [],
        totalAmount: parseFloat(data.totalAmount) || 0,
        rentalDepositTotal: parseFloat(data.rentalDepositTotal) || 0,
        status: data.status || 'WHATSAPP_ENQUIRY',
        paymentStatus: data.paymentStatus || 'WHATSAPP_ENQUIRY',
        shippingAddress: data.shippingAddress || '',
        phone: data.phone || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      store.orders.unshift(newOrder);

      // Create rental entries for any rented items
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          if (item.purchaseType === 'RENT') {
            const rentalId = `rnt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            store.rentals.unshift({
              id: rentalId,
              orderId: id,
              productId: item.productId,
              productName: item.productName || item.name || 'Atelier Garment',
              userId: data.userId || 'guest',
              customerName: data.user?.name || data.shippingAddress?.split(',')[0] || 'Patron',
              customerPhone: data.phone || '',
              startDate: item.rentalStartDate || new Date().toISOString().split('T')[0],
              endDate: item.rentalEndDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
              rentalDays: item.rentalDays || 3,
              rentalPrice: parseFloat(item.rentalPrice || item.price) || 0,
              securityDeposit: parseFloat(item.securityDeposit) || 0,
              status: 'RESERVED',
              depositStatus: 'HELD',
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      saveMemStore();
      return newOrder;
    },

    async update({ where, data }) {
      const store = loadMemStore();
      const order = store.orders.find(o => o.id === where.id);
      if (order) {
        Object.assign(order, data, { updatedAt: new Date().toISOString() });
        saveMemStore();
        return order;
      }
      return null;
    }
  },

  rental: {
    async findMany({ where = {} } = {}) {
      const store = loadMemStore();
      let list = store.rentals;
      if (where.userId) {
        list = list.filter(r => r.userId === where.userId);
      }
      return list;
    },

    async update({ where, data }) {
      const store = loadMemStore();
      const rental = store.rentals.find(r => r.id === where.id);
      if (rental) {
        Object.assign(rental, data, { updatedAt: new Date().toISOString() });
        saveMemStore();
        return rental;
      }
      return null;
    }
  }
};

module.exports = db;
