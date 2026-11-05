import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
            organizationName: true,
            phone: true,
          },
        },
        claims: {
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
                organizationName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, donations });
  } catch (error: any) {
    console.error('Admin donations error:', error);
    return NextResponse.json({ error: 'Failed to fetch donations for admin' }, { status: 500 });
  }
}
