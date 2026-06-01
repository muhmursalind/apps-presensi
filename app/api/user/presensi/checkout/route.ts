import { NextRequest, NextResponse } from 'next/server';
import { getSession, USER_COOKIE, type UserPayload } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { caraddeCall, loginCaradde } from '@/lib/caradde/client';
import { decrypt } from '@/lib/auth/crypto';
import type { CaraddeLocationsData, CaraddeLoginData } from '@/lib/caradde/types';

export async function POST(req: NextRequest) {
  const s = await getSession<UserPayload>(USER_COOKIE);
  if (!s) return NextResponse.json({ meta: { code: 401, status: 'failed', message: 'Unauthorized' }, data: {} }, { status: 401 });
  await connectDB();
  const employee = await Employee.findById(s.employeeId);
  if (!employee) return NextResponse.json({ meta: { code: 404, status: 'failed', message: 'Pegawai tidak ditemukan' }, data: {} }, { status: 404 });

  // Ensure latest location
  const locRes = await caraddeCall<CaraddeLocationsData>(employee, 'GET', '/presensi');
  if (locRes.json?.meta?.code === 200) {
    const primary = (locRes.json.data as CaraddeLocationsData | undefined)?.locations?.[0];
    if (primary) {
      employee.instansi = primary.agency_name;
      employee.latitude = primary.latitude;
      employee.longitude = primary.longitude;
      await employee.save();
    }
  }

  const incoming = await req.formData();
  const foto = incoming.get('foto');
  if (!foto || !(foto instanceof File)) {
    return NextResponse.json({ meta: { code: 400, status: 'failed', message: 'Foto wajib disertakan' }, data: {} }, { status: 400 });
  }
  const fd = new FormData();
  fd.append('latitude', String(incoming.get('latitude') ?? employee.latitude ?? ''));
  fd.append('longitude', String(incoming.get('longitude') ?? employee.longitude ?? ''));
  fd.append('lokasi', String(incoming.get('lokasi') ?? employee.instansi ?? ''));
  fd.append('foto', foto, foto.name || 'foto.jpg');

  let result = await caraddeCall(employee, 'POST', '/presensi/checkout', fd);
  if (result.status === 401 || result.json?.meta?.code === 401) {
    const pwd = decrypt(employee.passwordEnc);
    const re = await loginCaradde(employee.nomorInduk, pwd, employee.deviceId);
    if (re.json?.meta?.code === 200 && re.json.data) {
      const d = re.json.data as CaraddeLoginData;
      employee.authorization = `${d.token_type} ${d.access_token}`;
      await employee.save();
      result = await caraddeCall(employee, 'POST', '/presensi/checkout', fd);
    }
  }
  return NextResponse.json(result.json, { status: result.status });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
