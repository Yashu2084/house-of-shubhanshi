import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const id = params?.id;
    let collection = await db.collection.findUnique({ where: { id } });
    if (!collection) {
      collection = await db.collection.findUnique({ where: { slug: id } });
    }

    if (!collection) {
      return NextResponse.json(
        { success: false, message: 'Collection not found' },
        { status: 404 }
      );
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
        data: collection
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/collections/[id] GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve collection: ' + err.message },
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

    const updated = await db.collection.update({
      where: { id },
      data: body
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Collection not found' },
        { status: 404 }
      );
    }

    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/collections', 'page');
      revalidatePath('/shop', 'page');
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
        message: 'Collection updated successfully',
        data: updated
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/collections/[id] PUT/PATCH Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update collection' },
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
        { success: false, message: 'Collection ID is required for deletion' },
        { status: 400 }
      );
    }

    const removed = await db.collection.delete({ where: { id } });

    if (!removed) {
      return NextResponse.json(
        { success: false, message: 'Collection not found or already deleted' },
        { status: 404 }
      );
    }

    try {
      revalidatePath('/', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/collections', 'page');
      revalidatePath('/shop', 'page');
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
        message: 'Collection deleted successfully',
        data: removed
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    console.error('[API /api/collections/[id] DELETE Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
