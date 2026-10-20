import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../../../lib/auth';
const db = require('../../../lib/db');

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const collections = await db.collection.findMany(
      includeInactive ? {} : { where: { isActive: true } }
    );

    return NextResponse.json({
      success: true,
      data: collections
    });
  } catch (err) {
    console.error('[API /api/collections GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve collections: ' + err.message },
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
        { success: false, message: 'Collection name is required' },
        { status: 400 }
      );
    }

    const created = await db.collection.create({ data: body });

    try {
      revalidatePath('/collections');
      revalidatePath('/shop');
      revalidatePath('/');
    } catch (e) {
      // non-blocking
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Collection created successfully',
        data: created
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /api/collections POST Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
}
