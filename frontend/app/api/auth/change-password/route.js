import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export async function POST(req) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Both current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, fullUser.passwordHash || fullUser.password_hash || '');
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (err) {
    console.error('[API /api/auth/change-password Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
