import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { getSession, ADMIN_COOKIE, type AdminPayload } from '@/lib/auth/session';
import { ok, fail } from '@/lib/utils/response';

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession<AdminPayload>(ADMIN_COOKIE);
  if (!s) return fail('Unauthorized', 401);
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail('Input tidak valid', 400);
    await connectDB();
    const update: Record<string, unknown> = { autoPresensiEnabled: parsed.data.enabled };
    // If disabling, also stop active schedule (but keep history)
    if (!parsed.data.enabled) update['autoPresensiSchedule.active'] = false;
    const result = await Employee.findByIdAndUpdate(id, update, { new: true });
    if (!result) return fail('Pegawai tidak ditemukan', 404);
    return ok({ id: result._id, autoPresensiEnabled: result.autoPresensiEnabled });
  } catch (e) {
    console.error('Toggle auto-presensi error', e);
    return fail('Gagal mengubah status', 500);
  }
}
