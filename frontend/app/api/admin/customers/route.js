import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const [users, orders] = await Promise.all([
      db.user.findMany(),
      db.order.findMany()
    ]);

    const customers = users.map(u => {
      const userOrders = orders.filter(o => o.userId === u.id);
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        orderCount: userOrders.length,
        totalSpent,
        createdAt: u.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      data: customers
    });
  } catch (err) {
    console.error('[API /api/admin/customers GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve customers' },
      { status: 500 }
    );
  }
}
