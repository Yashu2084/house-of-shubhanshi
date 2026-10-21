import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };

    return NextResponse.json(
      {
        success: true,
        data: products
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/products GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve products: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Product name is required' },
        { status: 400 }
      );
    }
    if (body.price === undefined || body.price === null || isNaN(parseFloat(body.price))) {
      return NextResponse.json(
        { success: false, message: 'A valid product purchase price is required' },
        { status: 400 }
      );
    }

    const created = await db.product.create({ data: body });

    // Invalidate static caches so new garment immediately appears across all pages
    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/shop', 'page');
      revalidatePath('/collections', 'page');
      if (created.slug) revalidatePath(`/shop/${created.slug}`, 'page');
      if (created.id) revalidatePath(`/shop/${created.id}`, 'page');
    } catch (e) {
      // non-blocking
    }

    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: created
      },
      { status: 201, headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/products POST Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
