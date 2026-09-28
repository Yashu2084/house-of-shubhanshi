/**
 * ==============================================================================
 * HOUSE OF SHUBHANSHI — ADMIN DASHBOARD CONTROLLER
 * "Luxury Fashion House Control Room"
 * Strictly accessible by ADMIN role
 * ==============================================================================
 */

const API_BASE = window.API_BASE_URL || '/api';

let adminOverview = null;
let adminOrders = [];
let adminProducts = [];
let adminCollections = [];
let adminCustomers = [];
let adminRentals = [];
let adminRentalMetrics = null;
let currentAdminRentalFilter = 'ALL';
let activeSalesRange = '30d';

document.addEventListener('DOMContentLoaded', async () => {
  const user = window.HouseAuth ? await window.HouseAuth.getAuthUser() : null;

  if (!user || user.role !== 'ADMIN') {
    alert('Access Restricted: Administrator credentials required.');
    window.location.href = 'login.html?redirect=admin-dashboard.html';
    return;
  }

  initSidebarNav();
  initAdminSidebarDrawer();
  await loadAdminData();
  initModals();
  initAdminRentalTabs();
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

function initAdminSidebarDrawer() {
  const toggleBtn = document.querySelector('.mobile-dash-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

async function loadAdminData() {
  try {
    const [overviewRes, ordersRes, productsRes, collectionsRes, customersRes, rentalsRes] = await Promise.all([
      fetch(`${API_BASE}/admin/overview`, { credentials: 'include' }),
      fetch(`${API_BASE}/admin/orders`, { credentials: 'include' }),
      fetch(`${API_BASE}/products?includeInactive=true`, { credentials: 'include' }),
      fetch(`${API_BASE}/collections?includeInactive=true`, { credentials: 'include' }),
      fetch(`${API_BASE}/admin/customers`, { credentials: 'include' }),
      fetch(`${API_BASE}/admin/rentals`, { credentials: 'include' })
    ]);

    const overviewData = await overviewRes.json();
    const ordersData = await ordersRes.json();
    const productsData = await productsRes.json();
    const collectionsData = await collectionsRes.json();
    const customersData = await customersRes.json();
    const rentalsData = await rentalsRes.json();

    if (overviewData.success) adminOverview = overviewData.data;
    if (ordersData.success) adminOrders = ordersData.data;
    if (productsData.success) adminProducts = productsData.data;
    if (collectionsData.success) adminCollections = collectionsData.data;
    if (customersData.success) adminCustomers = customersData.data;
    if (rentalsData.success && rentalsData.data) {
      adminRentals = rentalsData.data.rentals || [];
      adminRentalMetrics = rentalsData.data.metrics || null;
    }

    renderOverviewCards();
    renderRecentOrders();
    renderOrdersTable();
    renderAdminRentalsSection();
    renderProductsTable();
    renderCollectionsTable();
    renderCustomersTable();
    populateCalendarProductDropdown();
    await loadSalesAnalytics(activeSalesRange);

  } catch (err) {
    console.error('Failed to load admin dashboard data:', err);
  }
}

function renderOverviewCards() {
  if (!adminOverview) return;

  const salesEl = document.getElementById('statTotalSales');
  const ordersEl = document.getElementById('statTotalOrders');
  const customersEl = document.getElementById('statTotalCustomers');
  const productsEl = document.getElementById('statTotalProducts');
  const collectionsEl = document.getElementById('statActiveCollections');
  const pendingEl = document.getElementById('statPendingOrders');

  if (salesEl) salesEl.textContent = `₹ ${Number(adminOverview.totalSales).toLocaleString('en-IN')}`;
  if (ordersEl) ordersEl.textContent = adminOverview.totalOrders;
  if (customersEl) customersEl.textContent = adminOverview.totalCustomers;
  if (productsEl) productsEl.textContent = adminOverview.totalProducts;
  if (collectionsEl) collectionsEl.textContent = adminOverview.activeCollections;
  if (pendingEl) pendingEl.textContent = adminOverview.pendingOrders;
}

function renderRecentOrders() {
  const container = document.getElementById('overviewRecentOrdersTable');
  if (!container || !adminOverview) return;

  const orders = adminOverview.recentOrders || [];
  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No orders placed yet.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td><strong>#${o.orderNumber}</strong></td>
              <td>${o.user ? o.user.name : 'Guest'}</td>
              <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
              <td><strong>₹${Number(o.totalAmount).toLocaleString('en-IN')}</strong></td>
              <td><span class="status-badge status-${o.status.toLowerCase().replace(/_/g, '-')}">${o.status.replace(/_/g, ' ')}</span></td>
              <td><a href="orders.html?id=${o.orderNumber}" class="btn btn-gold-outline-dark" style="padding: 4px 10px; font-size: 0.7rem;">INSPECT</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderOrdersTable() {
  const container = document.getElementById('adminOrdersTableContainer');
  if (!container) return;

  if (!adminOrders || adminOrders.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No orders have been placed yet.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Order Status</th>
            <th>Update Status</th>
          </tr>
        </thead>
        <tbody>
          ${adminOrders.map(o => `
            <tr data-order-id="${o.id}">
              <td><strong>#${o.orderNumber}</strong></td>
              <td>
                <strong>${o.user ? o.user.name : 'Client'}</strong><br>
                <small style="color:var(--text-brown);">${o.phone}</small>
              </td>
              <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td><strong>₹${Number(o.totalAmount).toLocaleString('en-IN')}</strong></td>
              <td><span class="status-badge status-${o.paymentStatus.toLowerCase()}">${o.paymentStatus}</span></td>
              <td>
                <span id="badge-status-${o.id}" class="status-badge status-${o.status.toLowerCase().replace(/_/g, '-')}">
                  ${o.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td>
                <select class="form-input order-status-select" data-order-id="${o.id}" style="padding: 6px 10px; font-size: 0.75rem; width: auto;">
                  <option value="RECEIVED" ${o.status === 'RECEIVED' ? 'selected' : ''}>RECEIVED</option>
                  <option value="DISPATCHED" ${o.status === 'DISPATCHED' ? 'selected' : ''}>DISPATCHED</option>
                  <option value="OUT_FOR_DELIVERY" ${o.status === 'OUT_FOR_DELIVERY' ? 'selected' : ''}>OUT FOR DELIVERY</option>
                  <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                  <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach status change listener
  container.querySelectorAll('.order-status-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = select.dataset.orderId;
      const newStatus = select.value;

      try {
        const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Status update failed');
        }

        const badge = document.getElementById(`badge-status-${orderId}`);
        if (badge) {
          badge.className = `status-badge status-${newStatus.toLowerCase().replace(/_/g, '-')}`;
          badge.textContent = newStatus.replace(/_/g, ' ');
        }

        if (window.HouseAuth?.showToast) {
          window.HouseAuth.showToast(`Order status updated to ${newStatus}. Customer tracker synchronized.`);
        }

      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function renderProductsTable() {
  const container = document.getElementById('adminProductsTableContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Piece</th>
            <th>Category</th>
            <th>Collection</th>
            <th>Purchase Price</th>
            <th>Rental Mode</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${adminProducts.map(p => `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <img src="${p.image}" alt="" style="width:36px; height:45px; object-fit:cover; border:1px solid var(--gold-border);">
                  <strong>${p.name}</strong>
                </div>
              </td>
              <td>${p.category || '-'}</td>
              <td>${p.collection ? p.collection.name : '-'}</td>
              <td>₹${Number(p.price).toLocaleString('en-IN')}</td>
              <td>
                ${p.isRentable ? `
                  <div style="font-size:0.75rem;">
                    <span class="badge-status badge-status-reserved" style="padding:2px 6px; font-size:0.62rem;">RENTABLE</span>
                    <div style="color:var(--text-brown); margin-top:2px;">₹${Number(p.rentalBasePrice).toLocaleString('en-IN')} base / ${p.rentalAvailableStock} units</div>
                  </div>
                ` : `
                  <span style="font-size:0.75rem; color:var(--text-brown);">BUY ONLY</span>
                `}
              </td>
              <td>
                <input type="number" class="form-input stock-input" data-id="${p.id}" value="${p.stock}" style="width: 70px; padding: 4px 8px; font-size: 0.8rem;">
              </td>
              <td>
                <span class="status-badge ${p.isActive ? 'status-delivered' : 'status-cancelled'}">
                  ${p.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </td>
              <td>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <button type="button" class="btn-toggle-product btn btn-gold-outline-dark" data-id="${p.id}" data-active="${p.isActive}" style="padding: 4px 8px; font-size: 0.7rem;">
                    ${p.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>
                  <button type="button" class="btn-toggle-rentable btn btn-gold-outline-dark" data-id="${p.id}" data-rentable="${p.isRentable}" style="padding: 4px 8px; font-size: 0.68rem;">
                    ${p.isRentable ? 'DISABLE RENT' : 'ENABLE RENT'}
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach stock update change
  container.querySelectorAll('.stock-input').forEach(input => {
    input.addEventListener('change', async () => {
      const pId = input.dataset.id;
      const newStock = parseInt(input.value, 10);
      try {
        await fetch(`${API_BASE}/products/${pId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ stock: newStock })
        });
        if (window.HouseAuth?.showToast) window.HouseAuth.showToast('Stock level updated.');
      } catch (e) {
        console.error(e);
      }
    });
  });

  // Attach toggle active
  container.querySelectorAll('.btn-toggle-product').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = btn.dataset.id;
      const currentlyActive = btn.dataset.active === 'true';
      try {
        await fetch(`${API_BASE}/products/${pId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isActive: !currentlyActive })
        });
        await loadAdminData();
      } catch (e) {
        console.error(e);
      }
    });
  });

  // Attach toggle rentable
  container.querySelectorAll('.btn-toggle-rentable').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = btn.dataset.id;
      const currentlyRentable = btn.dataset.rentable === 'true';
      try {
        await fetch(`${API_BASE}/admin/rentals/products/${pId}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            isRentable: !currentlyRentable,
            rentalBasePrice: 4500,
            rentalPricePerDay: 1200,
            rentalDeposit: 10000,
            rentalAvailableStock: 2
          })
        });
        if (window.HouseAuth?.showToast) window.HouseAuth.showToast(`Rental mode ${!currentlyRentable ? 'enabled' : 'disabled'}.`);
        await loadAdminData();
      } catch (e) {
        console.error(e);
      }
    });
  });
}

/**
 * Filter tabs for Admin Rentals
 */
function initAdminRentalFilterTabs() {
  const tabs = document.querySelectorAll('.admin-rental-filter-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => {
        b.classList.remove('active', 'btn-gold');
        b.classList.add('btn-gold-outline-dark');
      });
      btn.classList.add('active', 'btn-gold');
      btn.classList.remove('btn-gold-outline-dark');

      currentAdminRentalFilter = btn.dataset.filter;
      renderAdminRentalsSection(currentAdminRentalFilter);
    });
  });
}

/**
 * Render Admin Rentals Section
 */
function renderAdminRentalsSection(filter = currentAdminRentalFilter) {
  // Update metric counters
  if (adminRentalMetrics) {
    const actEl = document.getElementById('adminRentalStatActive');
    const pendEl = document.getElementById('adminRentalStatPending');
    const overEl = document.getElementById('adminRentalStatOverdue');
    const depEl = document.getElementById('adminRentalStatDeposits');

    if (actEl) actEl.textContent = adminRentalMetrics.activeCount;
    if (pendEl) pendEl.textContent = adminRentalMetrics.returnPendingCount;
    if (overEl) overEl.textContent = adminRentalMetrics.overdueCount;
    if (depEl) depEl.textContent = `₹ ${Number(adminRentalMetrics.totalHeldDeposits).toLocaleString('en-IN')}`;
  }

  const container = document.getElementById('adminRentalsTableContainer');
  if (!container) return;

  let filtered = adminRentals;
  if (filter === 'RESERVED') {
    filtered = adminRentals.filter(r => r.status === 'RESERVED');
  } else if (filter === 'ACTIVE') {
    filtered = adminRentals.filter(r => r.status === 'ACTIVE');
  } else if (filter === 'RETURN_PENDING') {
    filtered = adminRentals.filter(r => r.status === 'RETURN_PENDING');
  } else if (filter === 'OVERDUE') {
    filtered = adminRentals.filter(r => r.status === 'OVERDUE');
  } else if (filter === 'RETURNED') {
    filtered = adminRentals.filter(r => r.status === 'RETURNED');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-brown);">
        <p style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--brown-dark);">No rental records match "${filter}".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Rental ID</th>
            <th>Patron / Client</th>
            <th>Garment Piece</th>
            <th>Rental Window</th>
            <th>Hire Fee</th>
            <th>Security Deposit</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(r => {
            const isOverdue = r.status === 'OVERDUE';
            const isReturnable = ['ACTIVE', 'RETURN_PENDING', 'OVERDUE', 'RESERVED'].includes(r.rawStatus);
            return `
              <tr>
                <td><code>${r.id}</code></td>
                <td>
                  <strong>${r.user?.name || 'Patron'}</strong>
                  <div style="font-size:0.75rem; color:var(--text-brown);">${r.user?.phone || r.user?.email || '-'}</div>
                </td>
                <td>
                  <strong>${r.product?.name || 'Atelier Silhouette'}</strong>
                  <div style="font-size:0.74rem; color:var(--gold-dark);">${r.product?.category || ''}</div>
                </td>
                <td>
                  <strong>${r.startDate}</strong> &rarr; <strong>${r.endDate}</strong>
                  <div style="font-size:0.75rem; color:var(--text-brown);">${r.rentalDays} Days Duration</div>
                </td>
                <td><strong>₹${Number(r.rentalPrice).toLocaleString('en-IN')}</strong></td>
                <td>
                  <strong>₹${Number(r.securityDeposit).toLocaleString('en-IN')}</strong>
                  <div style="font-size:0.75rem; color:${r.depositStatus === 'HELD' ? 'var(--gold-dark)' : '#065F46'}; font-weight:600;">
                    ${r.depositStatus}
                  </div>
                </td>
                <td>
                  <span class="badge-status badge-status-${r.status.toLowerCase().replace(/_/g, '-')}">
                    ${r.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  <div style="display:flex; flex-direction:column; gap:4px;">
                    ${isReturnable ? `
                      <button type="button" class="btn-inspect-return btn btn-gold" data-id="${r.id}" style="padding: 4px 8px; font-size: 0.7rem;">
                        INSPECT &amp; RETURN
                      </button>
                    ` : `
                      <span style="font-size: 0.72rem; color: #065F46; font-weight: 600;">✓ CLOSED</span>
                    `}
                    <select class="admin-rental-status-select form-input" data-id="${r.id}" style="padding: 2px 4px; font-size: 0.72rem; width: fit-content;">
                      <option value="">Change Status...</option>
                      <option value="RESERVED" ${r.status === 'RESERVED' ? 'selected' : ''}>RESERVED</option>
                      <option value="ACTIVE" ${r.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
                      <option value="RETURN_PENDING" ${r.status === 'RETURN_PENDING' ? 'selected' : ''}>RETURN PENDING</option>
                      <option value="CANCELLED" ${r.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
                    </select>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach quick status change
  container.querySelectorAll('.admin-rental-status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const rId = sel.dataset.id;
      const newStatus = sel.value;
      if (!newStatus) return;

      try {
        const res = await fetch(`${API_BASE}/admin/rentals/${rId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Status update failed');
        if (window.HouseAuth?.showToast) window.HouseAuth.showToast(`Rental ${rId} status updated to ${newStatus}.`);
        await loadAdminData();
      } catch (e) {
        alert(e.message);
      }
    });
  });

  // Attach inspect & return button
  container.querySelectorAll('.btn-inspect-return').forEach(btn => {
    btn.addEventListener('click', () => {
      openAdminReturnModal(btn.dataset.id);
    });
  });
}

/**
 * Open Inspect & Return Modal
 */
let activeReturnRental = null;
function openAdminReturnModal(rentalId) {
  const rental = adminRentals.find(r => r.id === rentalId);
  if (!rental) return;

  activeReturnRental = rental;
  const modal = document.getElementById('adminReturnModal');
  if (!modal) return;

  document.getElementById('retRentalId').value = rental.id;
  document.getElementById('retProductName').textContent = rental.product?.name || 'Garment';
  document.getElementById('retUserName').textContent = `${rental.user?.name || 'Patron'} (${rental.user?.phone || ''})`;
  document.getElementById('retSecurityDeposit').textContent = `₹ ${Number(rental.securityDeposit).toLocaleString('en-IN')}`;

  document.getElementById('retDamageAmount').value = 0;
  document.getElementById('retLateFee').value = rental.status === 'OVERDUE' ? 500 : 0;

  recalcReturnSettlement();
  modal.classList.add('open');
}

function recalcReturnSettlement() {
  if (!activeReturnRental) return;
  const deposit = activeReturnRental.securityDeposit || 0;
  const damage = parseFloat(document.getElementById('retDamageAmount')?.value || 0) || 0;
  const late = parseFloat(document.getElementById('retLateFee')?.value || 0) || 0;
  const refund = Math.max(0, deposit - damage - late);

  const refEl = document.getElementById('retCalculatedRefund');
  const noteEl = document.getElementById('retDepositStatusNote');

  if (refEl) refEl.textContent = `₹ ${Number(refund).toLocaleString('en-IN')}`;
  if (noteEl) {
    if (damage + late === 0) {
      noteEl.textContent = 'Full security deposit will be released to patron.';
    } else if (refund > 0) {
      noteEl.textContent = `₹${damage + late} will be deducted; remaining ₹${refund} refunded.`;
    } else {
      noteEl.textContent = 'Entire security deposit retained for damage/delinquency.';
    }
  }
}

/**
 * Availability Calendar Dropdown & Matrix Loader
 */
function populateCalendarProductDropdown() {
  const select = document.getElementById('adminCalendarProductSelect');
  if (!select) return;

  const rentable = adminProducts.filter(p => p.isRentable);
  select.innerHTML = `<option value="">Select Rentable Garment (${rentable.length} Available)</option>` +
    rentable.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.rentalAvailableStock})</option>`).join('');

  if (rentable.length > 0 && !select.value) {
    select.value = rentable[0].id;
    loadAvailabilityCalendar(rentable[0].id);
  }
}

async function loadAvailabilityCalendar(productId) {
  const container = document.getElementById('adminRentalCalendarContainer');
  if (!container || !productId) return;

  container.innerHTML = `<div class="loading-state">Loading monthly availability matrix...</div>`;

  try {
    const res = await fetch(`${API_BASE}/rentals/calendar/${productId}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load calendar');

    const cal = data.data;
    container.innerHTML = `
      <div style="background: var(--ivory); border: 1px solid var(--gold-border); padding: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 class="font-serif" style="color:var(--brown-dark); font-size:1.1rem;">
            ${cal.productName} &bull; Booking Schedule (${cal.month}/${cal.year})
          </h3>
          <span style="font-size:0.78rem; color:var(--gold-dark); font-weight:600;">
            Vault Inventory: ${cal.totalStock} Units
          </span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(42px, 1fr)); gap: 6px;">
          ${cal.days.map(d => {
            const isFull = !d.isAvailable;
            const isPartial = d.bookedCount > 0 && d.isAvailable;
            let bg = 'background: #ECFDF5; border: 1px solid #10B981; color: #065F46;'; // green
            if (isFull) {
              bg = 'background: #FEF2F2; border: 1px solid #EF4444; color: #991B1B;'; // red
            } else if (isPartial) {
              bg = 'background: #FFFBEB; border: 1px solid #F59E0B; color: #B45309;'; // yellow
            }

            return `
              <div style="${bg} padding: 6px 2px; text-align: center; border-radius: 2px;" title="${d.date}: ${d.bookedCount} booked, ${d.remaining} available">
                <div style="font-size:0.8rem; font-weight:700;">${d.day}</div>
                <div style="font-size:0.62rem; text-transform:uppercase;">${d.remaining > 0 ? `${d.remaining} left` : 'FULL'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:#991B1B; padding:10px;">${err.message}</p>`;
  }
}
        console.error(e);
      }
    });
  });
}

function renderCollectionsTable() {
  const container = document.getElementById('adminCollectionsTableContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Collection Name</th>
            <th>Slug</th>
            <th>Description</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${adminCollections.map(c => `
            <tr>
              <td><strong>${c.name}</strong></td>
              <td><code>${c.slug}</code></td>
              <td>${c.description || '-'}</td>
              <td><span class="status-badge ${c.isActive ? 'status-delivered' : 'status-cancelled'}">${c.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
              <td>
                <button type="button" class="btn-toggle-col btn btn-gold-outline-dark" data-id="${c.id}" data-active="${c.isActive}" style="padding: 4px 8px; font-size: 0.7rem;">
                  ${c.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.btn-toggle-col').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cId = btn.dataset.id;
      const currentlyActive = btn.dataset.active === 'true';
      try {
        await fetch(`${API_BASE}/collections/${cId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isActive: !currentlyActive })
        });
        await loadAdminData();
      } catch (e) {
        console.error(e);
      }
    });
  });
}

function renderCustomersTable() {
  const container = document.getElementById('adminCustomersTableContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="table-responsive">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Orders Count</th>
            <th>Total Value Spent</th>
            <th>Member Since</th>
          </tr>
        </thead>
        <tbody>
          ${adminCustomers.map(u => `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td>${u.email}</td>
              <td>${u.phone || '-'}</td>
              <td>${u.ordersCount} Order${u.ordersCount !== 1 ? 's' : ''}</td>
              <td><strong>₹${Number(u.totalSpent).toLocaleString('en-IN')}</strong></td>
              <td>${new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function loadSalesAnalytics(range = '30d') {
  activeSalesRange = range;
  try {
    const res = await fetch(`${API_BASE}/admin/sales?range=${range}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) return;

    const s = data.data;
    document.getElementById('analyticsRevenue').textContent = `₹ ${Number(s.totalRevenue).toLocaleString('en-IN')}`;
    document.getElementById('analyticsOrders').textContent = s.orderCount;
    document.getElementById('analyticsAov').textContent = `₹ ${Number(s.averageOrderValue).toLocaleString('en-IN')}`;
    document.getElementById('analyticsUnits').textContent = s.productsSold;

    // Render chart
    const chartContainer = document.getElementById('salesTimelineChart');
    if (chartContainer && s.chartData) {
      if (s.chartData.length === 0) {
        chartContainer.innerHTML = `<p style="padding: 20px; font-size:0.85rem; color:var(--text-brown);">No orders placed in this time window.</p>`;
      } else {
        const maxSales = Math.max(...s.chartData.map(d => d.sales), 1);
        chartContainer.innerHTML = `
          <div class="chart-container">
            ${s.chartData.map(item => {
              const heightPercent = Math.max(12, Math.round((item.sales / maxSales) * 100));
              return `
                <div class="chart-bar-col">
                  <span class="chart-val-tooltip">₹${Number(item.sales).toLocaleString('en-IN')}</span>
                  <div class="chart-bar" style="height: ${heightPercent}%;"></div>
                  <span class="chart-label">${item.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    // Update active filter buttons
    document.querySelectorAll('.filter-btn[data-range]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.range === range);
    });

  } catch (err) {
    console.error(err);
  }
}

function initModals() {
  // Sales filters
  document.querySelectorAll('.filter-btn[data-range]').forEach(btn => {
    btn.addEventListener('click', () => {
      loadSalesAnalytics(btn.dataset.range);
    });
  });

  // Add Product Modal
  const openProductModalBtn = document.getElementById('openAddProductModalBtn');
  const addProductModal = document.getElementById('addProductModal');
  const addProductForm = document.getElementById('addProductForm');

  if (openProductModalBtn && addProductModal) {
    openProductModalBtn.addEventListener('click', () => {
      // Populate collection dropdown
      const select = addProductModal.querySelector('select[name="collectionId"]');
      if (select) {
        select.innerHTML = `<option value="">Select Collection (Optional)</option>` +
          adminCollections.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      }
      addProductModal.classList.add('open');
    });

    addProductModal.querySelector('.dash-modal-close')?.addEventListener('click', () => {
      addProductModal.classList.remove('open');
    });

    // Toggle rental fields wrap
    const isRentableCheck = document.getElementById('prodFormIsRentable');
    const rentWrap = document.getElementById('prodRentalFieldsWrap');
    if (isRentableCheck && rentWrap) {
      isRentableCheck.addEventListener('change', () => {
        rentWrap.style.display = isRentableCheck.checked ? 'block' : 'none';
      });
    }
  }

  if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = addProductForm.querySelector('button[type="submit"]');
      const isRentable = !!addProductForm.isRentable?.checked;

      const payload = {
        name: addProductForm.name.value.trim(),
        price: addProductForm.price.value,
        category: addProductForm.category.value.trim(),
        collectionId: addProductForm.collectionId.value || null,
        description: addProductForm.description.value.trim(),
        image: addProductForm.image.value.trim() || 'assets/images/collection/noor-set.jpg',
        stock: addProductForm.stock.value,
        fabric: addProductForm.fabric.value.trim(),
        color: addProductForm.color.value.trim(),
        size: addProductForm.size.value.trim(),
        isRentable
      };

      if (isRentable) {
        payload.rentalBasePrice = addProductForm.rentalBasePrice?.value || 4500;
        payload.rentalPricePerDay = addProductForm.rentalPricePerDay?.value || 1200;
        payload.rentalDeposit = addProductForm.rentalDeposit?.value || 10000;
        payload.rentalAvailableStock = addProductForm.rentalAvailableStock?.value || 2;
        payload.minimumRentalDays = addProductForm.minimumRentalDays?.value || 1;
        payload.maximumRentalDays = addProductForm.maximumRentalDays?.value || 7;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'SAVING PIECE...';

        const res = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to create product');
        }

        if (window.HouseAuth?.showToast) window.HouseAuth.showToast(`"${data.data.name}" added to atelier archive.`);
        addProductModal.classList.remove('open');
        addProductForm.reset();
        document.getElementById('prodRentalFieldsWrap').style.display = 'none';
        await loadAdminData();

      } catch (err) {
        alert(err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'CREATE ATELIER PIECE';
      }
    });
  }

  // Create Collection Modal
  const openColModalBtn = document.getElementById('openAddCollectionModalBtn');
  const addColModal = document.getElementById('addCollectionModal');
  const addColForm = document.getElementById('addCollectionForm');

  if (openColModalBtn && addColModal) {
    openColModalBtn.addEventListener('click', () => {
      addColModal.classList.add('open');
    });
    addColModal.querySelector('.dash-modal-close')?.addEventListener('click', () => {
      addColModal.classList.remove('open');
    });
  }

  if (addColForm) {
    addColForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = addColForm.querySelector('button[type="submit"]');

      const payload = {
        name: addColForm.name.value.trim(),
        description: addColForm.description.value.trim(),
        image: addColForm.image.value.trim() || 'assets/images/collection/noor-set.jpg'
      };

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'SAVING COLLECTION...';

        const res = await fetch(`${API_BASE}/collections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to create collection');
        }

        if (window.HouseAuth?.showToast) window.HouseAuth.showToast(`Collection "${data.data.name}" created.`);
        addColModal.classList.remove('open');
        addColForm.reset();
        await loadAdminData();

      } catch (err) {
        alert(err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'CREATE COLLECTION';
      }
    });
  }

  // Return Processing Modal (#adminReturnModal)
  const returnModal = document.getElementById('adminReturnModal');
  const returnForm = document.getElementById('adminReturnForm');
  if (returnModal) {
    returnModal.querySelector('.dash-modal-close')?.addEventListener('click', () => {
      returnModal.classList.remove('open');
    });

    document.getElementById('retDamageAmount')?.addEventListener('input', recalcReturnSettlement);
    document.getElementById('retLateFee')?.addEventListener('input', recalcReturnSettlement);
  }

  if (returnForm) {
    returnForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rentalId = document.getElementById('retRentalId').value;
      const damageAmount = parseFloat(document.getElementById('retDamageAmount').value) || 0;
      const lateFee = parseFloat(document.getElementById('retLateFee').value) || 0;
      const submitBtn = returnForm.querySelector('button[type="submit"]');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'SETTLING RETURN & ISSUING REFUND...';

        const res = await fetch(`${API_BASE}/admin/rentals/${rentalId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'RETURNED',
            damageAmount,
            lateFee
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Return settlement failed');

        if (window.HouseAuth?.showToast) {
          window.HouseAuth.showToast(`Rental ${rentalId} closed. Deposit settlement processed.`);
        }

        returnModal.classList.remove('open');
        await loadAdminData();

      } catch (err) {
        alert(err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'CONFIRM RETURN & RELEASE DEPOSIT REFUND';
      }
    });
  }

  // Calendar Controls
  const calRefreshBtn = document.getElementById('adminCalendarRefreshBtn');
  const calProdSelect = document.getElementById('adminCalendarProductSelect');
  if (calRefreshBtn && calProdSelect) {
    calRefreshBtn.addEventListener('click', () => {
      const pId = calProdSelect.value;
      if (pId) loadAvailabilityCalendar(pId);
    });
    calProdSelect.addEventListener('change', () => {
      if (calProdSelect.value) loadAvailabilityCalendar(calProdSelect.value);
    });
  }
}
