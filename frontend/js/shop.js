/**
 * ==============================================================================
 * HOUSE OF SHUBHANSHI — SHOP CONTROLLER (Database-Driven)
 * Fetches products and collections from the backend API
 * ==============================================================================
 */

const API_BASE = window.API_BASE_URL || '/api';

let allProducts = [];
let allCollections = [];

document.addEventListener('DOMContentLoaded', () => {
  loadShopData();
  initShopFilters();
});

async function loadShopData() {
  const grid = document.querySelector('.collection-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-brown);">
      <p style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--gold);">✦</p>
      <p>Unfolding the House of Shubhanshi atelier archive...</p>
    </div>
  `;

  try {
    const [prodRes, colRes] = await Promise.all([
      fetch(`${API_BASE}/products`),
      fetch(`${API_BASE}/collections`)
    ]);

    const prodData = await prodRes.json();
    const colData = await colRes.json();

    allProducts = prodData.success ? prodData.data : [];
    allCollections = colData.success ? colData.data : [];

    renderCollectionFilters(allCollections);
    renderProducts(allProducts);

  } catch (err) {
    console.error('Failed to load products:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
        <p style="color: #991B1B;">Unable to connect to atelier vault. Please ensure the backend server is active.</p>
      </div>
    `;
  }
}

function renderCollectionFilters(collections) {
  const filterWrap = document.getElementById('collectionFilterWrap');
  if (!filterWrap) return;

  let html = `<button type="button" class="filter-btn active" data-col="all">ALL PIECES</button>`;
  collections.forEach(c => {
    html += `<button type="button" class="filter-btn" data-col="${c.id}">${c.name.toUpperCase()}</button>`;
  });
  filterWrap.innerHTML = html;

  filterWrap.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterWrap.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const colId = btn.dataset.col;
      if (colId === 'all') {
        renderProducts(allProducts);
      } else {
        const filtered = allProducts.filter(p => p.collectionId === colId);
        renderProducts(filtered);
      }
    });
  });
}

function renderProducts(products) {
  const grid = document.querySelector('.collection-grid');
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-brown);">
        <p style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--brown-dark);">No pieces currently available in this curation.</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">Explore our other collections or contact our bespoke concierge.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((prod, index) => {
    const formattedPrice = Number(prod.price).toLocaleString('en-IN');
    const badgeNum = (index + 1).toString().padStart(2, '0');
    const rentBadge = prod.isRentable 
      ? `<span class="badge-rent-avail">RENT AVAILABLE</span>` 
      : '';
    return `
      <article class="product-card reveal-up reveal-active" data-id="${prod.id}">
        <div class="product-image-wrap scale-hover">
          <span class="product-number-badge">${badgeNum}</span>
          ${rentBadge}
          <img src="${prod.image}" alt="${prod.name}" class="product-image" loading="lazy">
          <button class="product-quick-view" type="button" data-product-id="${prod.id}">VIEW PIECE</button>
        </div>
        <div class="product-info">
          <span class="product-category">${prod.category || 'BESPOKE ATELIER'}</span>
          <h3 class="product-name font-serif">${prod.name}</h3>
          <p class="product-desc">${prod.description}</p>
          <div class="product-price">
            ₹${formattedPrice}
            ${prod.isRentable ? `<span style="font-size: 0.74rem; color: var(--gold-dark); font-weight: normal; margin-left: 8px;">| Rent from ₹${Number(prod.rentalBasePrice).toLocaleString('en-IN')}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Bind Quick View Modals
  grid.querySelectorAll('.product-quick-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pId = btn.dataset.productId;
      openProductModal(pId);
    });
  });
}

