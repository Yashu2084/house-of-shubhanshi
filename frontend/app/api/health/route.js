import { NextResponse } from 'next/server';
const db = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await db.testConnection();
  return NextResponse.json({
    status: result.ok ? 'ok' : 'degraded',
    database: result.type || (result.ok ? 'connected' : 'fallback'),
    error: result.error || null,
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasBackendUrl: !!process.env.BACKEND_URL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      hasJwtSecret: !!process.env.JWT_SECRET
    },
    timestamp: new Date().toISOString()
  });
}
