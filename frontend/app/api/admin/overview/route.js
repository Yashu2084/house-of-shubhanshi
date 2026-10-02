import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const [orders, products, collections, users, rentals] = await Promise.all([
      db.order.findMany(),
      db.product.findMany(),
      db.collection.findMany(),
      db.user.findMany(),
      db.rental.findMany()
    ]);

    const validOrders = orders.filter(o => o.status !== 'CANCELLED');
    const totalSales = validOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const customerUsers = users.filter(u => u.role === 'CUSTOMER');
    const totalCustomers = customerUsers.length;
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const activeCollections = collections.filter(c => c.isActive).length;

    const whatsappEnquiries = orders.filter(o => o.status === 'WHATSAPP_ENQUIRY' || o.paymentStatus === 'WHATSAPP_ENQUIRY').length;
    const pendingOrders = orders.filter(o => ['WHATSAPP_ENQUIRY', 'RECEIVED', 'CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(o.status)).length;

    const totalRentals = rentals.length;
    const activeRentals = rentals.filter(r => r.status === 'ACTIVE' || r.status === 'RESERVED').length;
    const pendingRentals = rentals.filter(r => ['RESERVED', 'ACTIVE', 'RETURN_PENDING'].includes(r.status)).length;
    const heldDeposits = rentals.filter(r => r.depositStatus === 'HELD').reduce((s, r) => s + (r.securityDeposit || 0), 0);

    const recentOrders = orders.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
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
          heldDeposits
        }
      }
    });
  } catch (err) {
    console.error('[API /api/admin/overview GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve admin overview' },
      { status: 500 }
    );
  }
}
