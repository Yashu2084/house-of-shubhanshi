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
  // 1. Extract from Cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map(c => c.trim().split('='))
      .filter(pair => pair.length === 2)
  );

  let token = cookies[COOKIE_NAME];

  // 2. Fallback to Authorization Header
  if (!token) {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;

  const user = await db.user.findUnique({ where: { id: payload.id } });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
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
