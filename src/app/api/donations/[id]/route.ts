import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { expireOverdueClaims } from '@/lib/claim-expiry';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await expireOverdueClaims().catch((err) => console.error('Auto-expiry error in GET /donations/[id]:', err));

    const { id } = params;
    const session = getSessionFromRequest(req);

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            organizationName: true,
            organizationType: true,
            phone: true,
            city: true,
            state: true,
          },
        },
        claims: {
          orderBy: { createdAt: 'desc' },
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                organizationName: true,
                phone: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: 'Donation listing not found' }, { status: 404 });
    }

    // Determine active claim and user authorization
    const activeClaim = donation.claims.find((c) => c.status === 'PENDING_PICKUP');
    const completedClaim = donation.claims.find((c) => c.status === 'COMPLETED');
    const claimantId = activeClaim?.receiverId || completedClaim?.receiverId;

    const isAuthorized =
      session &&
      (session.role === 'ADMIN' ||
        session.userId === donation.donorId ||
        (session.role === 'RECEIVER' && session.userId === claimantId));

    const isDonorOwner = session && session.userId === donation.donorId;
    const isAdmin = session && session.role === 'ADMIN';

    const responseData = {
      id: donation.id,
      donorId: donation.donorId,
      donor: {
        id: donation.donor.id,
        name: donation.donor.name,
        organizationName: donation.donor.organizationName,
        organizationType: donation.donor.organizationType,
        phone: isAuthorized ? donation.donor.phone : null,
        city: donation.donor.city,
        state: donation.donor.state,
      },
      title: donation.title,
      description: donation.description,
      category: donation.category,
      quantity: donation.quantity,
      quantityUnit: donation.quantityUnit,
      preparationTime: donation.preparationTime,
      pickupDeadline: donation.pickupDeadline,
      foodCondition: donation.foodCondition,
      area: donation.area,
      city: donation.city,
      state: donation.state,
      pincode: donation.pincode,
      imageUrl: donation.imageUrl,
      status: donation.status,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt,
      // EXACT ADDRESS PRIVACY:
      address: isAuthorized ? donation.address : null,
      isAddressMasked: !isAuthorized,
      activeClaim: activeClaim
        ? {
            id: activeClaim.id,
            status: activeClaim.status,
            expiresAt: activeClaim.expiresAt,
            receiverId: activeClaim.receiverId,
            receiverName: activeClaim.receiver.name,
            receiverOrg: activeClaim.receiver.organizationName,
            receiverPhone: isAuthorized ? activeClaim.receiver.phone : null,
            // Only Donor and Admin can see the OTP to give it to the receiver upon arrival!
            pickupOtp: isDonorOwner || isAdmin ? activeClaim.pickupOtp : undefined,
          }
        : null,
      claimsHistory: isDonorOwner || isAdmin ? donation.claims : undefined,
    };

    return NextResponse.json({ success: true, donation: responseData });
  } catch (error: any) {
    console.error('Error fetching donation:', error);
    return NextResponse.json({ error: 'Failed to fetch donation' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const donation = await prisma.donation.findUnique({ where: { id } });

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    if (session.role !== 'ADMIN' && session.userId !== donation.donorId) {
      return NextResponse.json({ error: 'Unauthorized to cancel this donation' }, { status: 403 });
    }

    if (donation.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a donation that has already been picked up and completed' },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.claim.updateMany({
        where: { donationId: id, status: 'PENDING_PICKUP' },
        data: { status: 'CANCELLED', cancellationReason: 'Donation cancelled by donor' },
      }),
      prisma.donation.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Donation cancelled successfully' });
  } catch (error: any) {
    console.error('Error deleting donation:', error);
    return NextResponse.json({ error: 'Failed to cancel donation' }, { status: 500 });
  }
}
