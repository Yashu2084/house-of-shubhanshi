// ==============================================================================
// HOUSE OF SHUBHANSHI — PRODUCT ROUTES
// ==============================================================================
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', productController.getAll);
router.get('/:id', productController.getOne);

// Protected Admin Routes
router.post('/', requireAuth, requireAdmin, productController.create);
router.put('/:id', requireAuth, requireAdmin, productController.update);
router.delete('/:id', requireAuth, requireAdmin, productController.remove);

module.exports = router;
