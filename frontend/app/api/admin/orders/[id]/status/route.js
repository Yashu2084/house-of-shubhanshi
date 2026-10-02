import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/auth';
const db = require('../../../../../../lib/db');

export async function PATCH(req, { params }) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const id = params?.id;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    const updated = await db.order.update({
      where: { id },
      data: { status }
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    console.error('[API /api/admin/orders/[id]/status PATCH Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
