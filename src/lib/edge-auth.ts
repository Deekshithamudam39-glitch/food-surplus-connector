import { AuthSession } from './types';

const TOKEN_COOKIE_NAME = 'food_surplus_token';

/**
 * Edge-compatible JWT parser for Next.js Middleware
 * Decodes the base64url payload without relying on Node.js native crypto or process.version
 */
export function getSessionFromEdgeCookie(cookieHeader: string | null): AuthSession | null {
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${TOKEN_COOKIE_NAME}=`));

  if (!match) return null;
  const token = match.split('=')[1];
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode base64url payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const session = JSON.parse(jsonPayload) as AuthSession;

    // Check basic expiration if exp is present in payload
    if ((session as any).exp && (session as any).exp * 1000 < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
