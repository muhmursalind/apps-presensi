import { clearSession, ADMIN_COOKIE } from '@/lib/auth/session';
import { ok } from '@/lib/utils/response';

export async function POST() {
  await clearSession(ADMIN_COOKIE);
  return ok({ message: 'Logout berhasil' });
}
