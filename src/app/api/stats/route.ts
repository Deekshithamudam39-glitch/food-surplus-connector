import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Confirmed Pickups & Meals Saved (STRICT REQUIREMENT: COUNT ONLY CONFIRMED PICKUPS)
    const completedDonations = await prisma.donation.findMany({
      where: {
        status: 'COMPLETED',
        claims: {
          some: {
            status: 'COMPLETED',
          },
        },
      },
      select: {
        id: true,
        title: true,
        quantity: true,
        quantityUnit: true,
        category: true,
        updatedAt: true,
        donor: {
          select: {
            name: true,
            organizationName: true,
            city: true,
          },
        },
        claims: {
          where: { status: 'COMPLETED' },
          select: {
            pickedUpAt: true,
            receiver: {
              select: {
                name: true,
                organizationName: true,
              },
            },
          },
        },
      },
    });

    const totalMealsSaved = completedDonations.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const confirmedPickupsCount = completedDonations.length;

    // 2. Platform participation stats
    const [activeDonationsCount, verifiedReceiversCount, activeDonorsCount, pendingReceiversCount] =
      await Promise.all([
        prisma.donation.count({ where: { status: 'AVAILABLE' } }),
        prisma.user.count({ where: { role: 'RECEIVER', status: 'APPROVED' } }),
        prisma.user.count({ where: { role: 'DONOR', status: 'APPROVED' } }),
        prisma.user.count({ where: { role: 'RECEIVER', status: 'PENDING' } }),
      ]);

    // 3. Category breakdown of rescued food
    const categoryCounts: Record<string, number> = {};
    for (const d of completedDonations) {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + d.quantity;
    }

    // 4. Recent rescue activity
    const recentRescues = completedDonations
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        title: d.title,
        quantity: d.quantity,
        quantityUnit: d.quantityUnit,
        category: d.category,
        donorName: d.donor.organizationName || d.donor.name,
        receiverName: d.claims[0]?.receiver.organizationName || d.claims[0]?.receiver.name || 'Verified NGO',
        pickedUpAt: d.claims[0]?.pickedUpAt || d.updatedAt,
        city: d.donor.city,
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalMealsSaved,
        confirmedPickupsCount,
        activeDonationsCount,
        verifiedReceiversCount,
        activeDonorsCount,
        pendingReceiversCount,
        categoryBreakdown: categoryCounts,
        recentRescues,
      },
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to compute statistics' }, { status: 500 });
  }
}
