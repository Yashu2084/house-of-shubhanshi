// ==============================================================================
// HOUSE OF SHUBHANSHI — ORDER ROUTES (Customer)
// ==============================================================================
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.post('/', orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/analytics', orderController.getMyAnalytics);
router.get('/:id', orderController.getOrderDetails);

module.exports = router;
