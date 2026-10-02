import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAuthResponse } from '../../../../lib/auth';
const db = require('../../../../lib/db');

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || user.password_hash || '');
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    return createAuthResponse(
      {
        success: true,
        message: 'Login successful',
        data: { user: safeUser }
      },
      safeUser
    );
  } catch (err) {
    console.error('[API Login Error]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
