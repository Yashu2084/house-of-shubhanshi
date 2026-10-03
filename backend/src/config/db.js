// ==============================================================================
// HOUSE OF SHUBHANSHI — UNIFIED POSTGRESQL DATA ACCESS LAYER
// Fully parameterized SQL queries powered by pg driver + PostgreSQL
// ==============================================================================
const database = require('./database');

// Field mapping helpers: Database snake_case -> Application camelCase
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
    dob: row.dob,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

function mapCollection(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    isActive: !!row.is_active,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: parseFloat(row.price),
    compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
    image: row.image,
    images: row.images,
    category: row.category,
    fabric: row.fabric,
    color: row.color,
    size: row.size,
    material: row.material,
    featured: !!row.featured,
    stock: parseInt(row.stock, 10),
    isActive: !!row.is_active,
    collectionId: row.collection_id,
    isRentable: !!row.is_rentable,
    rentalBasePrice: row.rental_base_price ? parseFloat(row.rental_base_price) : 0,
    rentalPricePerDay: row.rental_price_per_day ? parseFloat(row.rental_price_per_day) : 0,
    minimumRentalDays: row.minimum_rental_days ? parseInt(row.minimum_rental_days, 10) : 1,
    maximumRentalDays: row.maximum_rental_days ? parseInt(row.maximum_rental_days, 10) : 7,
    rentalDeposit: row.rental_deposit ? parseFloat(row.rental_deposit) : 0,
    rentalAvailableStock: row.rental_available_stock !== undefined && row.rental_available_stock !== null ? parseInt(row.rental_available_stock, 10) : 1,
    views: parseInt(row.views || 0, 10),
    lengths: row.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom',
    customLengthAvailable: row.custom_length_available !== undefined ? !!row.custom_length_available : true,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    collection: row.col_name ? {
      id: row.collection_id,
      name: row.col_name,
      slug: row.col_slug
    } : undefined
  };
}

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    totalAmount: parseFloat(row.total_amount),
    rentalDepositTotal: row.rental_deposit_total ? parseFloat(row.rental_deposit_total) : 0,
    status: row.status,
    paymentStatus: row.payment_status,
    shippingAddress: row.shipping_address,
    phone: row.phone,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    user: row.user_name ? {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      phone: row.user_phone
    } : undefined
  };
}

function mapOrderItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: parseInt(row.quantity, 10),
    price: parseFloat(row.price),
    purchaseType: row.purchase_type || 'BUY',
    rentalDays: row.rental_days ? parseInt(row.rental_days, 10) : null,
    rentalStartDate: row.rental_start_date ? (row.rental_start_date instanceof Date ? row.rental_start_date.toISOString().split('T')[0] : String(row.rental_start_date).split('T')[0]) : null,
    rentalEndDate: row.rental_end_date ? (row.rental_end_date instanceof Date ? row.rental_end_date.toISOString().split('T')[0] : String(row.rental_end_date).split('T')[0]) : null,
    rentalPrice: row.rental_price ? parseFloat(row.rental_price) : null,
    securityDeposit: row.security_deposit ? parseFloat(row.security_deposit) : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
  };
}

function mapRental(row) {
  if (!row) return null;
  const sDate = row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : String(row.start_date).split('T')[0];
  const eDate = row.end_date instanceof Date ? row.end_date.toISOString().split('T')[0] : String(row.end_date).split('T')[0];

  let status = row.status;
  if (['RESERVED', 'ACTIVE', 'RETURN_PENDING'].includes(status)) {
    const today = new Date().toISOString().split('T')[0];
    if (today > eDate) {
      status = 'OVERDUE';
    }
  }

  return {
    id: row.id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    productId: row.product_id,
    userId: row.user_id,
    startDate: sDate,
    endDate: eDate,
    rentalDays: parseInt(row.rental_days, 10),
    rentalPrice: parseFloat(row.rental_price),
    securityDeposit: parseFloat(row.security_deposit || 0),
    status,
    rawStatus: row.status,
    returnedAt: row.returned_at ? new Date(row.returned_at).toISOString() : null,
    damageAmount: parseFloat(row.damage_amount || 0),
    lateFee: parseFloat(row.late_fee || 0),
    refundAmount: parseFloat(row.refund_amount || 0),
    depositStatus: row.deposit_status || 'HELD',
    productName: row.prod_name || null,
    orderNumber: row.order_number || null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    product: row.prod_name ? {
      id: row.product_id,
      name: row.prod_name,
      slug: row.prod_slug,
      image: row.prod_image,
      category: row.prod_category,
      rentalDeposit: row.prod_rental_deposit ? parseFloat(row.prod_rental_deposit) : 0
    } : undefined,
    user: row.user_name ? {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      phone: row.user_phone
    } : undefined,
    order: row.order_number ? {
      id: row.order_id,
      orderNumber: row.order_number
    } : undefined
  };
}

