// ==============================================================================
// HOUSE OF SHUBHANSHI — AUTH & SESSION UTILITIES (Next.js App Router)
// ==============================================================================
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'house_of_shubhanshi_super_secret_jwt_key_2026_dev';
const COOKIE_NAME = 'auth_token';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function getAuthUser(req) {
  let token = null;

  // 1. Next.js Request cookies object
  if (req?.cookies && typeof req.cookies.get === 'function') {
    token = req.cookies.get(COOKIE_NAME)?.value;
  }

  // 2. Fallback: Parse Cookie header safely
  if (!token && req?.headers) {
    const cookieHeader = req.headers.get('cookie') || '';
    const parts = cookieHeader.split(';');
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx > -1) {
        const key = part.slice(0, idx).trim();
        if (key === COOKIE_NAME) {
          token = decodeURIComponent(part.slice(idx + 1).trim());
          break;
        }
      }
    }
  }

  // 3. Fallback: Authorization Header Bearer token
  if (!token && req?.headers) {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;

  let user = null;
  try {
    user = await db.user.findUnique({ where: { id: payload.id } });
  } catch (e) {
    console.warn('[getAuthUser DB lookup notice]', e.message);
  }

  if (user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      dob: user.dob || null,
      createdAt: user.createdAt || user.created_at || null
    };
  }

  // Resilient fallback: If the database is temporarily unreachable, rely on the
  // cryptographically signed JWT payload so authenticated admins/users are not falsely rejected
  if (payload.role) {
    return {
      id: payload.id,
      name: payload.name || 'User',
      email: payload.email,
      phone: payload.phone || '',
      role: payload.role,
      dob: null,
      createdAt: null
    };
  }

  return null;
}

export async function requireAuth(req) {
  const user = await getAuthUser(req);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    };
  }
  return { user, errorResponse: null };
}

export async function requireAdmin(req) {
  const { user, errorResponse } = await requireAuth(req);
  if (errorResponse) return { user: null, errorResponse };

  if (user.role !== 'ADMIN') {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, message: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      )
    };
  }
  return { user, errorResponse: null };
}

export function createAuthResponse(payload, user, status = 200) {
  const token = signToken(user);
  const response = NextResponse.json(payload, { status });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/'
  });

  return response;
}

export function createLogoutResponse() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  return response;
}
