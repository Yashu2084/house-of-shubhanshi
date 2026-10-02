import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const rentals = await db.rental.findMany();
    return NextResponse.json({
      success: true,
      data: rentals
    });
  } catch (err) {
    console.error('[API /api/admin/rentals GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve admin rentals' },
      { status: 500 }
    );
  }
}
