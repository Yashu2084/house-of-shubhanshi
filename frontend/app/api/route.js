import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'House of Shubhanshi Unified API Gateway',
    timestamp: new Date().toISOString()
  });
}
