import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createDonationSchema } from '@/lib/validation';
import { expireOverdueClaims } from '@/lib/claim-expiry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Lazily evaluate claim expirations whenever donations are queried
    await expireOverdueClaims().catch((err) => console.error('Auto-expiry error in GET donations:', err));

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'AVAILABLE';
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const donorOnly = searchParams.get('donorOnly') === 'true';

    const session = getSessionFromRequest(req);

    const where: any = {};

    if (donorOnly && session) {
      where.donorId = session.userId;
    } else {
      if (status !== 'ALL') {
        where.status = status;
      }
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (city) {
      where.city = { contains: city };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { area: { contains: search } },
      ];
    }

    const donations = await prisma.donation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            organizationName: true,
            organizationType: true,
            phone: true,
            city: true,
          },
        },
        claims: {
          where: {
            status: { in: ['PENDING_PICKUP', 'COMPLETED'] },
          },
          select: {
            id: true,
            receiverId: true,
            status: true,
            expiresAt: true,
            pickupOtp: true,
            receiver: {
              select: {
                id: true,
                name: true,
                organizationName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Apply strict address privacy masking:
    // Exact address is ONLY visible if:
    // 1. User is ADMIN
    // 2. User is the DONOR who created it
    // 3. User is an approved RECEIVER with an active or completed claim
    const sanitizedDonations = donations.map((donation) => {
      const activeClaim = donation.claims.find((c) => c.status === 'PENDING_PICKUP');
      const completedClaim = donation.claims.find((c) => c.status === 'COMPLETED');
      const claimantId = activeClaim?.receiverId || completedClaim?.receiverId;

      const isAuthorized =
        session &&
        (session.role === 'ADMIN' ||
          session.userId === donation.donorId ||
          (session.role === 'RECEIVER' && session.userId === claimantId));

      return {
        id: donation.id,
        donorId: donation.donorId,
        donor: {
          id: donation.donor.id,
          name: donation.donor.name,
          organizationName: donation.donor.organizationName,
          organizationType: donation.donor.organizationType,
          phone: isAuthorized ? donation.donor.phone : null,
          city: donation.donor.city,
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
        // Exact address privacy protection:
        address: isAuthorized ? donation.address : null,
        isAddressMasked: !isAuthorized,
        // Active claim details if authorized
        activeClaim: activeClaim
          ? {
              id: activeClaim.id,
              status: activeClaim.status,
              expiresAt: activeClaim.expiresAt,
              receiverId: activeClaim.receiverId,
              receiverName: activeClaim.receiver.name,
              receiverOrg: activeClaim.receiver.organizationName,
              receiverPhone: isAuthorized ? activeClaim.receiver.phone : null,
              // Handover OTP is visible to the Donor who needs to provide it, and Admin
              pickupOtp:
                session && (session.role === 'ADMIN' || session.userId === donation.donorId)
                  ? activeClaim.pickupOtp
                  : undefined,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: sanitizedDonations.length,
      donations: sanitizedDonations,
    });
  } catch (error: any) {
    console.error('Error fetching donations:', error);
    return NextResponse.json({ error: 'Failed to retrieve donations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.role !== 'DONOR' && session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only registered donors can post surplus food' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createDonationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      quantity,
      quantityUnit,
      preparationTime,
      pickupDeadline,
      foodCondition,
      address,
      area,
      city,
      state,
      pincode,
      imageUrl,
    } = parsed.data;

    const deadlineDate = new Date(pickupDeadline);
    if (deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: 'Pickup deadline must be a future date and time' },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.create({
      data: {
        donorId: session.userId,
        title,
        description: description || null,
        category,
        quantity,
        quantityUnit: quantityUnit || 'servings',
        preparationTime: preparationTime ? new Date(preparationTime) : null,
        pickupDeadline: deadlineDate,
        foodCondition,
        address,
        area,
        city,
        state,
        pincode,
        imageUrl:
          imageUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Surplus food donation listed successfully',
        donation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create donation error:', error);
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 });
  }
}
