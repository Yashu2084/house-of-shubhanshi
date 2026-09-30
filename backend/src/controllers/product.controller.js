// ==============================================================================
// HOUSE OF SHUBHANSHI — PRODUCT CONTROLLER
// ==============================================================================
const productService = require('../services/product.service');
const { sendSuccess } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const products = await productService.getAllProducts(req.query);
    return sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    let product = null;
    try {
      product = await productService.getProductById(id);
    } catch (e) {
      // If not found by ID, attempt lookup by slug
    }
    if (!product) {
      product = await productService.getProductBySlug(id);
    }
    return sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, product, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const soft = req.query.permanent !== 'true';
    const result = await productService.deleteProduct(req.params.id, soft);
    return sendSuccess(res, result, soft ? 'Product deactivated' : 'Product permanently deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove
};
