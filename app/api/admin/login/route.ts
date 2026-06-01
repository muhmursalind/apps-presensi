import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminCredentials } from '@/lib/auth/admin';
import { setSessionCookie, ADMIN_COOKIE } from '@/lib/auth/session';

const schema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Input tidak valid' },
        { status: 400 }
      );
    }
    const { username, password } = parsed.data;
    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        { success: false, message: 'Username atau password admin salah' },
        { status: 401 }
      );
    }
    const res = NextResponse.json({
      success: true,
      data: { username, role: 'admin', message: 'Login admin berhasil' },
    });
    await setSessionCookie(res, ADMIN_COOKIE, { role: 'admin', username });
    return res;
  } catch (e) {
    console.error('Admin login error', e);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
