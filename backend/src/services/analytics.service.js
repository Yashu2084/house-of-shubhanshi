// ==============================================================================
// HOUSE OF SHUBHANSHI — ANALYTICS SERVICE
// ==============================================================================
const db = require('../config/db');

/**
 * Get Comprehensive Admin Atelier Overview
 */
async function getAdminOverview() {
  const allOrders = await db.order.findMany({
    include: { items: true, user: true }
  });

  const allProducts = await db.product.findMany();
  const allCollections = await db.collection.findMany();
  const allUsers = await db.user.findMany();

  const customerUsers = allUsers.filter(u => u.role === 'CUSTOMER');
  const validOrders = allOrders.filter(o => o.status !== 'CANCELLED');

  const totalSales = validOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalOrders = allOrders.length;
  const totalCustomers = customerUsers.length;
  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter(p => p.isActive).length;
  const activeCollections = allCollections.filter(c => c.isActive).length;
  
  const whatsappEnquiries = allOrders.filter(o => o.status === 'WHATSAPP_ENQUIRY' || o.status === 'PENDING_WHATSAPP_CONFIRMATION').length;
  const pendingOrders = allOrders.filter(o => ['WHATSAPP_ENQUIRY', 'RECEIVED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.status)).length;

  const allRentals = await db.rental.findMany();
  const activeRentals = allRentals.filter(r => r.status === 'ACTIVE' || r.status === 'RESERVED').length;
  const pendingRentals = allRentals.filter(r => ['RESERVED', 'ACTIVE', 'RETURN_PENDING'].includes(r.status)).length;
  const overdueRentals = allRentals.filter(r => r.status === 'OVERDUE').length;
  const heldDeposits = allRentals.filter(r => r.depositStatus === 'HELD').reduce((s, r) => s + (r.securityDeposit || 0), 0);
  const totalRentals = allRentals.length;

  const recentOrders = allOrders.slice(0, 10);

  return {
    totalSales,
    totalOrders,
    totalCustomers,
    totalProducts,
    activeProducts,
    activeCollections,
    pendingOrders,
    pendingRentals,
    whatsappEnquiries,
    totalRentals,
    recentOrders,
    rentals: {
      total: totalRentals,
      active: activeRentals,
      pending: pendingRentals,
      overdue: overdueRentals,
      heldDeposits
    }
  };
}

/**
 * Filtered Sales Analytics for Admin
 * @param {'today' | '7d' | '30d' | 'year' | 'all'} timeRange
 */
async function getSalesAnalytics(timeRange = '30d') {
  const allOrders = await db.order.findMany({
    include: { items: true, user: true }
  });

  const now = new Date();
  let startDate = new Date(0);

  if (timeRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (timeRange === '7d' || timeRange === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === '30d' || timeRange === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeRange === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const filteredOrders = allOrders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= startDate && o.status !== 'CANCELLED';
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const orderCount = filteredOrders.length;
  const averageOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  let productsSold = 0;
  let purchaseRevenue = 0;
  let rentalRevenue = 0;
  let rentalCount = 0;

  filteredOrders.forEach(o => {
    let orderHasRental = false;
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach(it => {
        productsSold += it.quantity || 1;
        if (it.purchaseType === 'RENT') {
          orderHasRental = true;
          rentalRevenue += ((parseFloat(it.price) || 0) * (it.quantity || 1));
        } else {
          purchaseRevenue += ((parseFloat(it.price) || 0) * (it.quantity || 1));
        }
      });
    }
    if (orderHasRental) rentalCount += 1;
  });

  // Group by timeline for sales over time chart
  const timelineMap = {};
  filteredOrders.forEach(o => {
    const d = new Date(o.createdAt);
    const label = timeRange === 'today'
      ? `${d.getHours()}:00`
      : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    if (!timelineMap[label]) {
      timelineMap[label] = { label, sales: 0, orders: 0 };
    }
    timelineMap[label].sales += o.totalAmount || 0;
    timelineMap[label].orders += 1;
  });

  const chartData = Object.values(timelineMap);

  return {
    timeRange,
    totalRevenue,
    purchaseRevenue,
    rentalRevenue,
    orderCount,
    rentalCount,
    averageOrderValue,
    productsSold,
    chartData
  };
}

/**
 * Customer Specific Analytics (Spending & Order Status Breakdown)
 */
async function getCustomerAnalytics(userId) {
  const customerOrders = await db.order.findMany({
    where: { userId },
    include: { items: true }
  });

  const validOrders = customerOrders.filter(o => o.status !== 'CANCELLED');
  const totalSpent = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrders = customerOrders.length;
  const activeOrders = customerOrders.filter(o => ['RECEIVED', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const completedOrders = customerOrders.filter(o => o.status === 'DELIVERED').length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

  // Monthly breakdown
  const monthlyMap = {};
  validOrders.forEach(o => {
    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    monthlyMap[key] = (monthlyMap[key] || 0) + o.totalAmount;
  });

  const spendingHistory = Object.entries(monthlyMap).map(([month, amount]) => ({
    month,
    amount
  }));

  const customerRentals = await db.rental.findMany({ where: { userId } });
  const activeRentalsCount = customerRentals.filter(r => ['RESERVED', 'ACTIVE', 'RETURN_PENDING'].includes(r.status)).length;
  const returnedRentalsCount = customerRentals.filter(r => r.status === 'RETURNED').length;

  return {
    totalSpent,
    totalOrders,
    activeOrders,
    completedOrders,
    averageOrderValue,
    spendingHistory,
    recentOrders: customerOrders.slice(0, 5),
    rentals: {
      total: customerRentals.length,
      active: activeRentalsCount,
      returned: returnedRentalsCount
    }
  };
}

module.exports = {
  getAdminOverview,
  getSalesAnalytics,
  getCustomerAnalytics
};
