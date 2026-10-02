import { NextResponse } from 'next/server';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const startDate = searchParams.get('startDate');
    const days = parseInt(searchParams.get('days') || '3', 10);

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'productId is required' },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    const stock = product.rentalAvailableStock || 3;
    const allRentals = await db.rental.findMany();
    const activeConflicts = allRentals.filter(r => r.productId === productId && (r.status === 'ACTIVE' || r.status === 'RESERVED'));
    const isAvailable = activeConflicts.length < stock;

    return NextResponse.json({
      success: true,
      data: {
        isAvailable,
        totalStock: stock,
        reservedCount: activeConflicts.length,
        remainingAvailable: Math.max(0, stock - activeConflicts.length)
      }
    });
  } catch (err) {
    console.error('[API /api/rentals/availability GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to check rental availability' },
      { status: 500 }
    );
  }
}
