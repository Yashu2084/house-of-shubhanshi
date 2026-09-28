// ==============================================================================
// HOUSE OF SHUBHANSHI — RENTAL SERVICE
// Comprehensive rental pricing, availability scheduling & lifecycle management
// ==============================================================================
const db = require('../config/db');

const ALLOWED_RENTAL_STATUSES = [
  'RESERVED',
  'ACTIVE',
  'RETURN_PENDING',
  'RETURNED',
  'CANCELLED',
  'OVERDUE'
];

/**
 * Format Date to YYYY-MM-DD
 */
function formatDate(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate Rental End Date
 * e.g. Start 2026-10-01 for 3 days -> 2026-10-03 (Day 1: Oct 1, Day 2: Oct 2, Day 3: Oct 3)
 */
function calculateRentalEndDate(startDateStr, rentalDays) {
  const parts = startDateStr.split('-');
  const start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  start.setDate(start.getDate() + (rentalDays - 1));
  return formatDate(start);
}

/**
 * Calculate Exact Rental Price & Security Deposit
 * Never trust client pricing
 */
function calculateRentalPrice(product, rentalDays) {
  const days = Math.max(1, parseInt(rentalDays, 10) || 1);
  const minDays = product.minimumRentalDays || 1;
  const maxDays = product.maximumRentalDays || 7;

  if (days < minDays) {
    const error = new Error(`Minimum rental duration for "${product.name}" is ${minDays} day(s).`);
    error.statusCode = 400;
    throw error;
  }

  if (days > maxDays) {
    const error = new Error(`Maximum rental duration for "${product.name}" is ${maxDays} days.`);
    error.statusCode = 400;
    throw error;
  }

  const basePrice = parseFloat(product.rentalBasePrice) || 0;
  const pricePerDay = parseFloat(product.rentalPricePerDay) || 0;
  const rentalDeposit = parseFloat(product.rentalDeposit) || 0;

  // Day 1 covered by basePrice; additional days billed at pricePerDay
  const rentalPrice = basePrice + (pricePerDay * (days - 1));
  const totalRentalCost = rentalPrice + rentalDeposit;

  return {
    rentalDays: days,
    basePrice,
    pricePerDay,
    rentalPrice,
    securityDeposit: rentalDeposit,
    totalRentalCost
  };
}

/**
 * Check Real Inventory Availability for Requested Date Range
 * Overlap formula: existing_start <= requested_end AND existing_end >= requested_start
 */
async function checkProductAvailability(productId, startDateStr, rentalDays, requestedQty = 1, excludeRentalId = null) {
  if (!startDateStr || !rentalDays) {
    const error = new Error('Both start date and rental duration are required.');
    error.statusCode = 400;
    throw error;
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (!product.isRentable) {
    return {
      available: false,
      reason: 'This garment is currently only available for permanent purchase.',
      isRentable: false
    };
  }

  const days = Math.max(1, parseInt(rentalDays, 10));
  const endDateStr = calculateRentalEndDate(startDateStr, days);

  // Validate start date is not in past
  const todayStr = formatDate(new Date());
  if (startDateStr < todayStr) {
    const error = new Error('Rental reservation start date cannot be in the past.');
    error.statusCode = 400;
    throw error;
  }

  const availableStock = product.rentalAvailableStock !== undefined && product.rentalAvailableStock !== null
    ? parseInt(product.rentalAvailableStock, 10)
    : 1;

  // Query overlapping active reservations
  const params = [productId, startDateStr, endDateStr];
  let excludeSql = '';
  if (excludeRentalId) {
    params.push(excludeRentalId);
    excludeSql = `AND id != $${params.length}`;
  }

  const queryText = `
    SELECT COUNT(*) as count 
    FROM rentals 
    WHERE product_id = $1 
      AND status IN ('RESERVED', 'ACTIVE', 'RETURN_PENDING') 
      AND start_date <= $3 
      AND end_date >= $2
      ${excludeSql}
  `;

  const conflictRes = await db.query(queryText, params);
  const reservedCount = parseInt(conflictRes.rows[0].count, 10);
  const remainingCapacity = Math.max(0, availableStock - reservedCount);
  const isAvailable = remainingCapacity >= requestedQty;

  const pricing = calculateRentalPrice(product, days);

  return {
    available: isAvailable,
    productId: product.id,
    productName: product.name,
    startDate: startDateStr,
    endDate: endDateStr,
    rentalDays: days,
    availableStock,
    reservedCount,
    remainingCapacity,
    pricing
  };
}

/**
 * Customer: Get Patron's Rental Reservations
 */
async function getCustomerRentals(userId, filters = {}) {
  const where = { userId };
  if (filters.status) {
    where.status = filters.status;
  }

  const rentals = await db.rental.findMany({
    where,
    orderBy: 'r.created_at DESC'
  });

  return rentals;
}

/**
 * Admin: Get All Rental Reservations with Overview Metrics
 */
async function getAdminRentals(filters = {}) {
  const where = {};
  if (filters.status && ALLOWED_RENTAL_STATUSES.includes(filters.status)) {
    where.status = filters.status;
  }
  if (filters.productId) {
    where.productId = filters.productId;
  }

  const rentals = await db.rental.findMany({
    where,
    orderBy: 'r.created_at DESC'
  });

  // Calculate rental summary metrics
  const allRentals = await db.rental.findMany();
  const todayStr = formatDate(new Date());

  const activeRentals = allRentals.filter(r => r.status === 'ACTIVE' || r.status === 'RESERVED');
  const returnPending = allRentals.filter(r => r.status === 'RETURN_PENDING');
  const overdueRentals = allRentals.filter(r => r.status === 'OVERDUE' || (['RESERVED', 'ACTIVE', 'RETURN_PENDING'].includes(r.rawStatus) && r.endDate < todayStr));
  const returnedRentals = allRentals.filter(r => r.status === 'RETURNED');
  
  const totalHeldDeposits = allRentals
    .filter(r => r.depositStatus === 'HELD')
    .reduce((sum, r) => sum + (r.securityDeposit || 0), 0);

  const rentalRevenue = allRentals
    .filter(r => r.status !== 'CANCELLED')
    .reduce((sum, r) => sum + (r.rentalPrice || 0), 0);

  return {
    rentals,
    metrics: {
      totalRentals: allRentals.length,
      activeCount: activeRentals.length,
      returnPendingCount: returnPending.length,
      overdueCount: overdueRentals.length,
      returnedCount: returnedRentals.length,
      totalHeldDeposits,
      rentalRevenue
    }
  };
}

/**
 * Get Single Rental Reservation by ID
 */
async function getRentalById(rentalId, requestingUser = null) {
  const rental = await db.rental.findUnique({ where: { id: rentalId } });
  if (!rental) {
    const error = new Error('Rental reservation not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestingUser && requestingUser.role !== 'ADMIN' && rental.userId !== requestingUser.id) {
    const error = new Error('Access denied. You cannot view other customers\' rentals.');
    error.statusCode = 403;
    throw error;
  }

  return rental;
}

/**
 * Customer: Request Return for an Active Rental
 */
async function requestCustomerReturn(rentalId, userId) {
  const rental = await getRentalById(rentalId);
  if (rental.userId !== userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  if (!['ACTIVE', 'RESERVED', 'OVERDUE'].includes(rental.rawStatus)) {
    const error = new Error(`Cannot request return for rental in status ${rental.status}`);
    error.statusCode = 400;
    throw error;
  }

  return await db.rental.update({
    where: { id: rentalId },
    data: { status: 'RETURN_PENDING' }
  });
}

/**
 * Admin: Update Rental Reservation Status & Process Return/Deductions
 */
async function updateRentalStatus(rentalId, newStatus, returnDetails = {}) {
  if (!ALLOWED_RENTAL_STATUSES.includes(newStatus)) {
    const error = new Error(`Invalid status "${newStatus}". Allowed: ${ALLOWED_RENTAL_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const existing = await db.rental.findUnique({ where: { id: rentalId } });
  if (!existing) {
    const error = new Error('Rental reservation not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = { status: newStatus };

  // Handle return settlement logic
  if (newStatus === 'RETURNED') {
    const damage = parseFloat(returnDetails.damageAmount) || 0;
    const late = parseFloat(returnDetails.lateFee) || 0;
    const totalDeductions = damage + late;
    const originalDeposit = existing.securityDeposit || 0;
    const refund = Math.max(0, originalDeposit - totalDeductions);

    let depStatus = 'REFUNDED';
    if (totalDeductions >= originalDeposit) {
      depStatus = 'DEDUCTED';
    } else if (totalDeductions > 0) {
      depStatus = 'PARTIALLY_DEDUCTED';
    }

    updateData.damageAmount = damage;
    updateData.lateFee = late;
    updateData.refundAmount = refund;
    updateData.depositStatus = depStatus;
    updateData.returnedAt = new Date().toISOString();
  }

  return await db.rental.update({
    where: { id: rentalId },
    data: updateData
  });
}

/**
 * Admin: Update Product Rental Configuration
 */
async function updateProductRentalSettings(productId, settings) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (settings.isRentable !== undefined) updateData.isRentable = !!settings.isRentable;
  if (settings.rentalBasePrice !== undefined) updateData.rentalBasePrice = parseFloat(settings.rentalBasePrice);
  if (settings.rentalPricePerDay !== undefined) updateData.rentalPricePerDay = parseFloat(settings.rentalPricePerDay);
  if (settings.minimumRentalDays !== undefined) updateData.minimumRentalDays = parseInt(settings.minimumRentalDays, 10);
  if (settings.maximumRentalDays !== undefined) updateData.maximumRentalDays = parseInt(settings.maximumRentalDays, 10);
  if (settings.rentalDeposit !== undefined) updateData.rentalDeposit = parseFloat(settings.rentalDeposit);
  if (settings.rentalAvailableStock !== undefined) updateData.rentalAvailableStock = parseInt(settings.rentalAvailableStock, 10);

  return await db.product.update({
    where: { id: productId },
    data: updateData
  });
}

/**
 * Product / Admin: Month Availability Calendar Matrix
 */
async function getProductRentalCalendar(productId, year, month) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const y = parseInt(year, 10) || new Date().getFullYear();
  const m = parseInt(month, 10) || (new Date().getMonth() + 1);

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const queryText = `
    SELECT start_date, end_date, status 
    FROM rentals 
    WHERE product_id = $1 
      AND status IN ('RESERVED', 'ACTIVE', 'RETURN_PENDING') 
      AND start_date <= $3 
      AND end_date >= $2
  `;

  const res = await db.query(queryText, [productId, startDate, endDate]);
  const stock = product.rentalAvailableStock || 1;

  // Build calendar days array
  const days = [];
  for (let day = 1; day <= lastDay; day++) {
    const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let booked = 0;

    res.rows.forEach(row => {
      const s = row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : String(row.start_date).split('T')[0];
      const e = row.end_date instanceof Date ? row.end_date.toISOString().split('T')[0] : String(row.end_date).split('T')[0];
      if (dayStr >= s && dayStr <= e) {
        booked++;
      }
    });

    days.push({
      date: dayStr,
      day,
      availableStock: stock,
      bookedCount: booked,
      remaining: Math.max(0, stock - booked),
      isAvailable: stock > booked
    });
  }

  return {
    productId: product.id,
    productName: product.name,
    year: y,
    month: m,
    totalStock: stock,
    days
  };
}

module.exports = {
  ALLOWED_RENTAL_STATUSES,
  formatDate,
  calculateRentalEndDate,
  calculateRentalPrice,
  checkProductAvailability,
  getCustomerRentals,
  getAdminRentals,
  getRentalById,
  requestCustomerReturn,
  updateRentalStatus,
  updateProductRentalSettings,
  getProductRentalCalendar
};
