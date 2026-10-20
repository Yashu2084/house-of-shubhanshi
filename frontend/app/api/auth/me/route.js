import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import { cookies, headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const rawReqAuth = req?.headers?.get ? req.headers.get('authorization') : null;
    const rawReqCookie = req?.headers?.get ? req.headers.get('cookie') : null;
    const rawReqCustom = req?.headers?.get ? req.headers.get('x-admin-token') : null;

    let nextCookieVal = null;
    try { nextCookieVal = cookies().get('auth_token')?.value; } catch (e) { nextCookieVal = 'err:' + e.message; }

    let nextHeaderAuth = null;
    try { nextHeaderAuth = headers().get('authorization'); } catch (e) { nextHeaderAuth = 'err:' + e.message; }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Not authenticated',
          debug: {
            hasReq: !!req,
            rawReqAuth: rawReqAuth ? rawReqAuth.slice(0, 15) : null,
            rawReqCookie: rawReqCookie ? rawReqCookie.slice(0, 25) : null,
            rawReqCustom: rawReqCustom ? rawReqCustom.slice(0, 15) : null,
            nextCookieVal: nextCookieVal ? nextCookieVal.slice(0, 15) : null,
            nextHeaderAuth: nextHeaderAuth ? nextHeaderAuth.slice(0, 15) : null
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
