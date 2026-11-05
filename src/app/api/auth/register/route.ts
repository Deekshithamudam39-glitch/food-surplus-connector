import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, AUTH_COOKIE } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { AuthSession } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      name,
      role,
      phone,
      organizationName,
      organizationType,
      documentUrl,
      address,
      city,
      state,
      pincode,
    } = parsed.data;

    // Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Receivers require Admin approval before they can claim donations
    const initialStatus = role === 'RECEIVER' ? 'PENDING' : 'APPROVED';

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role,
        status: initialStatus,
        phone: phone || null,
        organizationName: organizationName || null,
        organizationType: organizationType || null,
        documentUrl: documentUrl || null,
        address: address || null,
        city,
        state,
        pincode,
      },
    });

    const sessionData: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status as any,
      organizationName: user.organizationName,
      organizationType: user.organizationType as any,
    };

    const response = NextResponse.json({
      success: true,
      message:
        role === 'RECEIVER'
          ? 'Registration successful! Your receiver account has been submitted for Admin verification. You will be able to claim donations once approved.'
          : 'Registration successful! Welcome to Food Surplus Connector.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organizationName: user.organizationName,
      },
    });

    // If approved immediately (donor or admin), log in with session cookie
    if (initialStatus === 'APPROVED') {
      const token = signToken(sessionData);
      response.cookies.set(AUTH_COOKIE.name, token, AUTH_COOKIE.options);
    }

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
