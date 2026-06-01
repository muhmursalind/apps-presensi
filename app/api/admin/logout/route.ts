import { NextResponse } from 'next/server';
import { clearSessionCookie, ADMIN_COOKIE } from '@/lib/auth/session';

export async function POST() {
  const res = NextResponse.json({ success: true, data: { message: 'Logout berhasil' } });
  clearSessionCookie(res, ADMIN_COOKIE);
  return res;
}
