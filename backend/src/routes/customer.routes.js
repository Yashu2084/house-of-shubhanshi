// ==============================================================================
// HOUSE OF SHUBHANSHI — CUSTOMER DASHBOARD ROUTES
// ==============================================================================
const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');
const orderService = require('../services/order.service');
const rentalController = require('../controllers/rental.controller');
const { requireAuth } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');

// Strict Protection: Patron must be logged in
router.use(requireAuth);

/**
 * GET /api/customer/dashboard
 * Real PostgreSQL customer metrics (total spent, orders count, breakdown)
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const analytics = await analyticsService.getCustomerAnalytics(req.user.id);
    return sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/customer/orders
 * Patron's order history
 */
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await orderService.getCustomerOrders(req.user.id);
    return sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/customer/rentals
 * Patron's dress rental reservations
 */
router.get('/rentals', rentalController.getCustomerRentals);

/**
 * POST /api/customer/rentals/:id/return-request
 * Patron requests pickup/return for an active rental
 */
router.post('/rentals/:id/return-request', rentalController.requestCustomerReturn);

module.exports = router;
