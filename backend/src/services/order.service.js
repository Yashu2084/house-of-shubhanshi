// ==============================================================================
// HOUSE OF SHUBHANSHI — ORDER SERVICE
// Fully transactional order creation & stock synchronization with PostgreSQL
// ==============================================================================
const db = require('../config/db');
const { calculateRentalEndDate, formatDate } = require('./rental.service');

const ALLOWED_ORDER_STATUSES = [
  'WHATSAPP_ENQUIRY',
  'PENDING_WHATSAPP_CONFIRMATION',
  'CONFIRMED',
  'RECEIVED',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
];

const ALLOWED_PAYMENT_STATUSES = [
  'WHATSAPP_ENQUIRY',
  'PENDING',
  'COD',
  'PAID'
];

/**
 * Generate next Order Number e.g. HS10003
 */
async function generateOrderNumber() {
  const allOrders = await db.order.findMany();
  const baseNum = 10000 + allOrders.length + 1;
  let orderNumber = `HS${baseNum}`;
  let collision = await db.order.findUnique({ where: { orderNumber } });
  while (collision) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    orderNumber = `HS${baseNum}${randomSuffix}`;
    collision = await db.order.findUnique({ where: { orderNumber } });
  }
  return orderNumber;
}

/**
 * Create Order with Safe Database Transaction
 * 1. Validates products & stocks
 * 2. Recalculates total price on the server (never blindly trust frontend)
 * 3. Creates order and order items
 * 4. Decrements product stock in PostgreSQL
 * 5. Rolls back if any failure occurs
 */
