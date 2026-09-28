/**
 * ==============================================================================
 * HOUSE OF SHUBHANSHI — CART & CHECKOUT CONTROLLER
 * Manages bespoke bag storage, BUY & RENT items, and backend order creation
 * ==============================================================================
 */

const CART_STORAGE_KEY = 'house_of_shubhanshi_cart';
const API_BASE = window.API_BASE_URL || '/api';

function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCartItems(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    updateCartBadges();
  } catch (e) {
    console.error(e);
  }
}

function updateCartBadges() {
  const items = getCartItems();
  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  document.querySelectorAll('.cart-count').forEach(badge => {
    badge.textContent = totalCount;
  });
}

/**
 * Add an item to cart (supports permanent BUY or RENT)
 */
function addItem(product, quantity = 1, rentalOptions = null) {
  const items = getCartItems();

  if (rentalOptions) {
    const cartItemId = `${product.id}_rent_${rentalOptions.rentalStartDate}_${rentalOptions.rentalDays}`;
    const existing = items.find(i => i.cartItemId === cartItemId);

    if (existing) {
      if (window.HouseAuth?.showToast) {
        window.HouseAuth.showToast(`"${product.name}" rental is already in your bag.`);
      }
      return;
    }

    items.push({
      cartItemId,
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      purchaseType: 'RENT',
      price: rentalOptions.totalRentalCost,
      rentalPrice: rentalOptions.rentalPrice,
      securityDeposit: rentalOptions.securityDeposit,
      rentalDays: rentalOptions.rentalDays,
      rentalStartDate: rentalOptions.rentalStartDate,
      rentalEndDate: rentalOptions.rentalEndDate,
      quantity: 1
    });

    saveCartItems(items);
    if (window.HouseAuth?.showToast) {
      window.HouseAuth.showToast(`"${product.name}" (${rentalOptions.rentalDays}-Day Rental) reserved in your bag.`);
    }
  } else {
    const cartItemId = `${product.id}_buy`;
    const existing = items.find(i => (i.cartItemId === cartItemId) || (i.productId === product.id && i.purchaseType !== 'RENT'));

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        cartItemId,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        purchaseType: 'BUY',
        quantity
      });
    }

    saveCartItems(items);
    if (window.HouseAuth?.showToast) {
      window.HouseAuth.showToast(`"${product.name}" added to your curated bag.`);
    }
  }
}

function removeItem(cartItemId) {
  let items = getCartItems();
  items = items.filter(i => (i.cartItemId || i.productId) !== cartItemId);
  saveCartItems(items);
  renderCartPage();
}

function updateItemQuantity(cartItemId, delta) {
  const items = getCartItems();
  const item = items.find(i => (i.cartItemId || i.productId) === cartItemId);
  if (!item) return;

  // Rental items cannot have variable quantity
  if (item.purchaseType === 'RENT') return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    return removeItem(cartItemId);
  }

  saveCartItems(items);
  renderCartPage();
}

function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartBadges();
  renderCartPage();
}

/**
 * Render Cart Page (cart.html)
 */
