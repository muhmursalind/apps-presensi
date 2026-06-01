import { NextResponse } from 'next/server';
import { getSession, USER_COOKIE, type UserPayload } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { caraddeCall } from '@/lib/caradde/client';
import type { CaraddeLocationsData } from '@/lib/caradde/types';

export async function GET() {
  const s = await getSession<UserPayload>(USER_COOKIE);
  if (!s) return NextResponse.json({ meta: { code: 401, status: 'failed', message: 'Unauthorized' }, data: {} }, { status: 401 });
  await connectDB();
  const employee = await Employee.findById(s.employeeId);
  if (!employee) return NextResponse.json({ meta: { code: 404, status: 'failed', message: 'Pegawai tidak ditemukan' }, data: {} }, { status: 404 });
  const result = await caraddeCall<CaraddeLocationsData>(employee, 'GET', '/presensi');
  // Update employee's instansi/latitude/longitude from primary location
  if (result.json?.meta?.code === 200) {
    const d = result.json.data as CaraddeLocationsData | undefined;
    const primary = d?.locations?.[0];
    if (primary) {
      employee.instansi = primary.agency_name;
      employee.latitude = primary.latitude;
      employee.longitude = primary.longitude;
      await employee.save();
    }
  }
  return NextResponse.json(result.json, { status: result.status });
}
