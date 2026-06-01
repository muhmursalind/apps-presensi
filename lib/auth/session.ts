import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

const secretKey = () => new TextEncoder().encode(process.env.JWT_SECRET as string);

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

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

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
 * This is the RELIABLE approach for Vercel/Edge — using cookies() from next/headers
 * inside route handlers can fail to propagate to the outgoing Set-Cookie header.
 */
export async function setSessionCookie(
  response: NextResponse,
  cookieName: string,
  payload: JWTPayload
) {
  const token = await signJWT(payload);
  response.cookies.set(cookieName, token, COOKIE_OPTIONS);
}

export function clearSessionCookie(response: NextResponse, cookieName: string) {
  response.cookies.set(cookieName, '', { ...COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Read the current session payload from cookies (read-only).
 * Safe to call from Server Components / Route Handlers.
 */
export async function getSession<T extends JWTPayload>(cookieName: string): Promise<T | null> {
  // Next.js 14 cookies() is sync; awaiting a non-promise is a no-op so this works
  // for both 14 and 15 type signatures.
  const c = await cookies();
  const value = c.get(cookieName)?.value;
  if (!value) return null;
  return await verifyJWT<T>(value);
}