async function createOrder(userId, orderData) {
  const { items, shippingAddress, phone, paymentMethod } = orderData;

  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error('Your shopping bag is empty. Please add pieces before ordering.');
    error.statusCode = 400;
    throw error;
  }

  if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length < 5) {
    const error = new Error('A complete delivery address is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    const error = new Error('A valid contact phone number is required.');
    error.statusCode = 400;
    throw error;
  }

  const orderNumber = await generateOrderNumber();

  return await db.transaction(async (tx) => {
    let totalAmount = 0;
    let rentalDepositTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      let product = null;
      const prodId = item.productId || item.id;
      if (prodId) {
        const pRes = await tx.query('SELECT * FROM products WHERE id = $1', [prodId]);
        product = pRes.rows[0];
      } else if (item.slug) {
        const pRes = await tx.query('SELECT * FROM products WHERE slug = $1', [item.slug]);
        product = pRes.rows[0];
      }

      if (!product) {
        const error = new Error(`Product "${item.name || item.productName || prodId}" is not available.`);
        error.statusCode = 400;
        throw error;
      }

      if (!product.is_active) {
        const error = new Error(`Piece "${product.name}" is currently archived from the atelier curation.`);
        error.statusCode = 400;
        throw error;
      }

      const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const isRental = item.purchaseType === 'RENT';

      if (isRental) {
        if (!product.is_rentable) {
          const error = new Error(`Piece "${product.name}" is only available for permanent purchase, not rental.`);
          error.statusCode = 400;
          throw error;
        }

        const rentalDays = Math.max(1, parseInt(item.rentalDays, 10) || 1);
        const minDays = product.minimum_rental_days || 1;
        const maxDays = product.maximum_rental_days || 7;

        if (rentalDays < minDays || rentalDays > maxDays) {
          const error = new Error(`Rental duration for "${product.name}" must be between ${minDays} and ${maxDays} days.`);
          error.statusCode = 400;
          throw error;
        }

        if (!item.rentalStartDate) {
          const error = new Error(`Please specify a rental reservation start date for "${product.name}".`);
          error.statusCode = 400;
          throw error;
        }

        const todayStr = formatDate(new Date());
        const startDateStr = item.rentalStartDate.split('T')[0];
        if (startDateStr < todayStr) {
          const error = new Error(`Rental reservation start date for "${product.name}" cannot be in the past.`);
          error.statusCode = 400;
          throw error;
        }

        const endDateStr = calculateRentalEndDate(startDateStr, rentalDays);

        // Check availability against overlapping reservations in tx
        const rentalStock = product.rental_available_stock !== undefined && product.rental_available_stock !== null
          ? parseInt(product.rental_available_stock, 10)
          : 1;

        const conflictRes = await tx.query(
          `SELECT COUNT(*) as count 
           FROM rentals 
           WHERE product_id = $1 
             AND status IN ('RESERVED', 'ACTIVE', 'RETURN_PENDING') 
             AND start_date <= $3 
             AND end_date >= $2`,
          [product.id, startDateStr, endDateStr]
        );
        const bookedCount = parseInt(conflictRes.rows[0].count, 10);
        const remainingRentalCap = Math.max(0, rentalStock - bookedCount);

        if (remainingRentalCap < requestedQty) {
          const error = new Error(`Atelier piece "${product.name}" is already reserved for the selected dates (${startDateStr} to ${endDateStr}). Available pieces: ${remainingRentalCap}.`);
          error.statusCode = 400;
          throw error;
        }

        // Recalculate price & deposit on backend
        const basePrice = parseFloat(product.rental_base_price) || 0;
        const pricePerDay = parseFloat(product.rental_price_per_day) || 0;
        const itemRentalPrice = (basePrice + (pricePerDay * (rentalDays - 1))) * requestedQty;
        const itemDeposit = (parseFloat(product.rental_deposit) || 0) * requestedQty;

        totalAmount += (itemRentalPrice + itemDeposit);
        rentalDepositTotal += itemDeposit;

        verifiedItems.push({
          productId: product.id,
          productName: `${product.name} (Rental - ${rentalDays} Days)`,
          quantity: requestedQty,
          price: itemRentalPrice,
          purchaseType: 'RENT',
          rentalDays,
          rentalStartDate: startDateStr,
          rentalEndDate: endDateStr,
          rentalPrice: itemRentalPrice,
          securityDeposit: itemDeposit
        });
      } else {
        // Standard Permanent BUY purchase
        const currentStock = parseInt(product.stock, 10);
        if (currentStock < requestedQty) {
          const error = new Error(`Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${requestedQty}`);
          error.statusCode = 400;
          throw error;
        }

        const itemPrice = parseFloat(product.price);
        totalAmount += itemPrice * requestedQty;

        verifiedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: requestedQty,
          price: itemPrice,
          purchaseType: 'BUY',
          rentalDays: null,
          rentalStartDate: null,
          rentalEndDate: null,
          rentalPrice: null,
          securityDeposit: null
        });
      }
    }

    const isWhatsApp = !paymentMethod || paymentMethod === 'WHATSAPP' || paymentMethod === 'WHATSAPP_ENQUIRY';
    const initialStatus = isWhatsApp ? 'WHATSAPP_ENQUIRY' : (orderData.status || 'RECEIVED');
    const paymentStatus = isWhatsApp
      ? 'WHATSAPP_ENQUIRY'
      : (paymentMethod === 'COD' ? 'COD' : (paymentMethod === 'PAID' ? 'PAID' : 'PENDING'));
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    // 1. Insert Order (including rental_deposit_total)
    const orderRes = await tx.query(
      `INSERT INTO orders (id, order_number, user_id, total_amount, rental_deposit_total, status, payment_status, shipping_address, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [orderId, orderNumber, userId, totalAmount, rentalDepositTotal, initialStatus, paymentStatus, shippingAddress.trim(), phone.trim()]
    );

    const createdOrder = orderRes.rows[0];
    const createdItems = [];

    // 2. Insert Order Items, update stock for BUY items, and create rentals for RENT items
    for (const it of verifiedItems) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const itemRes = await tx.query(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name, quantity, price,
          purchase_type, rental_days, rental_start_date, rental_end_date, rental_price, security_deposit,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          itemId,
          orderId,
          it.productId,
          it.productName,
          it.quantity,
          it.price,
          it.purchaseType,
          it.rentalDays,
          it.rentalStartDate,
          it.rentalEndDate,
          it.rentalPrice,
          it.securityDeposit
        ]
      );
      createdItems.push(itemRes.rows[0]);

      if (it.purchaseType === 'RENT') {
        // Create official reservation record in rentals table
        const rentalId = `rnt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await tx.query(
          `INSERT INTO rentals (
            id, order_id, order_item_id, product_id, user_id,
            start_date, end_date, rental_days, rental_price, security_deposit,
            status, deposit_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'RESERVED', 'HELD', NOW(), NOW())`,
          [
            rentalId,
            orderId,
            itemId,
            it.productId,
            userId,
            it.rentalStartDate,
            it.rentalEndDate,
            it.rentalDays,
            it.rentalPrice,
            it.securityDeposit
          ]
        );
      } else {
        // Decrement stock in PostgreSQL for bought items
        await tx.query(
          `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
          [it.quantity, it.productId]
        );
      }
    }

    return {
      id: createdOrder.id,
      orderNumber: createdOrder.order_number,
      userId: createdOrder.user_id,
      totalAmount: parseFloat(createdOrder.total_amount),
      rentalDepositTotal: parseFloat(createdOrder.rental_deposit_total || 0),
      status: createdOrder.status,
      paymentStatus: createdOrder.payment_status,
      shippingAddress: createdOrder.shipping_address,
      phone: createdOrder.phone,
      createdAt: new Date(createdOrder.created_at).toISOString(),
      updatedAt: new Date(createdOrder.updated_at).toISOString(),
      items: createdItems.map(i => ({
        id: i.id,
        orderId: i.order_id,
        productId: i.product_id,
        productName: i.product_name,
        quantity: parseInt(i.quantity, 10),
        price: parseFloat(i.price),
        purchaseType: i.purchase_type,
        rentalDays: i.rental_days,
        rentalStartDate: i.rental_start_date,
        rentalEndDate: i.rental_end_date,
        rentalPrice: i.rental_price ? parseFloat(i.rental_price) : null,
        securityDeposit: i.security_deposit ? parseFloat(i.security_deposit) : null,
        createdAt: new Date(i.created_at).toISOString()
      }))
    };
  });
}

/**
 * Customer: Get customer's orders
 */
async function getCustomerOrders(userId) {
  return await db.order.findMany({
    where: { userId },
    include: {
      items: true
    }
  });
}

/**
 * Customer / Admin: Get single order by ID or orderNumber
 */
async function getOrderDetails(identifier, requestingUser) {
  let order = null;
  if (identifier.startsWith('HS')) {
    order = await db.order.findUnique({
      where: { orderNumber: identifier },
      include: { items: true, user: true }
    });
  } else {
    order = await db.order.findUnique({
      where: { id: identifier },
      include: { items: true, user: true }
    });
  }

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: Customer can only view their own order
  if (requestingUser.role !== 'ADMIN' && order.userId !== requestingUser.id) {
    const error = new Error('Access denied. You cannot view other customers\' orders.');
    error.statusCode = 403;
    throw error;
  }

  return order;
}

/**
 * Admin: Get all orders across the atelier
 */
async function getAllOrders(filters = {}) {
  const where = {};
  if (filters.status && ALLOWED_ORDER_STATUSES.includes(filters.status)) {
    where.status = filters.status;
  }

  return await db.order.findMany({
    where,
    include: {
      items: true,
      user: true
    }
  });
}

/**
 * Admin: Update Order Status
 */
async function updateOrderStatus(orderId, newStatus) {
  if (!ALLOWED_ORDER_STATUSES.includes(newStatus)) {
    const error = new Error(`Invalid status "${newStatus}". Allowed statuses: ${ALLOWED_ORDER_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const existing = await db.order.findUnique({ where: { id: orderId } });
  if (!existing) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return await db.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: { items: true, user: true }
  });
}

/**
 * Admin: Update Payment Status
 */
async function updatePaymentStatus(orderId, paymentStatus) {
  if (!ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
    const error = new Error(`Invalid payment status. Allowed: ${ALLOWED_PAYMENT_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  return await db.order.update({
    where: { id: orderId },
    data: { paymentStatus },
    include: { items: true, user: true }
  });
}

module.exports = {
  ALLOWED_ORDER_STATUSES,
  ALLOWED_PAYMENT_STATUSES,
  createOrder,
  getCustomerOrders,
  getOrderDetails,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus
};
