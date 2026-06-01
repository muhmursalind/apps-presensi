import { clearSession, USER_COOKIE } from '@/lib/auth/session';
import { ok } from '@/lib/utils/response';

export async function POST() {
  await clearSession(USER_COOKIE);
  return ok({ message: 'Logout berhasil' });
}
