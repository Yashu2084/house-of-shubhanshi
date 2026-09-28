/**
 * ==============================================================================
 * HOUSE OF SHUBHANSHI — ORDERS & ORDER STATUS CONTROLLER
 * Fetches real-time order data and renders horizontal & vertical status timelines
 * ==============================================================================
 */

const API_BASE = window.API_BASE_URL || '/api';

const STATUS_STEPS = [
  { key: 'RECEIVED', label: 'Order Received', desc: 'Crafting & Karigari Commenced' },
  { key: 'DISPATCHED', label: 'Dispatched', desc: 'Handcrafted Packaging Sealed' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'En Route to Destination' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Safely Arrived in Your Wardrobe' }
];

document.addEventListener('DOMContentLoaded', async () => {
  const user = window.HouseAuth ? await window.HouseAuth.getAuthUser() : null;
  if (!user) {
    window.location.href = 'login.html?redirect=orders.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (orderId) {
    loadSingleOrder(orderId);
  } else {
    loadAllUserOrders();
  }
});

async function loadAllUserOrders() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <p style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--gold);">✦</p>
      <p>Retrieving your bespoke orders from the House archive...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/orders`, { credentials: 'include' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }

    const orders = data.data;

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✦</div>
          <h2 class="empty-state-title">You haven't placed an order yet.</h2>
          <p style="font-size: 0.88rem; line-height: 1.7; max-width: 480px; margin: 0 auto 24px;">
            Explore our curated collections of heirloom bridal silks, zardozi kurtas, and artisanal drapes.
          </p>
          <a href="shop.html" class="btn btn-gold">EXPLORE ATELIER COLLECTION</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        ${orders.map(order => renderOrderCardSummary(order)).join('')}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #991B1B;">${err.message}</p>
      </div>
    `;
  }
}

