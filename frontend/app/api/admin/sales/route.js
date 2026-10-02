import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all';

    const orders = await db.order.findMany();
    const now = Date.now();

    const filtered = orders.filter(o => {
      if (o.status === 'CANCELLED') return false;
      const orderTime = new Date(o.createdAt).getTime();
      if (range === 'today') {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        return orderTime >= todayStart;
      }
      if (range === '7d') return orderTime >= (now - 7 * 86400000);
      if (range === '30d') return orderTime >= (now - 30 * 86400000);
      if (range === 'year') {
        const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
        return orderTime >= yearStart;
      }
      return true;
    });

    let totalRevenue = 0;
    let purchaseRevenue = 0;
    let rentalRevenue = 0;

    filtered.forEach(o => {
      totalRevenue += (o.totalAmount || 0);
      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          if (it.purchaseType === 'RENT') {
            rentalRevenue += (it.rentalPrice || it.price || 0);
          } else {
            purchaseRevenue += (it.price || 0);
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        range,
        totalRevenue,
        purchaseRevenue,
        rentalRevenue,
        orderCount: filtered.length,
        orders: filtered.slice(0, 25)
      }
    });
  } catch (err) {
    console.error('[API /api/admin/sales GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve sales analytics' },
      { status: 500 }
    );
  }
}
