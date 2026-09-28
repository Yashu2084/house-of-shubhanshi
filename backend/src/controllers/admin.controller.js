// ==============================================================================
// HOUSE OF SHUBHANSHI — ADMIN CONTROLLER
// ==============================================================================
const analyticsService = require('../services/analytics.service');
const orderService = require('../services/order.service');
const db = require('../config/db');
const { sendSuccess } = require('../utils/response');

async function getDashboardOverview(req, res, next) {
  try {
    const overview = await analyticsService.getAdminOverview();
    return sendSuccess(res, overview);
  } catch (err) {
    next(err);
  }
}

async function getSalesAnalytics(req, res, next) {
  try {
    const range = req.query.range || '30d';
    const analytics = await analyticsService.getSalesAnalytics(range);
    return sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
}

async function getAllOrders(req, res, next) {
  try {
    const orders = await orderService.getAllOrders(req.query);
    return sendSuccess(res, orders);
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    return sendSuccess(res, order, `Order status successfully updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const { paymentStatus } = req.body;
    const order = await orderService.updatePaymentStatus(req.params.id, paymentStatus);
    return sendSuccess(res, order, `Payment status updated to ${paymentStatus}`);
  } catch (err) {
    next(err);
  }
}

async function getAllCustomers(req, res, next) {
  try {
    const users = await db.user.findMany({
      where: { role: 'CUSTOMER' }
    });

    const orders = await db.order.findMany();

    // Enrich customers with order count and total spent
    const customers = users.map(u => {
      const customerOrders = orders.filter(o => o.userId === u.id && o.status !== 'CANCELLED');
      const totalSpent = customerOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        totalSpent,
        ordersCount: customerOrders.length,
        createdAt: u.createdAt
      };
    });

    return sendSuccess(res, customers);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardOverview,
  getSalesAnalytics,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getAllCustomers
};
