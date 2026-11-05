import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { updateReceiverStatusSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const where: any = {};
    if (role && role !== 'ALL') where.role = role;
    if (status && status !== 'ALL') where.status = status;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        organizationName: true,
        organizationType: true,
        documentUrl: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        createdAt: true,
        _count: {
          select: {
            donations: true,
            claims: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateReceiverStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, status } = parsed.data;

    // Prevent admin from accidentally changing their own admin role/status
    if (userId === session.userId && status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot deactivate or change your own admin account status' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        organizationName: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name} status updated to ${status}`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
