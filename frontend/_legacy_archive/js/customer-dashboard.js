/**
 * ==============================================================================
 * HOUSE OF SHUBHANSHI — CUSTOMER DASHBOARD CONTROLLER
 * "Luxury Personal Closet / Private Fashion Account"
 * ==============================================================================
 */

const API_BASE = window.API_BASE_URL || '/api';

let currentCustomer = null;
let customerAnalytics = null;
let customerOrders = [];
let customerRentals = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = window.HouseAuth ? await window.HouseAuth.getAuthUser() : null;
  if (!user) {
    window.location.href = 'login.html?redirect=customer-dashboard.html';
    return;
  }

  if (user.role === 'ADMIN') {
    // If admin accidentally visits customer dashboard, provide option or redirect
    console.log('Admin user accessing customer dashboard view.');
  }

  currentCustomer = user;
  initSidebarNav();
  initCustomerSidebarDrawer();
  await loadCustomerDashboardData();
  initProfileForm();
  initCustomerRentalTabs();
});

function initSidebarNav() {
  const links = document.querySelectorAll('.sidebar-link[data-section]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const targetSectionId = link.dataset.section;
      document.querySelectorAll('.dash-section-pane').forEach(sec => sec.style.display = 'none');
      const targetSec = document.getElementById(targetSectionId);
      if (targetSec) targetSec.style.display = 'block';

      // Close mobile drawer if open
      document.querySelector('.dashboard-sidebar')?.classList.remove('open');
    });
  });

  document.getElementById('dashLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.HouseAuth?.performLogout();
  });
}

