import { getSession, ADMIN_COOKIE, type AdminPayload } from '@/lib/auth/session';
import { ok, fail } from '@/lib/utils/response';

export async function GET() {
  const s = await getSession<AdminPayload>(ADMIN_COOKIE);
  if (!s) return fail('Unauthorized', 401);
  return ok({ username: s.username, role: s.role });
}
