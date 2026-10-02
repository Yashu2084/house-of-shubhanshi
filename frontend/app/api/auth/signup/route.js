import { NextResponse } from 'next/server';
import { createAuthResponse } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: cleanEmail } });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const created = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone ? phone.trim() : null,
        role: 'CUSTOMER'
      }
    });

    const safeUser = {
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      role: created.role
    };

    return createAuthResponse(
      {
        success: true,
        message: 'Account created successfully',
        data: { user: safeUser }
      },
      safeUser,
      201
    );
  } catch (err) {
    console.error('[API Signup Error]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
