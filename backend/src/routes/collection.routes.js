// ==============================================================================
// HOUSE OF SHUBHANSHI — COLLECTION ROUTES
// ==============================================================================
const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collection.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', collectionController.getAll);
router.get('/:id', collectionController.getOne);

// Protected Admin Routes
router.post('/', requireAuth, requireAdmin, collectionController.create);
router.put('/:id', requireAuth, requireAdmin, collectionController.update);
router.delete('/:id', requireAuth, requireAdmin, collectionController.remove);

module.exports = router;
