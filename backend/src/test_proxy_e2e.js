// ==============================================================================
// HOUSE OF SHUBHANSHI — FULL PROXY & SINGLE WEBSITE E2E TEST
// Validates Next.js (port 3000) -> Express (port 3001) proxy integration
// ==============================================================================
const http = require('http');

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postPayload = postData ? (typeof postData === 'object' ? JSON.stringify(postData) : postData) : null;
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        ...(postPayload ? { 'Content-Length': Buffer.byteLength(postPayload) } : {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postPayload) {
      req.write(postPayload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('HOUSE OF SHUBHANSHI — PROXY & ARCHITECTURE E2E TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`\x1b[32m  ✓ PASS:\x1b[0m ${message}`);
      passed++;
    } else {
      console.error(`\x1b[31m  ✗ FAIL:\x1b[0m ${message}`);
      failed++;
    }
  }

  try {
    // 1. Backend direct health
    console.log('[Phase 1] Express Backend Direct Checks (Port 3001)');
    const backendHealth = await request('http://localhost:3001/api/health');
    assert(backendHealth.statusCode === 200, `Express GET /api/health returned 200 (Got ${backendHealth.statusCode})`);
    assert(backendHealth.json && backendHealth.json.status === 'ok', 'Express health returns status: ok');
    assert(backendHealth.json && backendHealth.json.database === 'connected', 'Express health returns database: connected');

    // 2. Backend root redirect to frontend
    const backendRoot = await request('http://localhost:3001/');
    assert(backendRoot.body.includes('http://localhost:3000'), 'Express root (/) directs traffic to Next.js storefront (port 3000)');

    // 3. Next.js Frontend health proxy
    console.log('\n[Phase 2] Next.js Storefront Proxy Checks (Port 3000)');
    const proxiedHealth = await request('http://localhost:3000/api/health');
    assert(proxiedHealth.statusCode === 200, `Next.js GET /api/health proxied to backend returned 200 (Got ${proxiedHealth.statusCode})`);
    assert(proxiedHealth.json && proxiedHealth.json.status === 'ok', 'Proxied /api/health returns status: ok');
    assert(proxiedHealth.json && proxiedHealth.json.database === 'connected', 'Proxied /api/health confirms database connectivity');

    // 4. Products API proxy
    const proxiedProducts = await request('http://localhost:3000/api/products');
    assert(proxiedProducts.statusCode === 200, `Next.js GET /api/products proxied returned 200 (Got ${proxiedProducts.statusCode})`);
    const prods = (proxiedProducts.json && proxiedProducts.json.data) || [];
    assert(prods.length === 3, `Real collection has exactly 3 active products (Got ${prods.length})`);
    const prices = prods.map(p => Number(p.price)).sort((a, b) => a - b);
    assert(JSON.stringify(prices) === JSON.stringify([4499, 5599, 6699]), `Product prices match ₹4,499, ₹5,599, ₹6,699 (Got: ${prices.join(', ')})`);

    // 5. Auth API Proxy: Customer Signup / Login
    console.log('\n[Phase 3] Full Auth Flow via Port 3000 Proxy');
    const testEmail = `proxy_test_${Date.now()}@houseofshubhanshi.com`;
    const signupRes = await request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Pooja Sharma',
      email: testEmail,
      password: 'Password@123',
      phone: '+91 9876543210'
    });

    assert(signupRes.statusCode === 201, `Customer signup via Next.js proxy returned 201 (Got ${signupRes.statusCode})`);
    const signupCookies = signupRes.headers['set-cookie'] || [];
    const hasTokenCookie = signupCookies.some(c => c.includes('token='));
    assert(hasTokenCookie, 'Customer signup returned first-party HTTP-only token cookie');

    // Extract cookie token for authenticated session
    let tokenCookieHeader = '';
    if (signupCookies.length > 0) {
      tokenCookieHeader = signupCookies.map(c => c.split(';')[0]).join('; ');
    }

    // 6. Test GET /api/auth/me via Port 3000
    const meRes = await request('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Cookie': tokenCookieHeader
      }
    });
    assert(meRes.statusCode === 200, `GET /api/auth/me via Next.js proxy with cookie returned 200 (Got ${meRes.statusCode})`);
    assert(meRes.json && meRes.json.user && meRes.json.user.email === testEmail, `Session restored for ${testEmail}`);
    assert(meRes.json && meRes.json.user && meRes.json.user.role === 'CUSTOMER', 'Customer has role CUSTOMER');

    // 7. Customer Order Placement via Port 3000 Proxy
    console.log('\n[Phase 4] Checkout / Order Placement via Port 3000 Proxy');
    const orderRes = await request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': tokenCookieHeader
      }
    }, {
      items: [
        {
          productId: prods[0].id,
          orderType: 'BUY',
          size: 'M',
          color: 'Purple',
          quantity: 1
        }
      ],
      shippingAddress: '42 Heritage Enclave, Civil Lines, Jaipur, Rajasthan 302001',
      phone: '+91 9876543210',
      paymentMethod: 'COD'
    });

    assert(orderRes.statusCode === 201, `Order placed via Next.js proxy returned 201 (Got ${orderRes.statusCode})`);
    const orderNumber = orderRes.json && orderRes.json.data && orderRes.json.data.orderNumber;
    assert(orderNumber && orderNumber.startsWith('HS'), `Order generated with order number: ${orderNumber}`);

    // 8. Admin Login via Port 3000 Proxy
    console.log('\n[Phase 5] Admin Login & Overview via Port 3000 Proxy');
    const adminLoginRes = await request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@houseofshubhanshi.com',
      password: 'Admin@Shubhanshi2026!'
    });
    assert(adminLoginRes.statusCode === 200, `Admin login via Next.js proxy returned 200 (Got ${adminLoginRes.statusCode})`);
    assert(adminLoginRes.json && adminLoginRes.json.user && adminLoginRes.json.user.role === 'ADMIN', 'Admin authenticated with role ADMIN');

    // 9. Admin Overview Check via Port 3000 Proxy
    const adminCookies = adminLoginRes.headers['set-cookie'] || [];
    const adminCookieHeader = adminCookies.map(c => c.split(';')[0]).join('; ');
    const adminOverviewRes = await request('http://localhost:3000/api/admin/overview', {
      method: 'GET',
      headers: { 'Cookie': adminCookieHeader }
    });
    assert(adminOverviewRes.statusCode === 200, `Admin overview accessed via Next.js proxy returned 200 (Got ${adminOverviewRes.statusCode})`);
    assert(adminOverviewRes.json && adminOverviewRes.json.data && typeof adminOverviewRes.json.data.totalOrders === 'number', `Admin metrics returned correctly (totalOrders: ${adminOverviewRes.json?.data?.totalOrders}, totalSales: ₹${adminOverviewRes.json?.data?.totalSales})`);

    console.log('\n======================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n[Error running tests]:', err);
    process.exit(1);
  }
}

runTests();
