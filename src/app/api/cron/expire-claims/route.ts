import { NextRequest, NextResponse } from 'next/server';
import { expireOverdueClaims } from '@/lib/claim-expiry';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleExpiry(req);
}

export async function POST(req: NextRequest) {
  return handleExpiry(req);
}

async function handleExpiry(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const cronSecret = process.env.CRON_SECRET || 'food-surplus-cron-secret-key';

    const isSecretValid =
      authHeader === `Bearer ${cronSecret}` || key === cronSecret;

    const session = getSessionFromRequest(req);
    const isAdmin = session?.role === 'ADMIN';

    // Allow if valid cron secret OR admin session OR in development
    if (!isSecretValid && !isAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const result = await expireOverdueClaims();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('Error during scheduled claim expiry:', error);
    return NextResponse.json({ error: 'Scheduled claim expiry failed' }, { status: 500 });
  }
}
