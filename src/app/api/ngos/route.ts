import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Returns approved NGOs (receivers) in the SAME city as the logged-in donor
export async function GET(req: NextRequest) {
  try {
    // 1. Must be logged in
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 });
    }

    // 2. Read the user from the database (do not trust only the cookie)
    const me = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, status: true, city: true },
    });

    if (!me) {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 });
    }

    // 3. Only approved donors can see this list
    if (me.role !== 'DONOR' || me.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Only approved donors can view this' }, { status: 403 });
    }

    if (!me.city) {
      return NextResponse.json({ ngos: [] });
    }

    // 4. Same city, approved receivers only. Send only the fields we need.
    const ngos = await prisma.user.findMany({
      where: { role: 'RECEIVER', status: 'APPROVED', city: me.city },
      select: {
        id: true,
        organizationName: true,
        organizationType: true,
        city: true,
        pincode: true,
        phone: true,
      },
      orderBy: { organizationName: 'asc' },
      take: 50,
    });

    return NextResponse.json({ ngos });
  } catch (error) {
    console.error('NGO list error:', error);
    return NextResponse.json({ error: 'Failed to load NGOs' }, { status: 500 });
  }
}