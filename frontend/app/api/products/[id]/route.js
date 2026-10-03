import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

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

    return NextResponse.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('[API /api/products/[id] GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve product' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
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
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[API /api/products/[id] PUT Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const id = params?.id;
    const removed = await db.product.delete({ where: { id } });

    if (!removed) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      data: removed
    });
  } catch (err) {
    console.error('[API /api/products/[id] DELETE Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
