import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const [products, collections, users] = await Promise.all([
      db.product.findMany(),
      db.collection.findMany(),
      db.user.findMany()
    ]);

    const customerUsers = users.filter(u => u.role === 'CUSTOMER');
    const totalCustomers = customerUsers.length;
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const activeCollections = collections.filter(c => c.isActive).length;

    // Top viewed products sorted by actual views
    const topViewedProducts = [...products]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 8);

    // Recently added products
    const recentlyAdded = [...products]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalCollections: collections.length,
        activeCollections,
        totalCustomers,
        topViewedProducts,
        recentlyAdded
      }
    });
  } catch (err) {
    console.error('[API /api/admin/overview GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve admin website overview' },
      { status: 500 }
    );
  }
}
