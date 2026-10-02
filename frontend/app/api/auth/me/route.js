import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    console.error('[API /api/auth/me Error]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
