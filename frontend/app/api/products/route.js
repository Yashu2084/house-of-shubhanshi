import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../lib/auth';
const db = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const products = await db.product.findMany(
      includeInactive ? {} : { where: { isActive: true } }
    );

    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (err) {
    console.error('[API /api/products GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve products' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    if (!body.name || !body.price) {
      return NextResponse.json(
        { success: false, message: 'Product name and price are required' },
        { status: 400 }
      );
    }

    const created = await db.product.create({ data: body });
    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: created
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /api/products POST Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}
