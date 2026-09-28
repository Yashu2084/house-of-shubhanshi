// ==============================================================================
// HOUSE OF SHUBHANSHI — RENTAL CONTROLLER
// Handles availability checks, pricing calculations, reservations & status updates
// ==============================================================================
const rentalService = require('../services/rental.service');
const { sendSuccess } = require('../utils/response');

/**
 * Public: Check product rental availability for requested dates
 * GET /api/rentals/availability?productId=...&startDate=...&days=...&quantity=...
 */
async function checkAvailability(req, res, next) {
  try {
    const { productId, startDate, days, quantity } = req.query;
    if (!productId || !startDate || !days) {
      const error = new Error('productId, startDate and days are required query parameters');
      error.statusCode = 400;
      throw error;
    }

    const result = await rentalService.checkProductAvailability(
      productId,
      startDate,
      parseInt(days, 10),
      parseInt(quantity, 10) || 1
    );

    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * Public: Get monthly availability calendar for product modal / booking
 * GET /api/rentals/calendar/:productId?year=...&month=...
 */
async function getCalendar(req, res, next) {
  try {
    const { productId } = req.params;
    const { year, month } = req.query;
    const calendar = await rentalService.getProductRentalCalendar(productId, year, month);
    return sendSuccess(res, calendar);
  } catch (err) {
    next(err);
  }
}

/**
 * Patron: Get customer's own rentals
 * GET /api/rentals/my-rentals or GET /api/customer/rentals
 */
async function getCustomerRentals(req, res, next) {
  try {
    const rentals = await rentalService.getCustomerRentals(req.user.id, req.query);
    return sendSuccess(res, rentals);
  } catch (err) {
    next(err);
  }
}

/**
 * Patron / Admin: Get single rental reservation details
 * GET /api/rentals/:id
 */
async function getRentalDetails(req, res, next) {
  try {
    const rental = await rentalService.getRentalById(req.params.id, req.user);
    return sendSuccess(res, rental);
  } catch (err) {
    next(err);
  }
}

/**
 * Patron: Request Return for an active rental
 * POST /api/rentals/:id/return-request
 */
async function requestCustomerReturn(req, res, next) {
  try {
    const updated = await rentalService.requestCustomerReturn(req.params.id, req.user.id);
    return sendSuccess(res, updated, 'Return requested successfully. Our courier will contact you.');
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get all rentals across atelier with summary metrics
 * GET /api/admin/rentals
 */
async function getAdminRentals(req, res, next) {
  try {
    const result = await rentalService.getAdminRentals(req.query);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update rental reservation status & process security deposit returns
 * PATCH /api/admin/rentals/:id/status
 */
async function updateRentalStatus(req, res, next) {
  try {
    const { status, damageAmount, lateFee } = req.body;
    if (!status) {
      const error = new Error('Status is required');
      error.statusCode = 400;
      throw error;
    }

    const updated = await rentalService.updateRentalStatus(req.params.id, status, { damageAmount, lateFee });
    return sendSuccess(res, updated, `Rental status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update product rental configuration
 * PATCH /api/admin/rentals/products/:id/settings
 */
async function updateProductRentalSettings(req, res, next) {
  try {
    const updated = await rentalService.updateProductRentalSettings(req.params.id, req.body);
    return sendSuccess(res, updated, 'Product rental settings updated successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkAvailability,
  getCalendar,
  getCustomerRentals,
  getRentalDetails,
  requestCustomerReturn,
  getAdminRentals,
  updateRentalStatus,
  updateProductRentalSettings
};