async function renderCartPage() {
  const cartContainer = document.getElementById('cartContentContainer');
  if (!cartContainer) return;

  const items = getCartItems();

  if (items.length === 0) {
    cartContainer.innerHTML = `
      <div style="background: var(--white); border: 1px solid var(--gold-border); padding: clamp(30px, 5vw, 60px); max-width: 620px; margin: 30px auto; text-align: center; box-shadow: 0 10px 30px rgba(59, 29, 20, 0.06);">
        <div style="font-size: 2.2rem; color: var(--gold); margin-bottom: 14px;">✦</div>
        <h2 class="font-serif" style="font-size: 1.6rem; color: var(--brown-dark); margin-bottom: 12px; font-weight: 500;">
          YOUR BAG AWAITS YOUR SELECTION
        </h2>
        <p style="font-size: 0.88rem; color: var(--text-brown); line-height: 1.7; margin-bottom: 28px;">
          Explore our signature creations for permanent acquisition or reserve an atelier dress rental for your upcoming celebrations.
        </p>
        <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
          <a href="shop.html" class="btn btn-gold">EXPLORE COLLECTION</a>
          <a href="https://wa.me/919560011351" target="_blank" rel="noopener noreferrer" class="btn btn-gold-outline-dark" aria-label="Connect with Concierge on WhatsApp">CONNECT WITH CONCIERGE</a>
        </div>
      </div>
    `;
    return;
  }

  let garmentsSubtotal = 0;
  let depositsTotal = 0;

  items.forEach(i => {
    if (i.purchaseType === 'RENT') {
      garmentsSubtotal += (i.rentalPrice || 0);
      depositsTotal += (i.securityDeposit || 0);
    } else {
      garmentsSubtotal += (i.price * (i.quantity || 1));
    }
  });

  const grandTotal = garmentsSubtotal + depositsTotal;
  const currentUser = window.HouseAuth ? await window.HouseAuth.getAuthUser() : null;

  cartContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 36px; text-align: left; max-width: 1100px; margin: 0 auto;">
      
      <!-- Cart Items List -->
      <div style="background: var(--white); border: 1px solid var(--gold-border); padding: clamp(24px, 3.5vw, 36px);">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; border-bottom: 1px solid rgba(201, 160, 74, 0.2); padding-bottom: 14px;">
          <h2 class="font-serif" style="font-size: 1.5rem; color: var(--brown-dark);">SELECTED HEIRLOOMS (${items.length})</h2>
          <button type="button" id="clearCartBtn" style="background:none; border:none; color: var(--text-brown); font-size: 0.76rem; letter-spacing:0.08em; cursor:pointer; text-decoration:underline;">CLEAR BAG</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${items.map(item => {
            const isRental = item.purchaseType === 'RENT';
            const itemId = item.cartItemId || item.productId;
            return `
              <div style="display: flex; gap: 18px; align-items: flex-start; border-bottom: 1px solid rgba(122, 50, 29, 0.08); padding-bottom: 18px;">
                <img src="${item.image}" alt="${item.name}" style="width: 76px; height: 98px; object-fit: cover; border: 1px solid var(--gold-border); flex-shrink: 0;">
                
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="font-size: 0.68rem; letter-spacing: 0.16em; color: var(--gold); text-transform: uppercase;">${item.category || 'ATELIER PIECE'}</span>
                    ${isRental ? `<span class="badge-status badge-status-reserved" style="font-size: 0.62rem; padding: 2px 6px;">RENTAL • ${item.rentalDays} DAYS</span>` : `<span class="badge-status badge-status-active" style="font-size: 0.62rem; padding: 2px 6px;">PURCHASE</span>`}
                  </div>

                  <h3 class="font-serif" style="font-size: 1.15rem; color: var(--brown-dark); margin: 4px 0 4px;">${item.name}</h3>

                  ${isRental ? `
                    <div style="font-size: 0.78rem; color: var(--text-brown); margin-bottom: 6px; background: var(--ivory); padding: 4px 8px; border-left: 2px solid var(--gold);">
                      Dates: <strong>${item.rentalStartDate}</strong> &rarr; <strong>${item.rentalEndDate}</strong> (${item.rentalDays} Days)
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                      <div style="font-size: 0.92rem; font-weight: 600; color: var(--brown-deep);">
                        Hire Fee: ₹${Number(item.rentalPrice).toLocaleString('en-IN')}
                      </div>
                      <div style="font-size: 0.76rem; color: var(--gold-dark); font-weight: 600;">
                        + ₹${Number(item.securityDeposit).toLocaleString('en-IN')} Security Deposit (Refundable)
                      </div>
                    </div>
                  ` : `
                    <div style="font-size: 0.92rem; font-weight: 600; color: var(--brown-deep);">
                      ₹${Number(item.price).toLocaleString('en-IN')}
                    </div>
                  `}
                </div>

                <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                  ${!isRental ? `
                    <button type="button" class="btn-qty-minus" data-id="${itemId}" style="width:26px; height:26px; border:1px solid var(--gold-border); background:var(--ivory); cursor:pointer;">-</button>
                    <span style="font-size: 0.88rem; font-weight:600; width: 20px; text-align:center;">${item.quantity}</span>
                    <button type="button" class="btn-qty-plus" data-id="${itemId}" style="width:26px; height:26px; border:1px solid var(--gold-border); background:var(--ivory); cursor:pointer;">+</button>
                  ` : `
                    <span style="font-size: 0.74rem; color: var(--text-brown); letter-spacing: 0.04em;">1 Unit</span>
                  `}
                </div>

                <button type="button" class="btn-remove-item" data-id="${itemId}" style="background:none; border:none; color:#B91C1C; cursor:pointer; font-size:1.2rem; padding: 4px;" title="Remove piece">&times;</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Checkout Desk -->
      <div style="background: var(--white); border: 1px solid var(--gold-border); padding: clamp(24px, 3.5vw, 36px); height: fit-content;">
        <h2 class="font-serif" style="font-size: 1.5rem; color: var(--brown-dark); margin-bottom: 16px; border-bottom: 1px solid rgba(201, 160, 74, 0.2); padding-bottom: 14px;">
          BESPOKE SUMMARY
        </h2>

        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem;">
          <span style="color: var(--text-brown);">Garment Subtotal:</span>
          <span style="font-weight: 600; color: var(--brown-dark);">₹${Number(garmentsSubtotal).toLocaleString('en-IN')}</span>
        </div>

        ${depositsTotal > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; color: #065F46;">
            <span>Security Deposit (100% Refundable):</span>
            <span style="font-weight: 600;">₹${Number(depositsTotal).toLocaleString('en-IN')}</span>
          </div>
          <p style="font-size: 0.72rem; color: var(--text-brown); margin: -4px 0 10px; font-style: italic;">
            * Security deposits are refunded within 48 hours following garment return & atelier inspection.
          </p>
        ` : ''}

        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.9rem;">
          <span style="color: var(--text-brown);">White-Glove Insured Delivery:</span>
          <span style="color: var(--gold-dark); font-weight:600;">COMPLIMENTARY</span>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 24px; padding-top: 14px; border-top: 1px solid rgba(201, 160, 74, 0.2); font-size: 1.15rem;">
          <span class="font-serif" style="font-weight: 600; color: var(--brown-dark);">Total Amount Payable:</span>
          <span class="font-serif" style="font-weight: 700; color: var(--brown-deep);">₹${Number(grandTotal).toLocaleString('en-IN')}</span>
        </div>

        ${currentUser ? `
          <!-- Authenticated Checkout Form -->
          <form id="checkoutOrderForm" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="form-group">
              <label class="form-label">Client Name</label>
              <input type="text" class="form-input" value="${currentUser.name}" disabled style="background:#FDFBF7;">
            </div>
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="tel" name="phone" class="form-input" value="${currentUser.phone || ''}" placeholder="+91 9560011351" required>
            </div>
            <div class="form-group">
              <label class="form-label">Delivery Suite / Address</label>
              <textarea name="shippingAddress" class="form-input" rows="3" placeholder="Enter complete delivery address..." required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Preference</label>
              <select name="paymentMethod" class="form-input" style="cursor: pointer;">
                <option value="PAID">Card / UPI / NetBanking (Instant Confirmation)</option>
                <option value="COD">Cash on Delivery / Concierge Delivery</option>
                <option value="PENDING">Direct Bank Transfer / Private Invoice</option>
              </select>
            </div>
            <button type="submit" class="btn btn-gold" style="width:100%; margin-top: 10px; padding: 15px;">
              PLACE ORDER &bull; ₹${Number(grandTotal).toLocaleString('en-IN')}
            </button>
          </form>
        ` : `
          <!-- Guest Needs Login -->
          <div style="background: var(--ivory); border-left: 3px solid var(--gold); padding: 16px; margin-bottom: 20px;">
            <p style="font-size: 0.86rem; color: var(--brown-dark); line-height: 1.6;">
              Please sign in or register your House of Shubhanshi account to finalize your order, secure your dates, and access real-time status tracking.
            </p>
          </div>
          <a href="login.html?redirect=cart.html" class="btn btn-gold" style="width: 100%; text-align: center; margin-bottom: 12px; display: block;">
            SIGN IN TO PLACE ORDER
          </a>
          <a href="signup.html" class="btn btn-gold-outline-dark" style="width: 100%; text-align: center; display: block;">
            CREATE PRIVATE ACCOUNT
          </a>
        `}
      </div>
    </div>
  `;

  // Attach button event listeners
  document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);

  cartContainer.querySelectorAll('.btn-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => updateItemQuantity(btn.dataset.id, 1));
  });

  cartContainer.querySelectorAll('.btn-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => updateItemQuantity(btn.dataset.id, -1));
  });

  cartContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => removeItem(btn.dataset.id));
  });

  // Attach checkout form submit
  const checkoutForm = document.getElementById('checkoutOrderForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = checkoutForm.querySelector('button[type="submit"]');
      const phone = checkoutForm.phone.value.trim();
      const shippingAddress = checkoutForm.shippingAddress.value.trim();
      const paymentMethod = checkoutForm.paymentMethod.value;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'TRANSMITTING ORDER & LOCKING RESERVATIONS...';

        const orderItemsPayload = items.map(i => ({
          productId: i.productId,
          productName: i.purchaseType === 'RENT' ? `${i.name} (Rental - ${i.rentalDays} Days)` : i.name,
          quantity: i.quantity || 1,
          price: i.purchaseType === 'RENT' ? i.rentalPrice : i.price,
          purchaseType: i.purchaseType || 'BUY',
          rentalDays: i.rentalDays || null,
          rentalStartDate: i.rentalStartDate || null,
          rentalEndDate: i.rentalEndDate || null
        }));

        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            items: orderItemsPayload,
            shippingAddress,
            phone,
            paymentMethod
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to place order');
        }

        const createdOrder = data.data;
        clearCart();

        if (window.HouseAuth?.showToast) {
          window.HouseAuth.showToast(`Order #${createdOrder.orderNumber} successfully placed!`);
        }

        setTimeout(() => {
          window.location.href = `customer-dashboard.html`;
        }, 1000);

      } catch (err) {
        alert(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = `PLACE ORDER • ₹${Number(grandTotal).toLocaleString('en-IN')}`;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadges();
  renderCartPage();
});

window.HouseCart = {
  getCartItems,
  addItem,
  removeItem,
  updateItemQuantity,
  clearCart,
  updateCartBadges,
  renderCartPage
};
