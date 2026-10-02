import { NextResponse } from 'next/server';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
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

    const basePrice = product.rentalBasePrice || 1199;
    const minDays = product.minimumRentalDays || 2;
    const pricePerDay = product.rentalPricePerDay || 350;
    const extraDays = Math.max(0, days - minDays);
    const rentalPrice = basePrice + (extraDays * pricePerDay);
    const securityDeposit = product.rentalDeposit || 2500;

    return NextResponse.json({
      success: true,
      data: {
        productId,
        days,
        basePrice,
        pricePerDay,
        rentalPrice,
        securityDeposit,
        totalWithDeposit: rentalPrice + securityDeposit
      }
    });
  } catch (err) {
    console.error('[API /api/rentals/price GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to calculate rental price' },
      { status: 500 }
    );
  }
}
