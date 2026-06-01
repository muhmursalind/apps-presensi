import { NextResponse } from 'next/server';
import { clearSessionCookie, USER_COOKIE } from '@/lib/auth/session';

export async function POST() {
  const res = NextResponse.json({ success: true, data: { message: 'Logout berhasil' } });
  clearSessionCookie(res, USER_COOKIE);
  return res;
}
