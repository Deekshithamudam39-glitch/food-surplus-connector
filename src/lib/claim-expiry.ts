import { prisma } from './prisma';

export interface ExpiryResult {
  expiredClaimsCount: number;
  returnedToAvailableCount: number;
  markedDonationExpiredCount: number;
  details: Array<{
    claimId: string;
    donationId: string;
    newDonationStatus: string;
    pickupDeadline: Date;
  }>;
}

/**
 * Sweeps for any active claims (PENDING_PICKUP) that have passed their 30-minute expiration time.
 * For each expired claim:
 * 1. Sets claim.status = 'EXPIRED'
 * 2. If donation.pickupDeadline is still in the future:
 *    sets donation.status = 'AVAILABLE' (so other receivers can claim it)
 * 3. If donation.pickupDeadline has passed:
 *    sets donation.status = 'EXPIRED'
 *
 * Runs inside a database transaction to ensure atomicity and consistency.
 */
export async function expireOverdueClaims(): Promise<ExpiryResult> {
  const now = new Date();

  // Find all claims that are pending pickup and whose 30-minute window has elapsed
  const overdueClaims = await prisma.claim.findMany({
    where: {
      status: 'PENDING_PICKUP',
      expiresAt: {
        lt: now,
      },
    },
    include: {
      donation: true,
    },
  });

  const details: ExpiryResult['details'] = [];
  let returnedToAvailableCount = 0;
  let markedDonationExpiredCount = 0;

  for (const claim of overdueClaims) {
    await prisma.$transaction(async (tx) => {
      // 1. Mark claim as EXPIRED
      await tx.claim.update({
        where: { id: claim.id },
        data: {
          status: 'EXPIRED',
          cancellationReason: 'Claim expired automatically after 30 minutes without pickup confirmation',
        },
      });

      // 2. Check if donation's original pickup deadline is still valid
      const isDeadlineValid = claim.donation.pickupDeadline > now;
      const nextDonationStatus = isDeadlineValid ? 'AVAILABLE' : 'EXPIRED';

      await tx.donation.update({
        where: { id: claim.donationId },
        data: {
          status: nextDonationStatus,
        },
      });

      if (isDeadlineValid) {
        returnedToAvailableCount++;
      } else {
        markedDonationExpiredCount++;
      }

      details.push({
        claimId: claim.id,
        donationId: claim.donationId,
        newDonationStatus: nextDonationStatus,
        pickupDeadline: claim.donation.pickupDeadline,
      });
    });
  }

  // Also check donations that are AVAILABLE but have passed their pickup deadline
  await prisma.donation.updateMany({
    where: {
      status: 'AVAILABLE',
      pickupDeadline: {
        lt: now,
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return {
    expiredClaimsCount: overdueClaims.length,
    returnedToAvailableCount,
    markedDonationExpiredCount,
    details,
  };
}
