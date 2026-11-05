import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, AUTH_COOKIE } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { AuthSession } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid credentials format', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Role & Approval verification:
    if (user.status === 'PENDING') {
      return NextResponse.json(
        {
          error:
            'Your account registration is currently pending Admin verification. You will gain access once verified.',
          status: 'PENDING',
        },
        { status: 403 }
      );
    }

    if (user.status === 'REJECTED') {
      return NextResponse.json(
        {
          error: 'Your account application was not approved by the administrator.',
          status: 'REJECTED',
        },
        { status: 403 }
      );
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          error: 'Your account has been suspended. Please contact support.',
          status: 'SUSPENDED',
        },
        { status: 403 }
      );
    }

    const sessionData: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status as any,
      organizationName: user.organizationName,
      organizationType: user.organizationType as any,
    };

    const token = signToken(sessionData);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organizationName: user.organizationName,
      },
    });

    response.cookies.set(AUTH_COOKIE.name, token, AUTH_COOKIE.options);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
