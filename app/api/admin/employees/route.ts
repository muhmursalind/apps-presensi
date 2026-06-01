import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { encrypt } from '@/lib/auth/crypto';
import { getSession, ADMIN_COOKIE, type AdminPayload } from '@/lib/auth/session';
import { ok, fail } from '@/lib/utils/response';

async function requireAdmin() {
  const s = await getSession<AdminPayload>(ADMIN_COOKIE);
  if (!s) return null;
  return s;
}

const createSchema = z.object({
  nomorInduk: z.string().min(3, 'NIP/NUPTK minimal 3 karakter').trim(),
  password: z.string().min(1, 'Password wajib diisi'),
  deviceId: z.string().min(1, 'Device ID wajib diisi').trim(),
});

export async function GET() {
  if (!(await requireAdmin())) return fail('Unauthorized', 401);
  await connectDB();
  const list = await Employee.find({}).sort({ createdAt: -1 }).lean();
  const safe = list.map((e) => ({
    id: e._id,
    nomorInduk: e.nomorInduk,
    deviceId: e.deviceId,
    employeeName: e.employeeName,
    instansi: e.instansi,
    latitude: e.latitude,
    longitude: e.longitude,
    jabatan: e.jabatan,
    email: e.email,
    caraddeUserId: e.caraddeUserId,
    hasAuthorization: !!e.authorization,
    lastLogin: e.lastLogin,
    createdAt: e.createdAt,
  }));
  return ok(safe);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return fail('Unauthorized', 401);
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Input tidak valid', 400);
    await connectDB();
    const exists = await Employee.findOne({ nomorInduk: parsed.data.nomorInduk });
    if (exists) return fail('NIP/NUPTK sudah terdaftar', 409);
    const created = await Employee.create({
      nomorInduk: parsed.data.nomorInduk,
      passwordEnc: encrypt(parsed.data.password),
      deviceId: parsed.data.deviceId,
    });
    return ok({ id: created._id, nomorInduk: created.nomorInduk }, 201);
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err?.code === 11000) return fail('NIP/NUPTK sudah terdaftar', 409);
    console.error('Create employee error', e);
    return fail('Gagal menambahkan pegawai', 500);
  }
}
