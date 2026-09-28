// ==============================================================================
// HOUSE OF SHUBHANSHI — ORDER CONTROLLER
// ==============================================================================
const orderService = require('../services/order.service');
const analyticsService = require('../services/analytics.service');
const { sendSuccess } = require('../utils/response');

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    return sendSuccess(res, order, 'Your order has been created successfully. House of Shubhanshi will begin crafting your bespoke pieces.', 201);
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await orderService.getCustomerOrders(req.user.id);
    return sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
}

async function getOrderDetails(req, res, next) {
  try {
    const order = await orderService.getOrderDetails(req.params.id, req.user);
    return sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
}

async function getMyAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getCustomerAnalytics(req.user.id);
    return sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetails,
  getMyAnalytics
};
