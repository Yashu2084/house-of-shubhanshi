// ==============================================================================
// HOUSE OF SHUBHANSHI — SECURE ADMIN CREATION / RESET CLI SCRIPT
// Usage:
//   node backend/src/scripts/create-admin.js [email] [password] [name] [phone]
// Or via environment variables:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node backend/src/scripts/create-admin.js
// ==============================================================================
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function setupAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@houseofshubhanshi.com').trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_PASSWORD || 'Admin@Shubhanshi2026!';
  const name = args[2] || process.env.ADMIN_NAME || 'House of Shubhanshi Owner';
  const phone = args[3] || process.env.ADMIN_PHONE || '+91 9560011351';

  if (!email || !password) {
    console.error('Error: Email and password are required.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('HOUSE OF SHUBHANSHI — SECURE ATELIER ADMIN SETUP');
  console.log('================================================================');
  console.log(`Setting up Admin Account for: ${email}`);

  // Test DB connection
  const isConnected = await db.testConnection();
  if (!isConnected) {
    console.log('Connecting to database...');
  }

  const existing = await db.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    console.log(`Found existing user with email "${email}". Updating to ADMIN with new password...`);
    await db.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        passwordHash,
        name,
        phone
      }
    });
    console.log('✓ Admin account updated successfully!');
  } else {
    console.log(`Creating new ADMIN user for "${email}"...`);
    const adminId = `usr_admin_${Date.now().toString(36)}`;
    await db.user.create({
      data: {
        id: adminId,
        name,
        email,
        phone,
        passwordHash,
        role: 'ADMIN'
      }
    });
    console.log('✓ New Admin account created successfully!');
  }

  console.log('\n----------------------------------------------------------------');
  console.log('CLIENT HANDOVER DETAILS:');
  console.log('----------------------------------------------------------------');
  console.log(`  Admin Login URL: http://localhost:3000/admin/login`);
  console.log(`  Email:           ${email}`);
  console.log(`  Temporary Pass:  ${password}`);
  console.log(`  Role:            ADMIN`);
  console.log('----------------------------------------------------------------');
  console.log('Security Note: Instruct the client to change their password via');
  console.log('the "Settings & Security" tab immediately after their initial login.');
  console.log('================================================================\n');

  process.exit(0);
}

setupAdmin().catch((err) => {
  console.error('Admin setup failed:', err);
  process.exit(1);
});
