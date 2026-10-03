import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export async function PUT(req) {
  try {
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, phone, email, dob } = body;

    const updateData = {};
    if (name && typeof name === 'string') updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (dob !== undefined) updateData.dob = dob ? String(dob).trim() : null;

    if (email && typeof email === 'string' && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = await db.user.findUnique({ where: { email: cleanEmail } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { success: false, message: 'This email address is already registered to another account.' },
          { status: 409 }
        );
      }
      updateData.email = cleanEmail;
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData
    });

    const safeUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      dob: updated.dob,
      createdAt: updated.createdAt || updated.created_at
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: safeUser }
    });
  } catch (err) {
    console.error('[API /api/auth/profile Error]', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;
