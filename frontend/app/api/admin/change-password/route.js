import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export async function POST(req) {
  try {
    const { user, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Both current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) {
      return NextResponse.json(
        { success: false, message: 'Admin account not found' },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, fullUser.passwordHash || fullUser.password_hash || '');
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Incorrect current password' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    return NextResponse.json({
      success: true,
      message: 'Admin password updated successfully. Please use your new password for future logins.'
    });
  } catch (err) {
    console.error('[API /api/admin/change-password POST Error]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update admin password' },
      { status: 500 }
    );
  }
}
