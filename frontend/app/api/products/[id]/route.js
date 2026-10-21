import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const id = params?.id;
    let product = await db.product.findUnique({ where: { id } });
    if (!product) {
      product = await db.product.findUnique({ where: { slug: id } });
    }

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    try {
      await db.product.incrementViews(product.id);
      product.views = (product.views || 0) + 1;
    } catch (vErr) {
      // non-blocking
    }

    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };

    return NextResponse.json(
      {
        success: true,
        data: product
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/products/[id] GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve product: ' + err.message },
      { status: 500 }
    );
  }
}

async function handleUpdate(req, { params }) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const id = params?.id;
    const body = await req.json();

    const updated = await db.product.update({
      where: { id },
      data: body
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Product not found or update returned no record' },
        { status: 404 }
      );
    }

    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/shop', 'page');
      if (updated.slug) revalidatePath(`/shop/${updated.slug}`, 'page');
      revalidatePath(`/shop/${id}`, 'page');
      revalidatePath('/collections', 'page');
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
        message: 'Product updated successfully',
        data: updated
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/products/[id] PUT/PATCH Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export const PUT = handleUpdate;
export const PATCH = handleUpdate;

export async function DELETE(req, { params }) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required for deletion' },
        { status: 400 }
      );
    }

    const removed = await db.product.delete({ where: { id } });

    if (!removed) {
      return NextResponse.json(
        { success: false, message: 'Product not found or already deleted' },
        { status: 404 }
      );
    }

    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/shop', 'page');
      if (removed.slug) revalidatePath(`/shop/${removed.slug}`, 'page');
      revalidatePath(`/shop/${id}`, 'page');
      revalidatePath('/collections', 'page');
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
        message: 'Product permanently removed from active catalog',
        data: removed
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/products/[id] DELETE Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
