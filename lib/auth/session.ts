import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

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

export async function setSession(cookieName: string, payload: JWTPayload) {
  const token = await signJWT(payload);
  const c = await cookies();
  c.set(cookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession<T extends JWTPayload>(cookieName: string): Promise<T | null> {
  const c = await cookies();
  const value = c.get(cookieName)?.value;
  if (!value) return null;
  return await verifyJWT<T>(value);
}

export async function clearSession(cookieName: string) {
  const c = await cookies();
  c.set(cookieName, '', { maxAge: 0, path: '/' });
}
