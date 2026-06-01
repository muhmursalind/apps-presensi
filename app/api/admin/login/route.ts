import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdminCredentials } from '@/lib/auth/admin';
import { setSession, ADMIN_COOKIE } from '@/lib/auth/session';
import { ok, fail } from '@/lib/utils/response';

const schema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Input tidak valid', 400);
    const { username, password } = parsed.data;
    if (!verifyAdminCredentials(username, password)) {
      return fail('Username atau password admin salah', 401);
    }
    await setSession(ADMIN_COOKIE, { role: 'admin', username });
    return ok({ username, role: 'admin', message: 'Login admin berhasil' });
  } catch (e) {
    console.error('Admin login error', e);
    return fail('Terjadi kesalahan server', 500);
  }
}
