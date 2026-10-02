import { NextResponse } from 'next/server';
const db = require('../../../lib/db');

export async function GET() {
  const isConnected = await db.testConnection();
  return NextResponse.json({
    status: isConnected ? 'ok' : 'degraded',
    database: isConnected ? 'connected' : 'fallback',
    timestamp: new Date().toISOString()
  });
}
