import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const orders = await db.order.findMany();
    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (err) {
    console.error('[API /api/admin/orders GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve admin orders' },
      { status: 500 }
    );
  }
}
