import { NextRequest, NextResponse } from 'next/server';
import { getSession, USER_COOKIE, type UserPayload } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { caraddeCall } from '@/lib/caradde/client';

export async function GET(req: NextRequest) {
  const s = await getSession<UserPayload>(USER_COOKIE);
  if (!s) return NextResponse.json({ meta: { code: 401, status: 'failed', message: 'Unauthorized' }, data: {} }, { status: 401 });
  await connectDB();
  const employee = await Employee.findById(s.employeeId);
  if (!employee) return NextResponse.json({ meta: { code: 404, status: 'failed', message: 'Pegawai tidak ditemukan' }, data: {} }, { status: 404 });

  const url = new URL(req.url);
  const page = url.searchParams.get('page') || '1';
  const limit = url.searchParams.get('limit') || '31';
  const filter = url.searchParams.get('filter') || 'Bulan ini';
  const qs = new URLSearchParams({ page, limit, filter }).toString();
  const result = await caraddeCall(employee, 'GET', `/riwayat/presensi?${qs}`);
  return NextResponse.json(result.json, { status: result.status });
}
