import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../lib/auth';
const db = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const rentals = user.role === 'ADMIN'
      ? await db.rental.findMany()
      : await db.rental.findMany({ where: { userId: user.id } });

    return NextResponse.json({
      success: true,
      data: rentals
    });
  } catch (err) {
    console.error('[API /api/rentals GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve rentals' },
      { status: 500 }
    );
  }
}