function initCustomerSidebarDrawer() {
  const toggleBtn = document.querySelector('.mobile-dash-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

async function loadCustomerDashboardData() {
  try {
    // Fetch customer analytics, orders and dress rentals
    const [analyticsRes, ordersRes, rentalsRes] = await Promise.all([
      fetch(`${API_BASE}/orders/analytics`, { credentials: 'include' }),
      fetch(`${API_BASE}/orders`, { credentials: 'include' }),
      fetch(`${API_BASE}/customer/rentals`, { credentials: 'include' })
    ]);

    const analyticsData = await analyticsRes.json();
    const ordersData = await ordersRes.json();
    const rentalsData = await rentalsRes.json();

    if (analyticsData.success) customerAnalytics = analyticsData.data;
    if (ordersData.success) customerOrders = ordersData.data;
    if (rentalsData.success) customerRentals = rentalsData.data;

    renderHeaderAndStats();
    renderOverviewRecentOrders();
    renderAllOrdersTable();
    renderCustomerRentalsSection();
    renderSpendingSection();
    populateProfileForm();

  } catch (err) {
    console.error('Failed to load customer dashboard data:', err);
  }
}

function renderHeaderAndStats() {
  const firstName = currentCustomer.name.split(' ')[0].toUpperCase();
  const welcomeTitle = document.getElementById('customerWelcomeTitle');
  if (welcomeTitle) {
    welcomeTitle.textContent = `WELCOME BACK, ${firstName}`;
  }

  // Populate Sidebar User Info
  const sideName = document.querySelector('.sidebar-user-name');
  const sideEmail = document.querySelector('.sidebar-user-email');
  if (sideName) sideName.textContent = currentCustomer.name;
  if (sideEmail) sideEmail.textContent = currentCustomer.email;

  if (!customerAnalytics) return;

  const totalSpentEl = document.getElementById('statTotalSpent');
  const totalOrdersEl = document.getElementById('statTotalOrders');
  const activeOrdersEl = document.getElementById('statActiveOrders');
  const completedOrdersEl = document.getElementById('statCompletedOrders');

  if (totalSpentEl) totalSpentEl.textContent = `₹ ${Number(customerAnalytics.totalSpent).toLocaleString('en-IN')}`;
  if (totalOrdersEl) totalOrdersEl.textContent = customerAnalytics.totalOrders;
  if (activeOrdersEl) activeOrdersEl.textContent = customerAnalytics.activeOrders;
  if (completedOrdersEl) completedOrdersEl.textContent = customerAnalytics.completedOrders;
}

function renderOverviewRecentOrders() {
  const container = document.getElementById('overviewRecentOrders');
  if (!container) return;

  if (!customerOrders || customerOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✦</div>
        <p class="font-serif" style="font-size: 1.25rem; color: var(--brown-dark);">You haven't placed an order yet.</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Reserve a bespoke piece from our atelier to inaugurate your private closet.</p>
        <a href="shop.html" class="btn btn-gold" style="margin-top: 18px; padding: 10px 22px; font-size: 0.78rem;">EXPLORE SHOP</a>
      </div>
    `;
    return;
  }

  const recent = customerOrders.slice(0, 3);
  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map(o => `
            <tr>
              <td><strong>#${o.orderNumber}</strong></td>
              <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td>${o.items ? o.items.map(i => i.productName).join(', ') : 'Heirloom Piece'}</td>
              <td><strong>₹${Number(o.totalAmount).toLocaleString('en-IN')}</strong></td>
              <td><span class="status-badge status-${o.status.toLowerCase().replace(/_/g, '-')}">${o.status.replace(/_/g, ' ')}</span></td>
              <td><a href="orders.html?id=${o.orderNumber}" class="btn btn-gold-outline-dark" style="padding: 6px 12px; font-size: 0.72rem;">TRACK</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAllOrdersTable() {
  const container = document.getElementById('allCustomerOrdersContainer');
  if (!container) return;

  if (!customerOrders || customerOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="font-serif" style="font-size: 1.25rem;">You haven't placed an order yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Order Number</th>
            <th>Date Placed</th>
            <th>Pieces</th>
            <th>Total Amount</th>
            <th>Payment Status</th>
            <th>Fulfillment Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${customerOrders.map(o => `
            <tr>
              <td><strong>#${o.orderNumber}</strong></td>
              <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td>${o.items ? o.items.map(i => `${i.quantity}x ${i.productName}`).join('<br>') : 'Atelier Piece'}</td>
              <td><strong>₹${Number(o.totalAmount).toLocaleString('en-IN')}</strong></td>
              <td><span class="status-badge status-${o.paymentStatus.toLowerCase()}">${o.paymentStatus}</span></td>
              <td><span class="status-badge status-${o.status.toLowerCase().replace(/_/g, '-')}">${o.status.replace(/_/g, ' ')}</span></td>
              <td><a href="orders.html?id=${o.orderNumber}" class="btn btn-gold-outline-dark" style="padding: 6px 12px; font-size: 0.72rem;">VIEW STATUS</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSpendingSection() {
  const spendTotalEl = document.getElementById('spendingTotalSpent');
  const spendOrdersEl = document.getElementById('spendingOrderCount');
  const spendAovEl = document.getElementById('spendingAOV');
  const timelineEl = document.getElementById('spendingTimelineChart');

  if (!customerAnalytics) return;

  if (spendTotalEl) spendTotalEl.textContent = `₹ ${Number(customerAnalytics.totalSpent).toLocaleString('en-IN')}`;
  if (spendOrdersEl) spendOrdersEl.textContent = customerAnalytics.totalOrders;
  if (spendAovEl) spendAovEl.textContent = `₹ ${Number(customerAnalytics.averageOrderValue).toLocaleString('en-IN')}`;

  if (timelineEl && customerAnalytics.spendingHistory) {
    if (customerAnalytics.spendingHistory.length === 0) {
      timelineEl.innerHTML = `<p style="font-size:0.86rem; color:var(--text-brown); padding: 20px;">No historical purchases recorded yet.</p>`;
      return;
    }

    const maxAmount = Math.max(...customerAnalytics.spendingHistory.map(h => h.amount), 1);
    timelineEl.innerHTML = `
      <div class="chart-container">
        ${customerAnalytics.spendingHistory.map(item => {
          const heightPercent = Math.max(10, Math.round((item.amount / maxAmount) * 100));
          return `
            <div class="chart-bar-col">
              <span class="chart-val-tooltip">₹${Number(item.amount).toLocaleString('en-IN')}</span>
              <div class="chart-bar" style="height: ${heightPercent}%;"></div>
              <span class="chart-label">${item.month}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

function populateProfileForm() {
  const form = document.getElementById('customerProfileForm');
  if (!form || !currentCustomer) return;

  if (form.name) form.name.value = currentCustomer.name || '';
  if (form.email) form.email.value = currentCustomer.email || '';
  if (form.phone) form.phone.value = currentCustomer.phone || '';
  if (form.dob) form.dob.value = currentCustomer.dob || '';
}

function initProfileForm() {
  const form = document.getElementById('customerProfileForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const dob = form.dob.value;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'UPDATING PROFILE...';

      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, phone, dob })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }

      currentCustomer = data.data.user;
      renderHeaderAndStats();
      if (window.HouseAuth?.showToast) {
        window.HouseAuth.showToast('Your atelier profile has been updated.');
      }

    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SAVE CHANGES';
    }
  });
}

/**
 * Filter tabs for Customer Rentals
 */
let currentRentalFilter = 'ALL';
function initCustomerRentalTabs() {
  const tabs = document.querySelectorAll('.filter-rental-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => {
        b.classList.remove('active', 'btn-gold');
        b.classList.add('btn-gold-outline-dark');
      });
      btn.classList.add('active', 'btn-gold');
      btn.classList.remove('btn-gold-outline-dark');

      currentRentalFilter = btn.dataset.filter;
      renderCustomerRentalsSection(currentRentalFilter);
    });
  });
}

/**
 * Render Customer Rentals Section
 */
function renderCustomerRentalsSection(filter = currentRentalFilter) {
  const container = document.getElementById('customerRentalsContainer');
  if (!container) return;

  // Update Metric Stat Cards
  const activeCount = customerRentals.filter(r => ['RESERVED', 'ACTIVE'].includes(r.status)).length;
  const heldDeposits = customerRentals
    .filter(r => r.depositStatus === 'HELD')
    .reduce((sum, r) => sum + (r.securityDeposit || 0), 0);
  const pendingCount = customerRentals.filter(r => r.status === 'RETURN_PENDING').length;
  const returnedCount = customerRentals.filter(r => r.status === 'RETURNED').length;

  const statActiveEl = document.getElementById('statCustRentalActive');
  const statDepEl = document.getElementById('statCustRentalDeposits');
  const statPendingEl = document.getElementById('statCustRentalPending');
  const statReturnedEl = document.getElementById('statCustRentalReturned');

  if (statActiveEl) statActiveEl.textContent = activeCount;
  if (statDepEl) statDepEl.textContent = `₹ ${Number(heldDeposits).toLocaleString('en-IN')}`;
  if (statPendingEl) statPendingEl.textContent = pendingCount;
  if (statReturnedEl) statReturnedEl.textContent = returnedCount;

  // Filter rentals
  let filtered = customerRentals;
  if (filter === 'ACTIVE') {
    filtered = customerRentals.filter(r => ['RESERVED', 'ACTIVE'].includes(r.status));
  } else if (filter === 'RETURN_PENDING') {
    filtered = customerRentals.filter(r => r.status === 'RETURN_PENDING');
  } else if (filter === 'RETURNED') {
    filtered = customerRentals.filter(r => r.status === 'RETURNED');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px 20px; color: var(--text-brown);">
        <p style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--gold); margin-bottom: 8px;">✦</p>
        <p style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--brown-dark);">No rental reservations found for this view.</p>
        <p style="font-size: 0.84rem; margin-top: 6px;">Experience the luxury of wearing iconic couture for 1 to 7 days.</p>
        <a href="shop.html" class="btn btn-gold" style="margin-top: 16px; display: inline-block;">EXPLORE RENTAL ARCHIVE</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const isOverdue = r.status === 'OVERDUE';
    const isReturned = r.status === 'RETURNED';
    const isPending = r.status === 'RETURN_PENDING';
    const isActive = r.status === 'ACTIVE';
    const isReserved = r.status === 'RESERVED';

    // Determine timeline steps active states
    let s1Class = 'completed';
    let s2Class = '';
    let s3Class = '';
    let s4Class = '';

    if (isReserved) {
      s1Class = 'current';
    } else if (isActive || isOverdue) {
      s1Class = 'completed';
      s2Class = 'current';
    } else if (isPending) {
      s1Class = 'completed';
      s2Class = 'completed';
      s3Class = 'current';
    } else if (isReturned) {
      s1Class = 'completed';
      s2Class = 'completed';
      s3Class = 'completed';
      s4Class = 'completed current';
    }

    const prodName = r.product?.name || 'Signature Atelier Garment';
    const prodImg = r.product?.image || 'assets/images/collection/noor-set.jpg';
    const prodCat = r.product?.category || 'ROYAL HEIRLOOM';
    const orderNum = r.order?.orderNumber || 'HS-RENT';

    return `
      <div class="rental-card">
        <div class="rental-card-top">
          <img src="${prodImg}" alt="${prodName}" class="rental-card-thumb">
          
          <div class="rental-card-info">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
              <div>
                <span style="font-size: 0.68rem; letter-spacing: 0.16em; color: var(--gold); text-transform: uppercase;">
                  ${prodCat} &bull; ORDER #${orderNum}
                </span>
                <h3 class="font-serif" style="font-size: 1.25rem; color: var(--brown-dark); margin: 3px 0 6px;">
                  ${prodName}
                </h3>
              </div>
              <div>
                <span class="badge-status badge-status-${r.status.toLowerCase().replace(/_/g, '-')}">
                  ${r.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div class="rental-card-dates">
              <div>
                <span style="display:block; font-size: 0.68rem; text-transform: uppercase; color: var(--gold-dark); font-weight:600;">Rental Period</span>
                <strong>${r.startDate}</strong> &rarr; <strong>${r.endDate}</strong> (${r.rentalDays} Days)
              </div>
              <div style="border-left: 1px solid rgba(201, 160, 74, 0.3); padding-left: 16px;">
                <span style="display:block; font-size: 0.68rem; text-transform: uppercase; color: var(--gold-dark); font-weight:600;">Security Deposit</span>
                <strong>₹${Number(r.securityDeposit).toLocaleString('en-IN')}</strong> (${r.depositStatus})
              </div>
              <div style="border-left: 1px solid rgba(201, 160, 74, 0.3); padding-left: 16px;">
                <span style="display:block; font-size: 0.68rem; text-transform: uppercase; color: var(--gold-dark); font-weight:600;">Hire Fee</span>
                <strong>₹${Number(r.rentalPrice).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- 4-Stage Lifecycle Timeline -->
        <div style="padding: 10px 0;">
          <div class="rental-timeline">
            <div class="timeline-step ${s1Class}">
              <div class="timeline-dot">1</div>
              <span class="timeline-step-label">RESERVED</span>
            </div>
            <div class="timeline-step ${s2Class}">
              <div class="timeline-dot">2</div>
              <span class="timeline-step-label">ACTIVE / ON LOAN</span>
            </div>
            <div class="timeline-step ${s3Class}">
              <div class="timeline-dot">3</div>
              <span class="timeline-step-label">RETURN PENDING</span>
            </div>
            <div class="timeline-step ${s4Class}">
              <div class="timeline-dot">4</div>
              <span class="timeline-step-label">RETURNED &amp; REFUNDED</span>
            </div>
          </div>
        </div>

        ${isOverdue ? `
          <div style="background: rgba(220, 38, 38, 0.08); border-left: 3px solid #DC2626; padding: 10px 14px; font-size: 0.82rem; color: #991B1B;">
            <strong>OVERDUE NOTICE:</strong> The scheduled rental window ended on <strong>${r.endDate}</strong>. Please request return pickup immediately to avoid late fee deductions from your security deposit.
          </div>
        ` : ''}

        ${isReturned ? `
          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #065F46; padding: 10px 14px; font-size: 0.82rem; color: #065F46; display: flex; justify-content: space-between; flex-wrap: wrap;">
            <span>Garment returned &amp; verified by atelier karigars.</span>
            <span>Refunded to original method: <strong>₹${Number(r.refundAmount || r.securityDeposit).toLocaleString('en-IN')}</strong></span>
          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid rgba(122, 50, 29, 0.08); padding-top: 14px;">
          ${['ACTIVE', 'RESERVED', 'OVERDUE'].includes(r.rawStatus) ? `
            <button type="button" class="btn btn-gold-outline-dark btn-return-request" data-id="${r.id}" style="padding: 8px 18px; font-size: 0.74rem;">
              REQUEST RETURN / SCHEDULE PICKUP
            </button>
          ` : ''}
          <a href="https://wa.me/919560011351?text=${encodeURIComponent(`Hello House of Shubhanshi Concierge, regarding my rental ${r.id} (${prodName}):`)}" 
             target="_blank" rel="noopener noreferrer" class="btn btn-gold-outline-dark" style="padding: 8px 18px; font-size: 0.74rem;">
            CONCIERGE ASSISTANCE
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Bind return request buttons
  container.querySelectorAll('.btn-return-request').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rentalId = btn.dataset.id;
      if (!confirm('Would you like to initiate garment return & schedule white-glove pickup?')) return;

      try {
        btn.disabled = true;
        btn.textContent = 'SCHEDULING PICKUP...';

        const res = await fetch(`${API_BASE}/customer/rentals/${rentalId}/return-request`, {
          method: 'POST',
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to request return');
        }

        if (window.HouseAuth?.showToast) {
          window.HouseAuth.showToast('Return requested! Our courier will contact you.');
        }

        // Refresh data
        await loadCustomerDashboardData();
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = 'REQUEST RETURN / SCHEDULE PICKUP';
      }
    });
  });
}
