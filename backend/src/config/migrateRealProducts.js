// ==============================================================================
// HOUSE OF SHUBHANSHI — REAL PRODUCTS MIGRATION SCRIPT
// Safely archives demo/sample products and adds the real clothing collection.
// ==============================================================================
const db = require('./database');

async function migrateRealProducts() {
  await db.initDb();

  console.log('\n==================================================');
  console.log('HOUSE OF SHUBHANSHI: PRODUCT MIGRATION');
  console.log('==================================================\n');

  // 1. Identify and log existing products marked as demo/sample
  const existingProds = await db.query('SELECT id, name, slug, price, is_active FROM products ORDER BY id ASC');
  console.log('[Audit] Existing products in database:');
  console.table(existingProds.rows);

  const demoProductIds = ['prod_01', 'prod_02', 'prod_03', 'prod_04'];
  const demoFound = existingProds.rows.filter(p => demoProductIds.includes(p.id));

  console.log('\n[Demo Products Identified for Archiving]:');
  demoFound.forEach(p => {
    console.log(` - ID: ${p.id} | Name: "${p.name}" | Price: ₹${p.price} | Currently Active: ${p.is_active}`);
  });

  // Check which demo products are referenced in orders to preserve referential integrity
  const orderRefs = await db.query(
    'SELECT DISTINCT product_id FROM order_items WHERE product_id = ANY($1)',
    [demoProductIds]
  );
  const referencedIds = orderRefs.rows.map(r => r.product_id);
  console.log('\n[Referential Integrity Check]:');
  console.log(`Demo products referenced by historical orders: ${referencedIds.join(', ') || 'None'}`);
  console.log('Applying safe soft-delete (is_active = false) to ensure historical orders & rentals remain completely intact.\n');

  // 2. Soft-delete / archive all demo products
  await db.query(
    'UPDATE products SET is_active = false WHERE id = ANY($1)',
    [demoProductIds]
  );
  console.log('✔ All demo products marked as inactive (is_active = false). They will no longer appear on storefront or catalog.');

  // 3. Define the Real Products provided by User
  const realProducts = [
    {
      id: 'prod_real_purple',
      name: 'Purple Embroidered Kurta Set',
      slug: 'purple-embroidered-kurta-set',
      description: 'Deep purple straight-fit kurta set with delicate gold embroidery along the collar, placket, and cuffs. Accompanied by a matching sheer dupatta finished with fine scallop-edge detailing. Perfect for festive celebrations, poojas, and intimate gatherings.',
      price: 4499.00,
      compare_at_price: 5499.00,
      image: '/images/products/purple-suit-set.webp',
      images: JSON.stringify(['/images/products/purple-suit-set.webp', '/images/products/purple-suit-set.jpg']),
      category: 'Suit Sets',
      fabric: 'Silk Blend & Organza',
      color: 'Purple',
      size: 'S, M, L, XL',
      material: 'Silk Blend',
      featured: true,
      stock: 10,
      is_active: true,
      collection_id: 'col_01',
      is_rentable: true,
      rental_base_price: 1199.00,
      rental_price_per_day: 350.00,
      minimum_rental_days: 2,
      maximum_rental_days: 14,
      rental_deposit: 2500.00,
      rental_available_stock: 3
    },
    {
      id: 'prod_real_brown',
      name: 'Earth Brown Flared Lehenga Set',
      slug: 'earth-brown-flared-lehenga-set',
      description: 'Rich earthy brown flared lehenga skirt paired with a statement halter neck blouse adorned with ornate golden cutwork embroidery. Designed for fluid movement and an effortless festive silhouette.',
      price: 5599.00,
      compare_at_price: 6999.00,
      image: '/images/products/brown-lehenga-set.webp',
      images: JSON.stringify(['/images/products/brown-lehenga-set.webp', '/images/products/brown-lehenga-set.jpg']),
      category: 'Lehengas',
      fabric: 'Crepe Silk Blend',
      color: 'Brown',
      size: 'S, M, L, XL',
      material: 'Crepe Silk Blend',
      featured: true,
      stock: 8,
      is_active: true,
      collection_id: 'col_02',
      is_rentable: true,
      rental_base_price: 1499.00,
      rental_price_per_day: 450.00,
      minimum_rental_days: 2,
      maximum_rental_days: 14,
      rental_deposit: 3000.00,
      rental_available_stock: 3
    },
    {
      id: 'prod_real_green',
      name: 'Emerald Green Flared Anarkali Set',
      slug: 'emerald-green-flared-anarkali-set',
      description: 'Flared emerald green anarkali silhouette accented with soft gathers, paired with a royal blue contrast dupatta finished with an antique gold border and delicate scattered motifs. Ideal for sangeets, weddings, and evening soirees.',
      price: 6699.00,
      compare_at_price: 7999.00,
      image: '/images/products/green-anarkali-set.webp',
      images: JSON.stringify(['/images/products/green-anarkali-set.webp', '/images/products/green-anarkali-set.jpg']),
      category: 'Anarkalis',
      fabric: 'Georgette Silk Blend',
      color: 'Emerald Green',
      size: 'S, M, L, XL',
      material: 'Georgette Silk Blend',
      featured: true,
      stock: 6,
      is_active: true,
      collection_id: 'col_03',
      is_rentable: true,
      rental_base_price: 1799.00,
      rental_price_per_day: 550.00,
      minimum_rental_days: 2,
      maximum_rental_days: 14,
      rental_deposit: 3500.00,
      rental_available_stock: 3
    }
  ];

  // 4. Upsert Real Products
  console.log('\n[Inserting Real House of Shubhanshi Products]...');
  for (const prod of realProducts) {
    const check = await db.query('SELECT id FROM products WHERE id = $1 OR slug = $2', [prod.id, prod.slug]);
    if (check.rows.length > 0) {
      await db.query(`
        UPDATE products SET
          name = $2,
          slug = $3,
          description = $4,
          price = $5,
          compare_at_price = $6,
          image = $7,
          images = $8,
          category = $9,
          fabric = $10,
          color = $11,
          size = $12,
          material = $13,
          featured = $14,
          stock = $15,
          is_active = $16,
          collection_id = $17,
          is_rentable = $18,
          rental_base_price = $19,
          rental_price_per_day = $20,
          minimum_rental_days = $21,
          maximum_rental_days = $22,
          rental_deposit = $23,
          rental_available_stock = $24,
          updated_at = NOW()
        WHERE id = $1
      `, [
        prod.id, prod.name, prod.slug, prod.description, prod.price, prod.compare_at_price,
        prod.image, prod.images, prod.category, prod.fabric, prod.color, prod.size, prod.material,
        prod.featured, prod.stock, prod.is_active, prod.collection_id, prod.is_rentable,
        prod.rental_base_price, prod.rental_price_per_day, prod.minimum_rental_days,
        prod.maximum_rental_days, prod.rental_deposit, prod.rental_available_stock
      ]);
      console.log(` ✔ Updated existing real product: "${prod.name}" (₹${prod.price})`);
    } else {
      await db.query(`
        INSERT INTO products (
          id, name, slug, description, price, compare_at_price, image, images, category,
          fabric, color, size, material, featured, stock, is_active, collection_id,
          is_rentable, rental_base_price, rental_price_per_day, minimum_rental_days,
          maximum_rental_days, rental_deposit, rental_available_stock, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()
        )
      `, [
        prod.id, prod.name, prod.slug, prod.description, prod.price, prod.compare_at_price,
        prod.image, prod.images, prod.category, prod.fabric, prod.color, prod.size, prod.material,
        prod.featured, prod.stock, prod.is_active, prod.collection_id, prod.is_rentable,
        prod.rental_base_price, prod.rental_price_per_day, prod.minimum_rental_days,
        prod.maximum_rental_days, prod.rental_deposit, prod.rental_available_stock
      ]);
      console.log(` ✔ Inserted real product: "${prod.name}" (₹${prod.price})`);
    }
  }

  // 5. Verify final active catalog
  const activeCatalog = await db.query('SELECT id, name, slug, price, is_rentable, rental_base_price, is_active FROM products WHERE is_active = true ORDER BY price ASC');
  console.log('\n[Active Storefront Products Verification]:');
  console.table(activeCatalog.rows);

  console.log('\n==================================================');
  console.log('MIGRATION COMPLETED SUCCESSFULLY');
  console.log('==================================================\n');
}

if (require.main === module) {
  migrateRealProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateRealProducts;