const db = {
  query: database.query,
  transaction: database.transaction,
  initDb: database.initDb,
  testConnection: database.testConnection,
  get isPostgresConnected() {
    return database.isPostgresConnected;
  },
  get isEmbeddedPostgres() {
    return database.isEmbeddedPostgres;
  },

  // USER REPOSITORY (Parameterized PostgreSQL SQL)
  user: {
    findUnique: async ({ where }) => {
      let res;
      if (where.id) {
        res = await database.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [where.id]);
      } else if (where.email) {
        res = await database.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [where.email]);
      } else {
        return null;
      }
      return mapUser(res.rows[0]);
    },

    findFirst: async ({ where }) => {
      const conditions = [];
      const params = [];
      if (where.email) {
        params.push(where.email);
        conditions.push(`LOWER(email) = LOWER($${params.length})`);
      }
      if (where.role) {
        params.push(where.role);
        conditions.push(`role = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT * FROM users ${whereClause} LIMIT 1`, params);
      return mapUser(res.rows[0]);
    },

    findMany: async (args = {}) => {
      const conditions = [];
      const params = [];
      if (args.where?.role) {
        params.push(args.where.role);
        conditions.push(`role = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT * FROM users ${whereClause} ORDER BY created_at DESC`, params);
      return res.rows.map(mapUser);
    },

    count: async (args = {}) => {
      const conditions = [];
      const params = [];
      if (args.where?.role) {
        params.push(args.where.role);
        conditions.push(`role = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
      return parseInt(res.rows[0].count, 10);
    },

    create: async ({ data }) => {
      const id = data.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const res = await database.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, dob, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          id,
          data.name,
          data.email.toLowerCase(),
          data.phone || null,
          data.passwordHash,
          data.role || 'CUSTOMER',
          data.dob || null
        ]
      );
      return mapUser(res.rows[0]);
    },

    update: async ({ where, data }) => {
      const fields = [];
      const params = [];

      if (data.name !== undefined) {
        params.push(data.name);
        fields.push(`name = $${params.length}`);
      }
      if (data.phone !== undefined) {
        params.push(data.phone);
        fields.push(`phone = $${params.length}`);
      }
      if (data.dob !== undefined) {
        params.push(data.dob);
        fields.push(`dob = $${params.length}`);
      }
      if (data.passwordHash !== undefined) {
        params.push(data.passwordHash);
        fields.push(`password_hash = $${params.length}`);
      }

      fields.push(`updated_at = NOW()`);
      params.push(where.id);

      const res = await database.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (res.rows.length === 0) throw new Error('User not found');
      return mapUser(res.rows[0]);
    }
  },

  // COLLECTION REPOSITORY
  collection: {
    findUnique: async ({ where, include }) => {
      let res;
      if (where.id) {
        res = await database.query('SELECT * FROM collections WHERE id = $1 LIMIT 1', [where.id]);
      } else if (where.slug) {
        res = await database.query('SELECT * FROM collections WHERE slug = $1 LIMIT 1', [where.slug]);
      } else {
        return null;
      }
      if (res.rows.length === 0) return null;
      const col = mapCollection(res.rows[0]);

      if (include?.products) {
        const prodRes = await database.query('SELECT * FROM products WHERE collection_id = $1 AND is_active = true', [col.id]);
        col.products = prodRes.rows.map(mapProduct);
      }
      return col;
    },

    findMany: async (args = {}) => {
      const conditions = [];
      const params = [];

      if (args.where?.isActive !== undefined) {
        params.push(args.where.isActive);
        conditions.push(`is_active = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT * FROM collections ${whereClause} ORDER BY created_at ASC`, params);
      const collections = res.rows.map(mapCollection);

      if (args.include?.products) {
        for (const col of collections) {
          const prodRes = await database.query('SELECT * FROM products WHERE collection_id = $1', [col.id]);
          col.products = prodRes.rows.map(mapProduct);
        }
      }
      return collections;
    },

    count: async (args = {}) => {
      const conditions = [];
      const params = [];
      if (args.where?.isActive !== undefined) {
        params.push(args.where.isActive);
        conditions.push(`is_active = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT COUNT(*) as count FROM collections ${whereClause}`, params);
      return parseInt(res.rows[0].count, 10);
    },

    create: async ({ data }) => {
      const id = data.id || `col_${Date.now()}`;
      const res = await database.query(
        `INSERT INTO collections (id, name, slug, description, image, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          id,
          data.name,
          data.slug,
          data.description || null,
          data.image || null,
          data.isActive !== undefined ? data.isActive : true
        ]
      );
      return mapCollection(res.rows[0]);
    },

    update: async ({ where, data }) => {
      const fields = [];
      const params = [];

      if (data.name !== undefined) {
        params.push(data.name);
        fields.push(`name = $${params.length}`);
      }
      if (data.slug !== undefined) {
        params.push(data.slug);
        fields.push(`slug = $${params.length}`);
      }
      if (data.description !== undefined) {
        params.push(data.description);
        fields.push(`description = $${params.length}`);
      }
      if (data.image !== undefined) {
        params.push(data.image);
        fields.push(`image = $${params.length}`);
      }
      if (data.isActive !== undefined) {
        params.push(data.isActive);
        fields.push(`is_active = $${params.length}`);
      }

      fields.push(`updated_at = NOW()`);
      params.push(where.id);

      const res = await database.query(
        `UPDATE collections SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (res.rows.length === 0) throw new Error('Collection not found');
      return mapCollection(res.rows[0]);
    },

    delete: async ({ where }) => {
      const res = await database.query('DELETE FROM collections WHERE id = $1 RETURNING *', [where.id]);
      if (res.rows.length === 0) throw new Error('Collection not found');
      return mapCollection(res.rows[0]);
    }
  },

  // PRODUCT REPOSITORY
  product: {
    findUnique: async ({ where, include }) => {
      let res;
      if (where.id) {
        res = await database.query(
          `SELECT p.*, c.name as col_name, c.slug as col_slug 
           FROM products p 
           LEFT JOIN collections c ON p.collection_id = c.id 
           WHERE p.id = $1 LIMIT 1`,
          [where.id]
        );
      } else if (where.slug) {
        res = await database.query(
          `SELECT p.*, c.name as col_name, c.slug as col_slug 
           FROM products p 
           LEFT JOIN collections c ON p.collection_id = c.id 
           WHERE p.slug = $1 LIMIT 1`,
          [where.slug]
        );
      } else {
        return null;
      }
      if (res.rows.length === 0) return null;
      return mapProduct(res.rows[0]);
    },

    findMany: async (args = {}) => {
      const conditions = [];
      const params = [];

      if (args.where?.isActive !== undefined) {
        params.push(args.where.isActive);
        conditions.push(`p.is_active = $${params.length}`);
      }
      if (args.where?.collectionId) {
        params.push(args.where.collectionId);
        conditions.push(`p.collection_id = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(
        `SELECT p.*, c.name as col_name, c.slug as col_slug 
         FROM products p 
         LEFT JOIN collections c ON p.collection_id = c.id 
         ${whereClause} 
         ORDER BY p.created_at ASC`,
        params
      );
      return res.rows.map(mapProduct);
    },

    count: async (args = {}) => {
      const conditions = [];
      const params = [];
      if (args.where?.isActive !== undefined) {
        params.push(args.where.isActive);
        conditions.push(`is_active = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT COUNT(*) as count FROM products ${whereClause}`, params);
      return parseInt(res.rows[0].count, 10);
    },

    create: async ({ data }) => {
      const id = data.id || `prod_${Date.now()}`;
      const res = await database.query(
        `INSERT INTO products (
          id, name, slug, description, price, compare_at_price, image, images,
          category, fabric, color, size, material, featured, stock, is_active,
          collection_id, is_rentable, rental_base_price, rental_price_per_day,
          minimum_rental_days, maximum_rental_days, rental_deposit, rental_available_stock,
          views, lengths, custom_length_available,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW(), NOW())
        RETURNING *`,
        [
          id,
          data.name,
          data.slug,
          data.description,
          data.price,
          data.compareAtPrice || null,
          data.image,
          data.images || null,
          data.category || null,
          data.fabric || null,
          data.color || null,
          data.size || null,
          data.material || null,
          data.featured !== undefined ? data.featured : false,
          data.stock !== undefined ? data.stock : 10,
          data.isActive !== undefined ? data.isActive : true,
          data.collectionId || null,
          data.isRentable !== undefined ? !!data.isRentable : false,
          data.rentalBasePrice !== undefined ? parseFloat(data.rentalBasePrice) : 0,
          data.rentalPricePerDay !== undefined ? parseFloat(data.rentalPricePerDay) : 0,
          data.minimumRentalDays !== undefined ? parseInt(data.minimumRentalDays, 10) : 1,
          data.maximumRentalDays !== undefined ? parseInt(data.maximumRentalDays, 10) : 7,
          data.rentalDeposit !== undefined ? parseFloat(data.rentalDeposit) : 0,
          data.rentalAvailableStock !== undefined ? parseInt(data.rentalAvailableStock, 10) : 1,
          data.views !== undefined ? parseInt(data.views, 10) : 0,
          data.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom',
          data.customLengthAvailable !== undefined ? !!data.customLengthAvailable : true
        ]
      );
      return mapProduct(res.rows[0]);
    },

    update: async ({ where, data }) => {
      const fields = [];
      const params = [];

      const mapping = {
        name: 'name',
        slug: 'slug',
        description: 'description',
        price: 'price',
        compareAtPrice: 'compare_at_price',
        image: 'image',
        images: 'images',
        category: 'category',
        fabric: 'fabric',
        color: 'color',
        size: 'size',
        material: 'material',
        featured: 'featured',
        stock: 'stock',
        isActive: 'is_active',
        collectionId: 'collection_id',
        isRentable: 'is_rentable',
        rentalBasePrice: 'rental_base_price',
        rentalPricePerDay: 'rental_price_per_day',
        minimumRentalDays: 'minimum_rental_days',
        maximumRentalDays: 'maximum_rental_days',
        rentalDeposit: 'rental_deposit',
        rentalAvailableStock: 'rental_available_stock',
        views: 'views',
        lengths: 'lengths',
        customLengthAvailable: 'custom_length_available'
      };

      for (const [key, col] of Object.entries(mapping)) {
        if (data[key] !== undefined) {
          params.push(data[key]);
          fields.push(`${col} = $${params.length}`);
        }
      }

      fields.push(`updated_at = NOW()`);
      params.push(where.id);

      const res = await database.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (res.rows.length === 0) throw new Error('Product not found');
      return mapProduct(res.rows[0]);
    },

    incrementViews: async (id) => {
      const res = await database.query(
        `UPDATE products SET views = COALESCE(views, 0) + 1 WHERE id = $1 or slug = $1 RETURNING *`,
        [id]
      );
      if (res.rows.length === 0) return null;
      return mapProduct(res.rows[0]);
    },

    delete: async ({ where }) => {
      const res = await database.query('DELETE FROM products WHERE id = $1 RETURNING *', [where.id]);
      if (res.rows.length === 0) throw new Error('Product not found');
      return mapProduct(res.rows[0]);
    }
  },

  // ORDER REPOSITORY
  order: {
    findUnique: async ({ where, include }) => {
      let res;
      if (where.id) {
        res = await database.query(
          `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
           FROM orders o
           JOIN users u ON o.user_id = u.id
           WHERE o.id = $1 LIMIT 1`,
          [where.id]
        );
      } else if (where.orderNumber) {
        res = await database.query(
          `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
           FROM orders o
           JOIN users u ON o.user_id = u.id
           WHERE o.order_number = $1 LIMIT 1`,
          [where.orderNumber]
        );
      } else {
        return null;
      }

      if (res.rows.length === 0) return null;
      const order = mapOrder(res.rows[0]);

      if (include?.items) {
        const itemsRes = await database.query(
          'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
          [order.id]
        );
        order.items = itemsRes.rows.map(mapOrderItem);
      }

      return order;
    },

    findMany: async (args = {}) => {
      const conditions = [];
      const params = [];

      if (args.where?.userId) {
        params.push(args.where.userId);
        conditions.push(`o.user_id = $${params.length}`);
      }
      if (args.where?.status) {
        params.push(args.where.status);
        conditions.push(`o.status = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(
        `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
         FROM orders o
         JOIN users u ON o.user_id = u.id
         ${whereClause}
         ORDER BY o.created_at DESC`,
        params
      );

      const orders = res.rows.map(mapOrder);

      if (args.include?.items && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(',');
        const itemsRes = await database.query(
          `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`,
          orderIds
        );
        const items = itemsRes.rows.map(mapOrderItem);
        orders.forEach(o => {
          o.items = items.filter(it => it.orderId === o.id);
        });
      }

      return orders;
    },

    count: async (args = {}) => {
      const conditions = [];
      const params = [];
      if (args.where?.userId) {
        params.push(args.where.userId);
        conditions.push(`user_id = $${params.length}`);
      }
      if (args.where?.status) {
        params.push(args.where.status);
        conditions.push(`status = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT COUNT(*) as count FROM orders ${whereClause}`, params);
      return parseInt(res.rows[0].count, 10);
    },

    create: async ({ data, include }) => {
      const id = data.id || `ord_${Date.now()}`;
      const res = await database.query(
        `INSERT INTO orders (
          id, order_number, user_id, total_amount, rental_deposit_total, status, payment_status,
          shipping_address, phone, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          id,
          data.orderNumber,
          data.userId,
          data.totalAmount,
          data.rentalDepositTotal || 0,
          data.status || 'RECEIVED',
          data.paymentStatus || 'PENDING',
          data.shippingAddress,
          data.phone
        ]
      );

      const order = mapOrder(res.rows[0]);

      if (data.items?.create) {
        const itemsList = Array.isArray(data.items.create) ? data.items.create : [data.items.create];
        const createdItems = [];
        for (const it of itemsList) {
          const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          const itRes = await database.query(
            `INSERT INTO order_items (
              id, order_id, product_id, product_name, quantity, price,
              purchase_type, rental_days, rental_start_date, rental_end_date, rental_price, security_deposit,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
            RETURNING *`,
            [
              itemId,
              id,
              it.productId || null,
              it.productName,
              it.quantity || 1,
              it.price,
              it.purchaseType || 'BUY',
              it.rentalDays || null,
              it.rentalStartDate || null,
              it.rentalEndDate || null,
              it.rentalPrice || null,
              it.securityDeposit || null
            ]
          );
          createdItems.push(mapOrderItem(itRes.rows[0]));
        }
        order.items = createdItems;
      }

      return order;
    },

    update: async ({ where, data, include }) => {
      const fields = [];
      const params = [];

      if (data.status !== undefined) {
        params.push(data.status);
        fields.push(`status = $${params.length}`);
      }
      if (data.paymentStatus !== undefined) {
        params.push(data.paymentStatus);
        fields.push(`payment_status = $${params.length}`);
      }

      fields.push(`updated_at = NOW()`);
      params.push(where.id);

      const res = await database.query(
        `UPDATE orders SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (res.rows.length === 0) throw new Error('Order not found');
      const order = mapOrder(res.rows[0]);

      if (include?.items) {
        const itemsRes = await database.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
        order.items = itemsRes.rows.map(mapOrderItem);
      }
      if (include?.user) {
        const uRes = await database.query('SELECT * FROM users WHERE id = $1', [order.userId]);
        order.user = mapUser(uRes.rows[0]);
      }
      return order;
    }
  },

  // ORDER ITEM REPOSITORY
  orderItem: {
    findMany: async (args = {}) => {
      const conditions = [];
      const params = [];
      if (args.where?.orderId) {
        params.push(args.where.orderId);
        conditions.push(`order_id = $${params.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT * FROM order_items ${whereClause} ORDER BY created_at ASC`, params);
      return res.rows.map(mapOrderItem);
    }
  },

  // RENTAL REPOSITORY
  rental: {
    findUnique: async ({ where, include }) => {
      let res;
      if (where.id) {
        res = await database.query(
          `SELECT r.*, 
                  p.name as prod_name, p.slug as prod_slug, p.image as prod_image, p.category as prod_category, p.rental_deposit as prod_rental_deposit,
                  u.name as user_name, u.email as user_email, u.phone as user_phone,
                  o.order_number
           FROM rentals r
           LEFT JOIN products p ON r.product_id = p.id
           LEFT JOIN users u ON r.user_id = u.id
           LEFT JOIN orders o ON r.order_id = o.id
           WHERE r.id = $1 LIMIT 1`,
          [where.id]
        );
      } else {
        return null;
      }
      if (res.rows.length === 0) return null;
      return mapRental(res.rows[0]);
    },

    findMany: async (args = {}) => {
      const conditions = [];
      const params = [];

      if (args.where?.userId) {
        params.push(args.where.userId);
        conditions.push(`r.user_id = $${params.length}`);
      }
      if (args.where?.productId) {
        params.push(args.where.productId);
        conditions.push(`r.product_id = $${params.length}`);
      }
      if (args.where?.orderId) {
        params.push(args.where.orderId);
        conditions.push(`r.order_id = $${params.length}`);
      }
      if (args.where?.status) {
        if (args.where.status === 'OVERDUE') {
          conditions.push(`r.status IN ('RESERVED', 'ACTIVE', 'RETURN_PENDING') AND r.end_date < CURRENT_DATE`);
        } else {
          params.push(args.where.status);
          conditions.push(`r.status = $${params.length}`);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderBy = args.orderBy || 'r.created_at DESC';

      const res = await database.query(
        `SELECT r.*, 
                p.name as prod_name, p.slug as prod_slug, p.image as prod_image, p.category as prod_category, p.rental_deposit as prod_rental_deposit,
                u.name as user_name, u.email as user_email, u.phone as user_phone,
                o.order_number
         FROM rentals r
         LEFT JOIN products p ON r.product_id = p.id
         LEFT JOIN users u ON r.user_id = u.id
         LEFT JOIN orders o ON r.order_id = o.id
         ${whereClause}
         ORDER BY ${orderBy}`,
        params
      );

      return res.rows.map(mapRental);
    },

    count: async (args = {}) => {
      const conditions = [];
      const params = [];
      if (args.where?.userId) {
        params.push(args.where.userId);
        conditions.push(`user_id = $${params.length}`);
      }
      if (args.where?.productId) {
        params.push(args.where.productId);
        conditions.push(`product_id = $${params.length}`);
      }
      if (args.where?.status) {
        if (args.where.status === 'OVERDUE') {
          conditions.push(`status IN ('RESERVED', 'ACTIVE', 'RETURN_PENDING') AND end_date < CURRENT_DATE`);
        } else {
          params.push(args.where.status);
          conditions.push(`status = $${params.length}`);
        }
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await database.query(`SELECT COUNT(*) as count FROM rentals ${whereClause}`, params);
      return parseInt(res.rows[0].count, 10);
    },

    create: async ({ data }) => {
      const id = data.id || `rnt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const res = await database.query(
        `INSERT INTO rentals (
          id, order_id, order_item_id, product_id, user_id,
          start_date, end_date, rental_days, rental_price,
          security_deposit, status, deposit_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *`,
        [
          id,
          data.orderId,
          data.orderItemId || null,
          data.productId,
          data.userId,
          data.startDate,
          data.endDate,
          data.rentalDays,
          data.rentalPrice,
          data.securityDeposit || 0,
          data.status || 'RESERVED',
          data.depositStatus || 'HELD'
        ]
      );
      return mapRental(res.rows[0]);
    },

    update: async ({ where, data }) => {
      const fields = [];
      const params = [];

      const mapping = {
        status: 'status',
        depositStatus: 'deposit_status',
        returnedAt: 'returned_at',
        damageAmount: 'damage_amount',
        lateFee: 'late_fee',
        refundAmount: 'refund_amount'
      };

      for (const [key, col] of Object.entries(mapping)) {
        if (data[key] !== undefined) {
          params.push(data[key]);
          fields.push(`${col} = $${params.length}`);
        }
      }

      fields.push(`updated_at = NOW()`);
      params.push(where.id);

      const res = await database.query(
        `UPDATE rentals SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (res.rows.length === 0) throw new Error('Rental reservation not found');
      return mapRental(res.rows[0]);
    },

    delete: async ({ where }) => {
      const res = await database.query('DELETE FROM rentals WHERE id = $1 RETURNING *', [where.id]);
      if (res.rows.length === 0) throw new Error('Rental reservation not found');
      return mapRental(res.rows[0]);
    }
  }
};

module.exports = db;
