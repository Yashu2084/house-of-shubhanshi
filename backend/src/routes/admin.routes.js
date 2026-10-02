// ==============================================================================
// HOUSE OF SHUBHANSHI — ADMIN ROUTES
// Strictly protected: requireAuth + requireAdmin
// ==============================================================================
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const productController = require('../controllers/product.controller');
const collectionController = require('../controllers/collection.controller');
const rentalController = require('../controllers/rental.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Strict Protection: Must be authenticated AND have ADMIN role
router.use(requireAuth, requireAdmin);

// Dashboard Overview & Sales Analytics
router.get('/overview', adminController.getDashboardOverview);
router.get('/dashboard', adminController.getDashboardOverview);
router.get('/sales', adminController.getSalesAnalytics);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/:id/payment', adminController.updatePaymentStatus);

// Rental Management
router.get('/rentals', rentalController.getAdminRentals);
router.patch('/rentals/:id/status', rentalController.updateRentalStatus);
router.patch('/rentals/products/:id/settings', rentalController.updateProductRentalSettings);

// Customer Management
router.get('/customers', adminController.getAllCustomers);

// Product Management (Admin Shortcuts)
router.get('/products', productController.getAll);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.remove);

// Collection Management (Admin Shortcuts)
router.get('/collections', collectionController.getAll);
router.post('/collections', collectionController.create);
router.put('/collections/:id', collectionController.update);
router.delete('/collections/:id', collectionController.remove);

// Image Upload & Optimization
router.post('/upload', adminController.uploadProductImage);

// Account & Security
router.post('/change-password', adminController.changeAdminPassword);

module.exports = router;
