import { NextResponse } from 'next/server';
import { getAuthUser, verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      let debugToken = null;
      try {
        if (req?.cookies && typeof req.cookies.get === 'function') {
          debugToken = req.cookies.get('auth_token')?.value;
        }
      } catch (e) {}

      const cookieHeader = (typeof req.headers.get === 'function' ? req.headers.get('cookie') : req.headers?.cookie) || '';
      const authHeader = (typeof req.headers.get === 'function' ? req.headers.get('authorization') : req.headers?.authorization) || '';

      const tokenSnippet = debugToken || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
      const verifiedPayload = tokenSnippet ? verifyToken(tokenSnippet) : null;

      return NextResponse.json(
        {
          success: false,
          message: 'Not authenticated',
          diagnostics: {
            hasCookieHeader: !!cookieHeader,
            hasAuthHeader: !!authHeader,
            hasReqCookiesToken: !!debugToken,
            tokenSnippet: tokenSnippet ? tokenSnippet.slice(0, 15) + '...' : null,
            payloadVerified: !!verifiedPayload
          }
        },
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
      { success: false, message: 'Internal server error: ' + err.message },
      { status: 500 }
    );
  }
}
