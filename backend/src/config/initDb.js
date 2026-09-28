// ==============================================================================
// HOUSE OF SHUBHANSHI — DATABASE INITIALIZATION & SEED CLI SCRIPT
// ==============================================================================
const db = require('./db');

async function run() {
  console.log('[InitDb] Starting database initialization & schema synchronization...');
  await db.initDb();
  console.log('[InitDb] Verification query:');
  const users = await db.user.findMany();
  const products = await db.product.findMany();
  const collections = await db.collection.findMany();
  const orders = await db.order.findMany();
  console.log(`[InitDb] Status: Users=${users.length}, Collections=${collections.length}, Products=${products.length}, Orders=${orders.length}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[InitDb Error]', err);
  process.exit(1);
});
