import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createClaimSchema } from '@/lib/validation';
import { expireOverdueClaims } from '@/lib/claim-expiry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await expireOverdueClaims().catch((err) => console.error('Auto-expiry error in GET claims:', err));

    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (session.role === 'RECEIVER') {
      where.receiverId = session.userId;
    } else if (session.role === 'DONOR') {
      where.donation = { donorId: session.userId };
    } // Admin gets all claims if requested

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const claims = await prisma.claim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        donation: {
          include: {
            donor: {
              select: {
                id: true,
                name: true,
                organizationName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            organizationName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    const formattedClaims = claims.map((claim) => {
      const isClaimant = session.role === 'RECEIVER' && session.userId === claim.receiverId;
      const isDonor = session.role === 'DONOR' && session.userId === claim.donation.donorId;
      const isAdmin = session.role === 'ADMIN';

      return {
        id: claim.id,
        status: claim.status,
        expiresAt: claim.expiresAt,
        pickedUpAt: claim.pickedUpAt,
        cancellationReason: claim.cancellationReason,
        createdAt: claim.createdAt,
        // Handover OTP:
        // Donor and Admin see the OTP so Donor can tell Receiver in person
        // Receiver also has the OTP entry interface to confirm pickup
        pickupOtp: isDonor || isAdmin ? claim.pickupOtp : undefined,
        donation: {
          id: claim.donation.id,
          title: claim.donation.title,
          category: claim.donation.category,
          quantity: claim.donation.quantity,
          quantityUnit: claim.donation.quantityUnit,
          pickupDeadline: claim.donation.pickupDeadline,
          foodCondition: claim.donation.foodCondition,
          area: claim.donation.area,
          city: claim.donation.city,
          state: claim.donation.state,
          imageUrl: claim.donation.imageUrl,
          status: claim.donation.status,
          // Address is unlocked because this user is the claimant / donor / admin
          address: isClaimant || isDonor || isAdmin ? claim.donation.address : null,
          donor: claim.donation.donor,
        },
        receiver: claim.receiver,
      };
    });

    return NextResponse.json({ success: true, claims: formattedClaims });
  } catch (error: any) {
    console.error('Error fetching claims:', error);
    return NextResponse.json({ error: 'Failed to retrieve claims' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Run auto-expiry first so any stale claims are cleared before new claims are attempted
    await expireOverdueClaims().catch((err) => console.error('Auto-expiry error in POST claim:', err));

    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.role !== 'RECEIVER' && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only verified NGO or Volunteer receivers can claim food donations' },
        { status: 403 }
      );
    }

    // Role check: receiver MUST be APPROVED
    if (session.role === 'RECEIVER') {
      const receiver = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { status: true },
      });

      if (!receiver || receiver.status !== 'APPROVED') {
        return NextResponse.json(
          {
            error:
              'Your receiver account has not been approved by an administrator yet. Only verified receivers can claim donations.',
            code: 'RECEIVER_NOT_APPROVED',
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const parsed = createClaimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { donationId } = parsed.data;

    // CONCURRENCY-SAFE TRANSACTION
    // Using prisma.$transaction to ensure atomic check-and-claim
    // Prevents race conditions where two receivers attempt to claim the exact same donation simultaneously
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current donation with fresh row state
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) {
        throw new Error('NOT_FOUND: Donation does not exist');
      }

      if (donation.status !== 'AVAILABLE') {
        throw new Error(`UNAVAILABLE: Donation is already ${donation.status.toLowerCase()}`);
      }

      const now = new Date();
      if (donation.pickupDeadline <= now) {
        await tx.donation.update({
          where: { id: donationId },
          data: { status: 'EXPIRED' },
        });
        throw new Error('EXPIRED: Donation pickup deadline has passed');
      }

      // 2. Ensure no active claim exists for this donation
      const existingActiveClaim = await tx.claim.findFirst({
        where: {
          donationId,
          status: 'PENDING_PICKUP',
        },
      });

      if (existingActiveClaim) {
        throw new Error('CONFLICT: Another receiver is currently claiming this donation');
      }

      // 3. Mark donation status as CLAIMED
      await tx.donation.update({
        where: { id: donationId },
        data: { status: 'CLAIMED' },
      });

      // 4. Generate 6-digit secure Pickup OTP
      const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // 5. Set 30-minute expiration window
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // 6. Create the Claim record
      const claim = await tx.claim.create({
        data: {
          donationId,
          receiverId: session.userId,
          status: 'PENDING_PICKUP',
          pickupOtp,
          expiresAt,
        },
        include: {
          donation: {
            include: {
              donor: {
                select: {
                  name: true,
                  organizationName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      return claim;
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Donation successfully claimed! Please pick up within 30 minutes. Provide the pickup OTP to the donor upon physical handover.',
        claim: {
          id: result.id,
          donationId: result.donationId,
          status: result.status,
          expiresAt: result.expiresAt,
          donation: {
            id: result.donation.id,
            title: result.donation.title,
            address: result.donation.address, // Unlocked now that claim is created!
            area: result.donation.area,
            city: result.donation.city,
            donor: result.donation.donor,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating claim:', error);

    const errorMessage = error.message || '';
    if (errorMessage.startsWith('NOT_FOUND:')) {
      return NextResponse.json({ error: errorMessage.replace('NOT_FOUND: ', '') }, { status: 404 });
    }
    if (errorMessage.startsWith('UNAVAILABLE:')) {
      return NextResponse.json({ error: errorMessage.replace('UNAVAILABLE: ', '') }, { status: 409 });
    }
    if (errorMessage.startsWith('EXPIRED:')) {
      return NextResponse.json({ error: errorMessage.replace('EXPIRED: ', '') }, { status: 410 });
    }
    if (errorMessage.startsWith('CONFLICT:')) {
      return NextResponse.json(
        { error: 'This donation has already been claimed by another receiver.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to process claim. Please try again.' }, { status: 500 });
  }
}
