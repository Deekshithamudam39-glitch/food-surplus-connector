import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set(AUTH_COOKIE.name, '', {
    ...AUTH_COOKIE.options,
    maxAge: 0,
  });
  return response;
}
