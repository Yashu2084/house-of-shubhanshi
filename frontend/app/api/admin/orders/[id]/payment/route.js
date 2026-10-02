import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/auth';
const db = require('../../../../../../lib/db');

export async function PATCH(req, { params }) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const id = params?.id;
    const body = await req.json();
    const { paymentStatus } = body;

    if (!paymentStatus) {
      return NextResponse.json(
        { success: false, message: 'paymentStatus is required' },
        { status: 400 }
      );
    }

    const updated = await db.order.update({
      where: { id },
      data: { paymentStatus }
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: updated
    });
  } catch (err) {
    console.error('[API /api/admin/orders/[id]/payment PATCH Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
