// ==============================================================================
// HOUSE OF SHUBHANSHI — UNIFIED API GATEWAY ROUTE HANDLER (App Router)
// Proxies all /api/* requests server-to-server to Express Backend & PostgreSQL.
// Resolves 404s on deployed hosting (Vercel, Render, VPS) by providing native routing.
// Enforces first-party HTTP-only cookie forwarding for same-origin authentication.
// ==============================================================================
import { NextResponse } from 'next/server';

function getBackendBaseUrl() {
  const url = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    process.env.INTERNAL_API_URL ||
    'http://localhost:3001'
  ).trim().replace(/\/$/, '');
  return url;
}

async function handleProxy(req, { params }) {
  const backendBase = getBackendBaseUrl();
  const pathSegments = params?.path || [];
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  // Extract query string from request URL
  const { search } = new URL(req.url);
  const targetUrl = `${backendBase}/api/${subPath}${search}`;

  // Forward incoming headers (cookie, authorization, content-type)
  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (!['host', 'connection', 'content-length'].includes(k)) {
      forwardHeaders.set(key, value);
    }
  });

  // Attach client forwarding info
  const clientIp = req.headers.get('x-forwarded-for') || req.ip;
  if (clientIp) {
    forwardHeaders.set('x-forwarded-for', clientIp);
  }
  const originalHost = req.headers.get('host');
  if (originalHost) {
    forwardHeaders.set('x-forwarded-host', originalHost);
    forwardHeaders.set('x-forwarded-proto', req.url.startsWith('https') ? 'https' : 'http');
  }

  let body = undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    try {
      body = await req.arrayBuffer();
    } catch (e) {
      body = undefined;
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: 'manual',
      cache: 'no-store'
    });

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (!['transfer-encoding', 'content-encoding', 'content-length'].includes(k)) {
        responseHeaders.append(key, value);
      }
    });

    // Node 18+ support for multiple Set-Cookie headers
    if (typeof backendRes.headers.getSetCookie === 'function') {
      const cookies = backendRes.headers.getSetCookie();
      if (cookies && cookies.length > 0) {
        responseHeaders.delete('set-cookie');
        cookies.forEach((c) => responseHeaders.append('set-cookie', c));
      }
    }

    const data = await backendRes.arrayBuffer();
    return new NextResponse(data, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    console.error(`[API Gateway Error] Could not reach backend server at ${targetUrl}:`, err.message);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to the backend server. Please verify backend status and try again.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        hint: !process.env.BACKEND_URL && process.env.NODE_ENV === 'production'
          ? 'BACKEND_URL environment variable is not set in production deployment settings.'
          : undefined
      },
      { status: 503 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
