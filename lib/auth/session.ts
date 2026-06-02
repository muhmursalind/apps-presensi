import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

const secretKey = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET environment variable is required');
  return new TextEncoder().encode(s);
};

export const ADMIN_COOKIE = 'caradde_admin';
export const USER_COOKIE = 'caradde_user';

export interface AdminPayload extends JWTPayload {
  role: 'admin';
  username: string;
}
export interface UserPayload extends JWTPayload {
  role: 'user';
  employeeId: string;
  nomorInduk: string;
}

/**
 * Build cookie options with environment-aware `secure` flag.
 * - In production with HTTPS: secure=true (default)
 * - In production with HTTP (e.g. local VPS without SSL): set COOKIE_SECURE=false
 * - In development: always secure=false (browser would reject Secure on http)
 */
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const explicit = process.env.COOKIE_SECURE;
  let secure: boolean;
  if (explicit === 'false') secure = false;
  else if (explicit === 'true') secure = true;
  else secure = isProd;
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function signJWT(payload: JWTPayload, expires = '7d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secretKey());
}

export async function verifyJWT<T extends JWTPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as T;
  } catch {
    return null;
  }
}

/**
 * Attach a signed session cookie to the given NextResponse.
 * RELIABLE on Vercel/Edge/Lambda — cookies().set() from next/headers can fail
 * to propagate Set-Cookie header in some serverless runtimes.
 */
export async function setSessionCookie(
  response: NextResponse,
  cookieName: string,
  payload: JWTPayload
) {
  const token = await signJWT(payload);
  response.cookies.set(cookieName, token, cookieOptions());
}

export function clearSessionCookie(response: NextResponse, cookieName: string) {
  response.cookies.set(cookieName, '', { ...cookieOptions(), maxAge: 0 });
}

/**
 * Read the current session payload from cookies (read-only).
 * Safe to call from Server Components / Route Handlers.
 */
export async function getSession<T extends JWTPayload>(cookieName: string): Promise<T | null> {
  // Next.js 14 cookies() is sync; awaiting a non-promise is a no-op so this also
  // works on Next.js 15 where the API is async.
  const c = await cookies();
  const value = c.get(cookieName)?.value;
  if (!value) return null;
  return await verifyJWT<T>(value);
}