function renderOrderCardSummary(order) {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const itemCount = order.items ? order.items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 0;
  const statusClass = `status-${order.status.toLowerCase().replace(/_/g, '-')}`;

  return `
    <div class="dash-panel" style="margin-bottom: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid rgba(201, 160, 74, 0.2); padding-bottom: 14px; margin-bottom: 18px;">
        <div>
          <span style="font-size: 0.72rem; letter-spacing: 0.16em; color: var(--gold); text-transform: uppercase;">ORDER IDENTIFIER</span>
          <h3 class="font-serif" style="font-size: 1.35rem; color: var(--brown-dark); margin-top: 2px;">#${order.orderNumber}</h3>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="status-badge ${statusClass}">${order.status.replace(/_/g, ' ')}</span>
          <a href="orders.html?id=${order.orderNumber}" class="btn btn-gold-outline-dark" style="padding: 8px 16px; font-size: 0.74rem;">VIEW TRACKER</a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; font-size: 0.85rem; margin-bottom: 18px;">
        <div>
          <span style="color: var(--text-brown); display:block; font-size:0.72rem; text-transform:uppercase;">Order Date</span>
          <strong style="color: var(--brown-dark);">${orderDate}</strong>
        </div>
        <div>
          <span style="color: var(--text-brown); display:block; font-size:0.72rem; text-transform:uppercase;">Total Amount</span>
          <strong style="color: var(--brown-deep);">₹${Number(order.totalAmount).toLocaleString('en-IN')}</strong>
        </div>
        <div>
          <span style="color: var(--text-brown); display:block; font-size:0.72rem; text-transform:uppercase;">Pieces Reserved</span>
          <strong style="color: var(--brown-dark);">${itemCount} Piece${itemCount > 1 ? 's' : ''}</strong>
        </div>
        <div>
          <span style="color: var(--text-brown); display:block; font-size:0.72rem; text-transform:uppercase;">Payment Status</span>
          <span class="status-badge status-${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span>
        </div>
      </div>

      <!-- Items Mini List -->
      <div style="border-top: 1px solid rgba(122, 50, 29, 0.08); padding-top: 14px;">
        <ul style="list-style: none; padding-left: 0; display: flex; flex-direction: column; gap: 8px;">
          ${(order.items || []).map(it => {
            const isRental = it.purchaseType === 'RENT' || it.rentalDays;
            return `
              <li style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 0.84rem; padding: 4px 0;">
                <div>
                  <span><strong>${it.quantity}x</strong> ${it.productName}</span>
                  ${isRental ? `
                    <span class="badge-rent-avail" style="font-size: 0.62rem; padding: 2px 6px; margin-left: 6px; vertical-align: middle;">RENTAL • ${it.rentalDays}D</span>
                    <div style="font-size: 0.72rem; color: var(--text-brown); margin-top: 2px;">
                      Window: ${it.rentalStartDate ? it.rentalStartDate.split('T')[0] : 'Pending'} → ${it.rentalEndDate ? it.rentalEndDate.split('T')[0] : 'Pending'} &bull; Deposit: ₹${Number(it.securityDeposit || 0).toLocaleString('en-IN')}
                    </div>
                  ` : ''}
                </div>
                <span style="color: var(--brown-deep); font-weight: 500;">₹${Number(it.price * it.quantity).toLocaleString('en-IN')}</span>
              </li>
            `;
          }).join('')}
        </ul>
        ${order.rentalDepositTotal > 0 ? `
          <div style="background: rgba(201, 160, 74, 0.08); border: 1px dashed var(--gold-border); padding: 8px 12px; margin-top: 10px; font-size: 0.76rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--brown-dark);">✦ Includes Refundable Security Deposit:</span>
            <strong style="color: var(--gold-dark);">₹${Number(order.rentalDepositTotal).toLocaleString('en-IN')}</strong>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

async function loadSingleOrder(orderIdentifier) {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <p style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--gold);">✦</p>
      <p>Synchronizing real-time timeline for order #${orderIdentifier}...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/orders/${orderIdentifier}`, { credentials: 'include' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Order could not be found');
    }

    const order = data.data;
    renderSingleOrderTracker(order, container);

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #991B1B;">${err.message}</p>
        <a href="orders.html" class="btn btn-gold" style="margin-top: 16px;">VIEW ALL ORDERS</a>
      </div>
    `;
  }
}

function renderSingleOrderTracker(order, container) {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const isCancelled = order.status === 'CANCELLED';
  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
  const progressPercent = isCancelled ? 0 : Math.max(0, Math.min(100, (currentStatusIndex / (STATUS_STEPS.length - 1)) * 100));

  container.innerHTML = `
    <div class="order-tracker-card">
      <div class="order-tracker-header">
        <div>
          <a href="orders.html" style="font-size: 0.76rem; letter-spacing: 0.1em; color: var(--text-brown); text-decoration: none; display: inline-flex; align-items:center; gap: 4px; margin-bottom: 6px;">
            ← BACK TO ALL ORDERS
          </a>
          <h1 class="order-tracker-num">ORDER #${order.orderNumber}</h1>
          <span style="font-size: 0.82rem; color: var(--text-brown);">Placed on ${orderDate} &bull; White-Glove Insured Delivery</span>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span class="status-badge status-${order.status.toLowerCase().replace(/_/g, '-')}">${order.status.replace(/_/g, ' ')}</span>
          <span class="status-badge status-${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span>
        </div>
      </div>

      ${isCancelled ? `
        <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 24px; text-align: center; color: #991B1B; margin: 24px 0;">
          <h3 class="font-serif" style="font-size: 1.4rem; margin-bottom: 6px;">THIS ORDER HAS BEEN CANCELLED</h3>
          <p style="font-size: 0.86rem;">If you have inquiries regarding refunds or bespoke custom pieces, please connect with our atelier concierge.</p>
        </div>
      ` : `
        <!-- Desktop Horizontal Timeline Tracker -->
        <div class="order-timeline-horizontal">
          <div class="timeline-progress-bar">
            <div class="timeline-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
          ${STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;
            const stateClass = isCompleted ? 'completed' : (isCurrent ? 'current' : '');
            const checkmark = isCompleted ? '✓' : (isCurrent ? '●' : '○');
            return `
              <div class="timeline-step ${stateClass}">
                <div class="step-node">${checkmark}</div>
                <div class="step-title">${step.label}</div>
                <span style="font-size: 0.68rem; color: var(--text-brown); margin-top: 4px; line-height: 1.3;">${step.desc}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Mobile Vertical Timeline Tracker -->
        <div class="order-timeline-vertical">
          ${STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;
            const stateClass = isCompleted ? 'completed' : (isCurrent ? 'current' : '');
            const checkmark = isCompleted ? '✓' : (isCurrent ? '●' : '○');
            return `
              <div class="timeline-v-step ${stateClass}">
                <div class="timeline-v-node">${checkmark}</div>
                <div class="timeline-v-title">${step.label}</div>
                <div style="font-size: 0.74rem; color: var(--text-brown); margin-top: 2px;">${step.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <!-- Order Details Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; border-top: 1px solid rgba(201, 160, 74, 0.2); padding-top: 28px; margin-top: 36px;">
        
        <!-- Reserved Pieces -->
        <div>
          <h3 class="font-serif" style="font-size: 1.3rem; color: var(--brown-dark); margin-bottom: 16px;">RESERVED HEIRLOOMS</h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${(order.items || []).map(it => {
              const isRental = it.purchaseType === 'RENT' || it.rentalDays;
              return `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(122, 50, 29, 0.08); padding-bottom: 12px;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <h4 style="font-size: 0.92rem; font-weight: 600; color: var(--brown-dark); margin: 0;">${it.productName}</h4>
                      ${isRental ? `<span class="badge-rent-avail" style="font-size: 0.62rem; padding: 2px 7px;">RENTAL • ${it.rentalDays} DAYS</span>` : ''}
                    </div>
                    <span style="font-size: 0.76rem; color: var(--text-brown); display: block; margin-top: 4px;">
                      Quantity: ${it.quantity} &bull; ${isRental ? 'Hire Fee' : 'Unit Price'}: ₹${Number(it.price).toLocaleString('en-IN')}
                    </span>
                    ${isRental ? `
                      <div style="margin-top: 6px; font-size: 0.74rem; background: var(--ivory); padding: 4px 8px; border: 1px solid var(--gold-border); display: inline-block;">
                        <span style="color: var(--brown-dark);">Window: <strong>${it.rentalStartDate ? it.rentalStartDate.split('T')[0] : 'Pending'}</strong> to <strong>${it.rentalEndDate ? it.rentalEndDate.split('T')[0] : 'Pending'}</strong></span>
                        <span style="color: var(--gold-dark); margin-left: 8px;">&bull; Deposit: ₹${Number(it.securityDeposit || 0).toLocaleString('en-IN')} (Refundable)</span>
                      </div>
                    ` : ''}
                  </div>
                  <div style="font-weight: 600; color: var(--brown-deep);">₹${Number(it.price * it.quantity).toLocaleString('en-IN')}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Total Breakdown -->
          <div style="margin-top: 16px; border-top: 1px solid rgba(201, 160, 74, 0.2); padding-top: 12px;">
            ${order.rentalDepositTotal > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: var(--text-brown); margin-bottom: 6px;">
                <span>Garments &amp; Rental Hire:</span>
                <span>₹${(Number(order.totalAmount) - Number(order.rentalDepositTotal)).toLocaleString('en-IN')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.84rem; color: var(--gold-dark); margin-bottom: 8px;">
                <span>Refundable Security Deposit:</span>
                <span>₹${Number(order.rentalDepositTotal).toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 700; color: var(--brown-dark);">
              <span class="font-serif">Grand Total:</span>
              <span class="font-serif" style="color: var(--brown-deep);">₹${Number(order.totalAmount).toLocaleString('en-IN')}</span>
            </div>
            ${order.items && order.items.some(i => i.purchaseType === 'RENT') ? `
              <div style="margin-top: 14px; padding: 10px; background: rgba(201, 160, 74, 0.08); border-left: 3px solid var(--gold); font-size: 0.78rem; color: var(--brown-dark); display: flex; justify-content: space-between; align-items: center;">
                <span>Includes rented couture pieces. You can schedule returns in your dashboard.</span>
                <a href="customer-dashboard.html#rentals" style="color: var(--terracotta); font-weight: 600; text-decoration: underline; margin-left: 8px;">MY RENTALS →</a>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Shipping & Client Details -->
        <div>
          <h3 class="font-serif" style="font-size: 1.3rem; color: var(--brown-dark); margin-bottom: 16px;">DELIVERY RECIPIENT</h3>
          <div style="background: var(--ivory); border: 1px solid var(--gold-border); padding: 20px; font-size: 0.88rem; line-height: 1.7; color: var(--brown-darker);">
            <p><strong>Client:</strong> ${order.user?.name || 'House Client'}</p>
            <p><strong>Contact Phone:</strong> ${order.phone || '+91 9560011351'}</p>
            <p><strong>Destination:</strong> ${order.shippingAddress}</p>
            <p><strong>Payment Mode:</strong> ${order.paymentStatus === 'COD' ? 'Cash on Delivery' : 'Direct Concierge Settlement'}</p>
          </div>
        </div>

      </div>
    </div>
  `;
}
