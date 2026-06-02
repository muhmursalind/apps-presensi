import { getSession, USER_COOKIE, type UserPayload } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { ok, fail } from '@/lib/utils/response';

export async function GET() {
  const s = await getSession<UserPayload>(USER_COOKIE);
  if (!s) return fail('Unauthorized', 401);
  await connectDB();
  const e = await Employee.findById(s.employeeId).lean();
  if (!e) return fail('Pegawai tidak ditemukan', 404);
  return ok({
    id: e._id,
    nomorInduk: e.nomorInduk,
    employeeName: e.employeeName,
    instansi: e.instansi,
    jabatan: e.jabatan,
    email: e.email,
    autoPresensiEnabled: !!e.autoPresensiEnabled,
  });
}
