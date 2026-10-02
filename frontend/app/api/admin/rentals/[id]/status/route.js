import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/auth';
const db = require('../../../../../../lib/db');

export async function PATCH(req, { params }) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const id = params?.id;
    const body = await req.json();
    const { status, depositStatus } = body;

    const updateData = {};
    if (status) updateData.status = status;
    if (depositStatus) updateData.depositStatus = depositStatus;

    const updated = await db.rental.update({
      where: { id },
      data: updateData
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Rental not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rental status updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[API /api/admin/rentals/[id]/status PATCH Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update rental status' },
      { status: 500 }
    );
  }
}
