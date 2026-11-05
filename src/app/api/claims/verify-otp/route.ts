import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { verifyOtpSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { claimId, otp } = parsed.data;

    // Fetch claim
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        donation: true,
        receiver: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim record not found' }, { status: 404 });
    }

    // Security check: Only the Donor of the item, the Claiming Receiver, or Admin can confirm pickup
    const isDonor = session.userId === claim.donation.donorId;
    const isReceiver = session.userId === claim.receiverId;
    const isAdmin = session.role === 'ADMIN';

    if (!isDonor && !isReceiver && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to verify pickup for this claim' },
        { status: 403 }
      );
    }

    // Check current status
    if (claim.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'This pickup has already been verified and completed.' },
        { status: 400 }
      );
    }

    if (claim.status !== 'PENDING_PICKUP') {
      return NextResponse.json(
        { error: `Cannot verify pickup for a claim with status: ${claim.status}` },
        { status: 400 }
      );
    }

    // Check expiration
    const now = new Date();
    if (claim.expiresAt < now) {
      // Mark as expired
      await prisma.$transaction([
        prisma.claim.update({
          where: { id: claimId },
          data: { status: 'EXPIRED', cancellationReason: 'Claim expired prior to OTP verification' },
        }),
        prisma.donation.update({
          where: { id: claim.donationId },
          data: {
            status: claim.donation.pickupDeadline > now ? 'AVAILABLE' : 'EXPIRED',
          },
        }),
      ]);

      return NextResponse.json(
        { error: 'This claim has expired because the 30-minute pickup window passed.' },
        { status: 410 }
      );
    }

    // Verify OTP match (trim whitespace)
    if (claim.pickupOtp.trim() !== otp.trim()) {
      return NextResponse.json(
        { error: 'Invalid pickup OTP. Please verify the 6-digit code with the donor/receiver.' },
        { status: 400 }
      );
    }

    // Atomically transition Claim and Donation to COMPLETED
    const result = await prisma.$transaction(async (tx) => {
      const updatedClaim = await tx.claim.update({
        where: { id: claimId },
        data: {
          status: 'COMPLETED',
          pickedUpAt: now,
        },
      });

      const updatedDonation = await tx.donation.update({
        where: { id: claim.donationId },
        data: {
          status: 'COMPLETED',
        },
      });

      return { claim: updatedClaim, donation: updatedDonation };
    });

    return NextResponse.json({
      success: true,
      message: 'Pickup verified successfully! Food handover completed and recorded in meals-saved metrics.',
      claim: result.claim,
      donation: result.donation,
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Failed to verify pickup OTP' }, { status: 500 });
  }
}
