import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const id = params?.id;
    const order = await db.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN' && order.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('[API /api/orders/[id] GET Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}