function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  let modalBackdrop = document.querySelector('.modal-backdrop');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.id = 'productModal';
    document.body.appendChild(modalBackdrop);
  }

  const formattedPrice = Number(product.price).toLocaleString('en-IN');

  // Format tomorrow for default rental start date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Rental state
  let currentMode = 'BUY'; // 'BUY' or 'RENT'
  let selectedRentalDays = Math.max(product.minimumRentalDays || 1, 3);
  if (selectedRentalDays > (product.maximumRentalDays || 7)) selectedRentalDays = product.maximumRentalDays || 7;
  let selectedStartDate = tomorrowStr;
  let isCheckingAvail = false;
  let isDateAvailable = true;
  let availabilityCapacity = product.rentalAvailableStock || 1;

  modalBackdrop.innerHTML = `
    <div class="modal-card">
      <button class="modal-close-btn" aria-label="Close dialog">&times;</button>
      
      <div class="modal-media">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="modal-body">
        <span class="modal-tag">${product.category || 'HANDCRAFTED COUTURE'}</span>
        <h3 class="modal-title font-serif">${product.name}</h3>
        
        ${product.isRentable ? `
          <div class="rental-mode-switcher">
            <button type="button" class="rental-mode-btn active" data-mode="BUY">✦ BUY PIECE (PERMANENT)</button>
            <button type="button" class="rental-mode-btn" data-mode="RENT">✧ RENT PIECE (1–7 DAYS)</button>
          </div>
        ` : ''}

        <!-- BUY VIEW -->
        <div id="buyModeContainer">
          <div class="modal-price">₹${formattedPrice}</div>
          <p class="modal-desc">${product.description}</p>

          <div class="modal-details-list">
            ${product.fabric ? `<div class="modal-detail-item"><span class="modal-detail-label">Fabric</span><span class="modal-detail-val">${product.fabric}</span></div>` : ''}
            ${product.color ? `<div class="modal-detail-item"><span class="modal-detail-label">Color</span><span class="modal-detail-val">${product.color}</span></div>` : ''}
            ${product.size ? `<div class="modal-detail-item"><span class="modal-detail-label">Sizes</span><span class="modal-detail-val">${product.size}</span></div>` : ''}
            <div class="modal-detail-item"><span class="modal-detail-label">Delivery</span><span class="modal-detail-val">Bespoke Handcrafting (3–4 Weeks)</span></div>
          </div>

          <div class="modal-actions" style="margin-top: 18px;">
            <button type="button" class="btn btn-gold modal-add-to-bag" data-id="${product.id}">
              ADD TO BAG • ₹${formattedPrice}
            </button>
            <a href="https://wa.me/919560011351?text=${encodeURIComponent(`Hello House of Shubhanshi, I would like to inquire regarding purchasing "${product.name}" (₹${formattedPrice}).`)}" 
               target="_blank" rel="noopener noreferrer" class="btn btn-gold-outline modal-enquire-whatsapp">
              INQUIRE VIA WHATSAPP
            </a>
          </div>
        </div>

        <!-- RENT VIEW -->
        ${product.isRentable ? `
          <div id="rentModeContainer" style="display: none;">
            <div class="rental-config-section">
              <!-- Duration Selector -->
              <div>
                <label class="rental-label">Select Rental Duration</label>
                <div class="rental-duration-pills">
                  ${[1, 2, 3, 4, 5, 6, 7].map(d => `
                    <button type="button" class="duration-pill ${d === selectedRentalDays ? 'active' : ''}" data-days="${d}">
                      ${d} ${d === 1 ? 'Day' : 'Days'}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Start Date & End Date -->
              <div>
                <label class="rental-label">Select Rental Start Date</label>
                <input type="date" id="rentalStartDateInput" class="rental-date-input" min="${tomorrowStr}" value="${tomorrowStr}">
              </div>

              <div id="rentalPeriodBanner" class="rental-period-banner">
                Calculating period...
              </div>

              <!-- Pricing & Deposit Breakdown -->
              <div class="rental-cost-breakdown">
                <div class="rental-breakdown-row">
                  <span>Rental Hire Fee:</span>
                  <span id="rentalFeeDisplay" style="font-weight: 600;">₹ 0</span>
                </div>
                <div class="rental-breakdown-row">
                  <span>Refundable Security Deposit:</span>
                  <span id="rentalDepositDisplay" style="font-weight: 600; color: var(--gold-dark);">₹ ${Number(product.rentalDeposit || 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="rental-breakdown-row" style="font-size: 0.72rem; color: #065F46; font-style: italic;">
                  <span>Deposit Refund:</span>
                  <span>100% returned upon garment inspection</span>
                </div>
                <div class="rental-breakdown-row total-row">
                  <span>Total Payable Today:</span>
                  <span id="rentalTotalCostDisplay">₹ 0</span>
                </div>
              </div>

              <!-- Availability Status -->
              <div id="rentalAvailBadgeContainer" style="text-align: center;">
                <span class="avail-status-pill checking">Checking Atelier Availability...</span>
              </div>
            </div>

            <div class="modal-actions" style="margin-top: 14px;">
              <button type="button" id="modalRentPieceBtn" class="btn btn-gold" style="width: 100%;">
                RENT THIS PIECE
              </button>
              <a href="https://wa.me/919560011351?text=${encodeURIComponent(`Hello House of Shubhanshi, I would like to inquire regarding renting "${product.name}".`)}" 
                 target="_blank" rel="noopener noreferrer" class="btn btn-gold-outline modal-enquire-whatsapp">
                INQUIRE VIA WHATSAPP
              </a>
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;

  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Close handlers
  const closeBtn = modalBackdrop.querySelector('.modal-close-btn');
  closeBtn.addEventListener('click', () => {
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  });

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Add to Bag (Buy mode)
  const addToBagBtn = modalBackdrop.querySelector('.modal-add-to-bag');
  if (addToBagBtn) {
    addToBagBtn.addEventListener('click', () => {
      window.HouseCart?.addItem(product);
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // Rental Mode Tab Switcher & Dynamic Calculations
  if (product.isRentable) {
    const buyContainer = modalBackdrop.querySelector('#buyModeContainer');
    const rentContainer = modalBackdrop.querySelector('#rentModeContainer');
    const modeBtns = modalBackdrop.querySelectorAll('.rental-mode-btn');

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        if (currentMode === 'BUY') {
          buyContainer.style.display = 'block';
          rentContainer.style.display = 'none';
        } else {
          buyContainer.style.display = 'none';
          rentContainer.style.display = 'block';
          recalcAndCheckRental();
        }
      });
    });

    // Duration pills
    const pills = modalBackdrop.querySelectorAll('.duration-pill');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        pills.forEach(b => b.classList.remove('active'));
        p.classList.add('active');
        selectedRentalDays = parseInt(p.dataset.days, 10);
        recalcAndCheckRental();
      });
    });

    // Date picker
    const dateInput = modalBackdrop.querySelector('#rentalStartDateInput');
    dateInput.addEventListener('change', () => {
      selectedStartDate = dateInput.value;
      recalcAndCheckRental();
    });

    // Rent piece button
    const rentPieceBtn = modalBackdrop.querySelector('#modalRentPieceBtn');
    rentPieceBtn.addEventListener('click', () => {
      if (!isDateAvailable) {
        alert('This garment is already reserved for these dates. Please choose another start date.');
        return;
      }

      const basePrice = product.rentalBasePrice || 0;
      const pricePerDay = product.rentalPricePerDay || 0;
      const rentalPrice = basePrice + (pricePerDay * (selectedRentalDays - 1));
      const deposit = product.rentalDeposit || 0;
      const totalCost = rentalPrice + deposit;

      // Compute end date
      const parts = selectedStartDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + (selectedRentalDays - 1));
      const endDateStr = d.toISOString().split('T')[0];

      const rentalOptions = {
        rentalDays: selectedRentalDays,
        rentalStartDate: selectedStartDate,
        rentalEndDate: endDateStr,
        rentalPrice,
        securityDeposit: deposit,
        totalRentalCost: totalCost
      };

      window.HouseCart?.addItem(product, 1, rentalOptions);
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    });

    async function recalcAndCheckRental() {
      const basePrice = product.rentalBasePrice || 0;
      const pricePerDay = product.rentalPricePerDay || 0;
      const rentalPrice = basePrice + (pricePerDay * (selectedRentalDays - 1));
      const deposit = product.rentalDeposit || 0;
      const totalCost = rentalPrice + deposit;

      // Format End Date
      const parts = selectedStartDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + (selectedRentalDays - 1));
      const endDateStr = d.toISOString().split('T')[0];

      const periodBanner = modalBackdrop.querySelector('#rentalPeriodBanner');
      if (periodBanner) {
        periodBanner.innerHTML = `<strong>Rental Window:</strong> ${selectedStartDate} &rarr; ${endDateStr} (${selectedRentalDays} ${selectedRentalDays === 1 ? 'Day' : 'Days'})`;
      }

      const feeEl = modalBackdrop.querySelector('#rentalFeeDisplay');
      if (feeEl) feeEl.textContent = `₹ ${Number(rentalPrice).toLocaleString('en-IN')}`;

      const totalEl = modalBackdrop.querySelector('#rentalTotalCostDisplay');
      if (totalEl) totalEl.textContent = `₹ ${Number(totalCost).toLocaleString('en-IN')}`;

      const rentPieceBtn = modalBackdrop.querySelector('#modalRentPieceBtn');
      if (rentPieceBtn) {
        rentPieceBtn.textContent = `RENT THIS PIECE • ₹${Number(totalCost).toLocaleString('en-IN')}`;
      }

      // Check real availability via backend API
      const badgeContainer = modalBackdrop.querySelector('#rentalAvailBadgeContainer');
      if (badgeContainer) {
        badgeContainer.innerHTML = `<span class="avail-status-pill checking">Verifying Atelier Availability...</span>`;
      }

      try {
        const res = await fetch(`${API_BASE}/rentals/availability?productId=${product.id}&startDate=${selectedStartDate}&days=${selectedRentalDays}`);
        const data = await res.json();

        if (data.success && data.data) {
          isDateAvailable = data.data.available;
          availabilityCapacity = data.data.remainingCapacity;

          if (isDateAvailable) {
            badgeContainer.innerHTML = `<span class="avail-status-pill available">✔ Available for Selected Dates (${availabilityCapacity} piece${availabilityCapacity > 1 ? 's' : ''} in vault)</span>`;
            rentPieceBtn.disabled = false;
            rentPieceBtn.style.opacity = '1';
          } else {
            badgeContainer.innerHTML = `<span class="avail-status-pill unavailable">✖ Reserved for Selected Dates. Please choose alternative dates.</span>`;
            rentPieceBtn.disabled = true;
            rentPieceBtn.style.opacity = '0.5';
          }
        }
      } catch (e) {
        console.error('Availability check error:', e);
        badgeContainer.innerHTML = `<span class="avail-status-pill available">✔ Available for Reservation</span>`;
      }
    }
  }
}

function initShopFilters() {
  // Can be expanded with search
}
