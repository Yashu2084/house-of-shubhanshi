// ==============================================================================
// HOUSE OF SHUBHANSHI — RENTAL ROUTES
// ==============================================================================
const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rental.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public endpoints
router.get('/calculate-price', rentalController.calculatePrice);
router.get('/price', rentalController.calculatePrice);
router.get('/availability', rentalController.checkAvailability);
router.post('/availability', rentalController.checkAvailability);
router.get('/check-availability', rentalController.checkAvailability);
router.post('/check-availability', rentalController.checkAvailability);
router.get('/calendar/:productId', rentalController.getCalendar);


// Customer endpoints (requireAuth)
router.get('/my-rentals', requireAuth, rentalController.getCustomerRentals);
router.get('/:id', requireAuth, rentalController.getRentalDetails);
router.post('/:id/return-request', requireAuth, rentalController.requestCustomerReturn);

// Admin endpoints (requireAuth + requireAdmin)
router.get('/admin/all', requireAuth, requireAdmin, rentalController.getAdminRentals);
router.patch('/admin/:id/status', requireAuth, requireAdmin, rentalController.updateRentalStatus);
router.patch('/admin/products/:id/settings', requireAuth, requireAdmin, rentalController.updateProductRentalSettings);

module.exports = router;
