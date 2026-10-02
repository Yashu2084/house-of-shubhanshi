import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export async function PUT(req, { params }) {
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

    return NextResponse.json({
      success: true,
      message: 'Collection updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[API /api/collections/[id] PUT Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const id = params?.id;
    const removed = await db.collection.delete({ where: { id } });

    if (!removed) {
      return NextResponse.json(
        { success: false, message: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
      data: removed
    });
  } catch (err) {
    console.error('[API /api/collections/[id] DELETE Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
