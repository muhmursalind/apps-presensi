import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { encrypt } from '@/lib/auth/crypto';
import { getSession, ADMIN_COOKIE, type AdminPayload } from '@/lib/auth/session';
import { ok, fail } from '@/lib/utils/response';

async function requireAdmin() {
  const s = await getSession<AdminPayload>(ADMIN_COOKIE);
  return !!s;
}

const updateSchema = z.object({
  nomorInduk: z.string().min(3).trim().optional(),
  password: z.string().min(1).optional(),
  deviceId: z.string().min(1).trim().optional(),
  employeeName: z.string().trim().nullable().optional(),
  instansi: z.string().trim().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail('Unauthorized', 401);
  await connectDB();
  const { id } = await ctx.params;
  const e = await Employee.findById(id).lean();
  if (!e) return fail('Pegawai tidak ditemukan', 404);
  return ok({
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
  });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail('Unauthorized', 401);
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Input tidak valid', 400);
    await connectDB();
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.password) {
      update.passwordEnc = encrypt(parsed.data.password);
      delete update.password;
      // Invalidate token because credentials changed
      update.authorization = null;
    }
    const result = await Employee.findByIdAndUpdate(id, update, { new: true });
    if (!result) return fail('Pegawai tidak ditemukan', 404);
    return ok({ id: result._id });
  } catch (e) {
    console.error('Update employee error', e);
    return fail('Gagal memperbarui pegawai', 500);
  }
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail('Unauthorized', 401);
  await connectDB();
  const { id } = await ctx.params;
  const result = await Employee.findByIdAndDelete(id);
  if (!result) return fail('Pegawai tidak ditemukan', 404);
  return ok({ id });
}
