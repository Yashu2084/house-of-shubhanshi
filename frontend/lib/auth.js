// ==============================================================================
// HOUSE OF SHUBHANSHI — AUTH & SESSION UTILITIES (Next.js App Router)
// ==============================================================================
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
const db = require('./db');

const COOKIE_NAME = 'auth_token';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

const CANDIDATE_SECRETS = [
  process.env.JWT_SECRET,
  process.env.AUTH_SECRET,
  'your_jwt_secret_key_here',
  'house_of_shubhanshi_default_secure_secret_2026',
  'house_of_shubhanshi_super_secret_jwt_key_2026_dev'
].filter(Boolean);

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'house_of_shubhanshi_super_secret_jwt_key_2026_dev';

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
  if (!token || typeof token !== 'string') return null;
  for (const secret of CANDIDATE_SECRETS) {
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded && (decoded.id || decoded.email)) return decoded;
    } catch (e) {
      // try next candidate
    }
  }
  return null;
}

export async function getAuthUser(req) {
  let token = null;

  // 1. Next.js App Router cookies()
  try {
    const cookieStore = cookies();
    token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get('token')?.value;
  } catch (e) {}

  // 2. Next.js App Router headers()
  if (!token) {
    try {
      const headersList = headers();
      const authHeader = headersList.get('authorization') || '';
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice(7).trim();
      }
      if (!token) {
        const rawCookie = headersList.get('cookie') || '';
        const match = rawCookie.match(/(?:^|;\s*)(?:auth_token|token)=([^;]+)/);
        if (match) token = decodeURIComponent(match[1].trim());
      }
    } catch (e) {}
  }

  // 2. Next.js Request cookies object
  if (!token && req?.cookies) {
    try {
      if (typeof req.cookies.get === 'function') {
        token = req.cookies.get(COOKIE_NAME)?.value || req.cookies.get('token')?.value;
      } else if (typeof req.cookies === 'object') {
        token = req.cookies[COOKIE_NAME] || req.cookies.token;
      }
    } catch (e) {}
  }

  // 3. Fallback: Parse Cookie header from req
  if (!token && req?.headers) {
    try {
      const cookieHeader = (typeof req.headers.get === 'function' ? req.headers.get('cookie') : req.headers.cookie) || '';
      const match = cookieHeader.match(/(?:^|;\s*)(?:auth_token|token)=([^;]+)/);
      if (match) token = decodeURIComponent(match[1].trim());
    } catch (e) {}
  }

  // 4. Fallback: Authorization Header Bearer token from req
  if (!token && req?.headers) {
    try {
      const authHeader = (typeof req.headers.get === 'function' ? req.headers.get('authorization') : req.headers.authorization) || '';
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice(7).trim();
      }
    } catch (e) {}
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;

  // Immediate zero-latency return from cryptographically verified JWT session
  return {
    id: payload.id,
    name: payload.name || 'User',
    email: payload.email,
    phone: payload.phone || '',
    role: payload.role || 'CUSTOMER',
    dob: null,
    createdAt: null
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
