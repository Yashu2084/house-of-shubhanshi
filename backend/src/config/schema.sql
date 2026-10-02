-- ==============================================================================
-- HOUSE OF SHUBHANSHI — POSTGRESQL SCHEMA (Production DDL)
-- Full Dress Rental & Bespoke E-Commerce System
-- ==============================================================================

-- 1. Patrons & Atelier Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    dob VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Haute Couture Collections
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

-- 3. Atelier Garments & Products (Extended with Rental Configuration)
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
    -- Rental Configuration
    is_rentable BOOLEAN NOT NULL DEFAULT FALSE,
    rental_base_price NUMERIC(12, 2) DEFAULT 0,
    rental_price_per_day NUMERIC(12, 2) DEFAULT 0,
    minimum_rental_days INTEGER DEFAULT 1,
    maximum_rental_days INTEGER DEFAULT 7,
    rental_deposit NUMERIC(12, 2) DEFAULT 0,
    rental_available_stock INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Orders (Supports BUY, RENT, and MIXED)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    rental_deposit_total NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'WHATSAPP_ENQUIRY' CHECK (status IN ('WHATSAPP_ENQUIRY', 'PENDING_WHATSAPP_CONFIRMATION', 'CONFIRMED', 'RECEIVED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
    payment_status VARCHAR(40) NOT NULL DEFAULT 'WHATSAPP_ENQUIRY' CHECK (payment_status IN ('WHATSAPP_ENQUIRY', 'PENDING', 'COD', 'PAID')),
    shipping_address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Individual Order Items (Distinguishes BUY vs RENT with Historical Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL,
    purchase_type VARCHAR(20) NOT NULL DEFAULT 'BUY' CHECK (purchase_type IN ('BUY', 'RENT')),
    rental_days INTEGER,
    rental_start_date DATE,
    rental_end_date DATE,
    rental_price NUMERIC(12, 2),
    security_deposit NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Dedicated Rental Reservations & Lifecycle Tracking
CREATE TABLE IF NOT EXISTS rentals (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id VARCHAR(50) REFERENCES order_items(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_days INTEGER NOT NULL,
    rental_price NUMERIC(12, 2) NOT NULL,
    security_deposit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'ACTIVE', 'RETURN_PENDING', 'RETURNED', 'CANCELLED', 'OVERDUE')),
    returned_at TIMESTAMP WITH TIME ZONE,
    damage_amount NUMERIC(12, 2) DEFAULT 0,
    late_fee NUMERIC(12, 2) DEFAULT 0,
    refund_amount NUMERIC(12, 2) DEFAULT 0,
    deposit_status VARCHAR(30) DEFAULT 'HELD' CHECK (deposit_status IN ('HELD', 'REFUNDED', 'PARTIALLY_DEDUCTED', 'DEDUCTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Non-destructive migrations for existing databases
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_rentable BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rental_base_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rental_price_per_day NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_rental_days INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS maximum_rental_days INTEGER DEFAULT 7;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rental_deposit NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rental_available_stock INTEGER DEFAULT 1;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS rental_deposit_total NUMERIC(12, 2) DEFAULT 0;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20) NOT NULL DEFAULT 'BUY';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS rental_days INTEGER;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS rental_start_date DATE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS rental_end_date DATE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS rental_price NUMERIC(12, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(12, 2);

-- Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_rentable ON products(is_rentable);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_rentals_user ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_product ON rentals(product_id);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_order ON rentals(order_id);
