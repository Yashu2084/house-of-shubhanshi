import { NextResponse } from 'next/server';
const db = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.testConnection();
  return NextResponse.json({
    status: result.ok ? 'ok' : 'degraded',
    database: result.type || (result.ok ? 'connected' : 'fallback'),
    error: result.error || null,
    timestamp: new Date().toISOString()
  });
}
