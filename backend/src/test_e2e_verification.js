// ==============================================================================
// HOUSE OF SHUBHANSHI — END-TO-END VERIFICATION TEST SUITE
// Tests Real Products, Soft-Deleted Demo Data, Authentication, and Authorization
// ==============================================================================
const http = require('http');
const app = require('./server');

function makeRequest(port, path, method = 'GET', body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { 'Cookie': cookie } : {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STARTING HOUSE OF SHUBHANSHI E2E TEST SUITE');
  console.log('==================================================\n');

  await app.startServer();
  const PORT = 3001;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: REAL PRODUCTS & CATALOG
  // ----------------------------------------------------------------------------
  console.log('\n--- GROUP 1: REAL PRODUCTS & CATALOG ---');
  const prodsRes = await makeRequest(PORT, '/api/products');
  assert(prodsRes.status === 200, 'GET /api/products returns status 200');
  assert(Array.isArray(prodsRes.data.data), 'GET /api/products returns array of products');

  const products = prodsRes.data.data;
  assert(products.length === 3, `Catalog displays exactly 3 active real products (found: ${products.length})`);

  const purple = products.find(p => p.id === 'prod_real_purple');
  const brown = products.find(p => p.id === 'prod_real_brown');
  const green = products.find(p => p.id === 'prod_real_green');

  assert(purple && purple.price === 4499, 'Purple outfit exists with exact price ₹4499');
  assert(brown && brown.price === 5599, 'Brown outfit exists with exact price ₹5599');
  assert(green && green.price === 6699, 'Green outfit exists with exact price ₹6699');

  assert(purple && purple.isRentable === true, 'Purple outfit supports RENT (rental available)');
  assert(brown && brown.isRentable === true, 'Brown outfit supports RENT (rental available)');
  assert(green && green.isRentable === true, 'Green outfit supports RENT (rental available)');

  // Test single product by slug
  const slugRes = await makeRequest(PORT, `/api/products/${purple.slug}`);
  assert(slugRes.status === 200, `GET /api/products/${purple.slug} returns status 200`);
  assert(slugRes.data.data.name === purple.name, 'Product by slug matches Purple outfit name');

  // Verify demo products are archived (is_active = false)
  const allProdsRes = await makeRequest(PORT, '/api/products?includeInactive=true');
  const demo01 = allProdsRes.data.data.find(p => p.id === 'prod_01');
  assert(demo01 && demo01.isActive === false, 'Demo product "The Noor Set" is archived with isActive = false');

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: AUTHENTICATION FLOW & VERIFICATION
  // ----------------------------------------------------------------------------
  console.log('\n--- GROUP 2: AUTHENTICATION & /api/auth/me ---');

  // 2.1 Admin Login
  const adminLogin = await makeRequest(PORT, '/api/auth/login', 'POST', {
    email: 'admin@houseofshubhanshi.com',
    password: 'Admin@Shubhanshi2026!'
  });
  assert(adminLogin.status === 200, 'Admin login returns status 200');
  assert(adminLogin.data.user.role === 'ADMIN', 'Admin login returns role = "ADMIN"');

  const adminSetCookie = adminLogin.headers['set-cookie'];
  assert(adminSetCookie && adminSetCookie.length > 0, 'Admin login returns Set-Cookie header');
  const adminCookie = adminSetCookie ? adminSetCookie[0].split(';')[0] : '';
  assert(adminCookie.startsWith('token='), 'Cookie contains signed JWT token');

  // Call /api/auth/me with Admin Cookie (Requirement 17)
  const adminMe = await makeRequest(PORT, '/api/auth/me', 'GET', null, adminCookie);
  assert(adminMe.status === 200, 'GET /api/auth/me with admin cookie returns status 200');
  assert(adminMe.data.user.role === 'ADMIN', 'GET /api/auth/me identifies user as ADMIN');

  // Admin access to protected admin route
  const adminOverview = await makeRequest(PORT, '/api/admin/overview', 'GET', null, adminCookie);
  assert(adminOverview.status === 200, 'Admin successfully accesses GET /api/admin/overview');

  // 2.2 Customer Login
  const custLogin = await makeRequest(PORT, '/api/auth/login', 'POST', {
    email: 'yash@example.com',
    password: 'Customer@2026'
  });
  assert(custLogin.status === 200, 'Customer login returns status 200');
  assert(custLogin.data.user.role === 'CUSTOMER', 'Customer login returns role = "CUSTOMER"');

  const custSetCookie = custLogin.headers['set-cookie'];
  const custCookie = custSetCookie ? custSetCookie[0].split(';')[0] : '';

  // Call /api/auth/me with Customer Cookie
  const custMe = await makeRequest(PORT, '/api/auth/me', 'GET', null, custCookie);
  assert(custMe.status === 200, 'GET /api/auth/me with customer cookie returns status 200');
  assert(custMe.data.user.role === 'CUSTOMER', 'GET /api/auth/me identifies user as CUSTOMER');

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: SECURITY & ACCESS CONTROL
  // ----------------------------------------------------------------------------
  console.log('\n--- GROUP 3: SECURITY & AUTHORIZATION ---');

  // Customer attempts to access Admin API -> Must return 403 Forbidden
  const forbiddenRes = await makeRequest(PORT, '/api/admin/overview', 'GET', null, custCookie);
  assert(forbiddenRes.status === 403, 'Customer denied access to /api/admin/overview (Status 403 Forbidden)');

  // Unauthenticated request to /api/admin/overview -> Must return 401
  const anonAdminRes = await makeRequest(PORT, '/api/admin/overview', 'GET');
  assert(anonAdminRes.status === 401, 'Anonymous request denied access to /api/admin/overview (Status 401)');

  // Unauthenticated request to /api/auth/me -> Must return 401
  const anonMeRes = await makeRequest(PORT, '/api/auth/me', 'GET');
  assert(anonMeRes.status === 401, 'Anonymous request to /api/auth/me returns 401 Unauthenticated');

  // Wrong password attempt -> Returns 401 with clean error
  const wrongPassRes = await makeRequest(PORT, '/api/auth/login', 'POST', {
    email: 'yash@example.com',
    password: 'WrongPassword123!'
  });
  assert(wrongPassRes.status === 401, 'Wrong password returns status 401');
  assert(wrongPassRes.data.message === 'Invalid email or password.', 'Error message does not leak system/DB details');

  // 2.3 New Customer Signup (Requirement 19)
  console.log('\n--- GROUP 4: NEW CUSTOMER SIGNUP & SESSION ---');
  const testEmail = `patron_${Date.now()}@houseofshubhanshi.in`;
  const signupRes = await makeRequest(PORT, '/api/auth/signup', 'POST', {
    name: 'Shubha Patel',
    email: testEmail,
    phone: '+91 9820011223',
    password: 'SecurePassword2026!',
    confirmPassword: 'SecurePassword2026!'
  });
  assert(signupRes.status === 201, 'POST /api/auth/signup returns status 201 Created');
  assert(signupRes.data.user.role === 'CUSTOMER', 'New user role is strictly enforced as CUSTOMER');

  const newCustCookie = signupRes.headers['set-cookie'] ? signupRes.headers['set-cookie'][0].split(';')[0] : '';
  const newCustMe = await makeRequest(PORT, '/api/auth/me', 'GET', null, newCustCookie);
  assert(newCustMe.status === 200, 'GET /api/auth/me identifies newly registered customer');
  assert(newCustMe.data.user.name === 'Shubha Patel', 'User profile persists correctly in PostgreSQL');

  // 2.4 Logout
  const logoutRes = await makeRequest(PORT, '/api/auth/logout', 'POST', {}, newCustCookie);
  assert(logoutRes.status === 200, 'POST /api/auth/logout returns status 200');

  // ----------------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------------
  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
