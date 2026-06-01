import { NextRequest, NextResponse } from 'next/server';
import { getSession, USER_COOKIE, type UserPayload } from '@/lib/auth/session';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { caraddeCall, loginCaradde } from '@/lib/caradde/client';
import { decrypt } from '@/lib/auth/crypto';
import type { CaraddeLocationsData, CaraddeLoginData } from '@/lib/caradde/types';

async function buildCheckFormData(req: NextRequest, employee: { latitude: number | null; longitude: number | null; instansi: string | null }) {
  const incoming = await req.formData();
  const foto = incoming.get('foto');
  if (!foto || !(foto instanceof File)) return null;
  const fd = new FormData();
  fd.append('latitude', String(incoming.get('latitude') ?? employee.latitude ?? ''));
  fd.append('longitude', String(incoming.get('longitude') ?? employee.longitude ?? ''));
  fd.append('lokasi', String(incoming.get('lokasi') ?? employee.instansi ?? ''));
  fd.append('foto', foto, foto.name || 'foto.jpg');
  return fd;
}

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

  const fd = await buildCheckFormData(req, employee);
  if (!fd) {
    return NextResponse.json({ meta: { code: 400, status: 'failed', message: 'Foto wajib disertakan' }, data: {} }, { status: 400 });
  }

  // Call directly; if 401, re-login then retry with a fresh FormData (we must rebuild)
  let result = await caraddeCall(employee, 'POST', '/presensi/checkin', fd);
  if (result.status === 401 || result.json?.meta?.code === 401) {
    // Force fresh login then retry once with rebuilt form (need to re-read request - but already consumed)
    // We'll just relogin without retry; user can press again. But to be friendly try with original buffered file.
    const pwd = decrypt(employee.passwordEnc);
    const re = await loginCaradde(employee.nomorInduk, pwd, employee.deviceId);
    if (re.json?.meta?.code === 200 && re.json.data) {
      const d = re.json.data as CaraddeLoginData;
      employee.authorization = `${d.token_type} ${d.access_token}`;
      await employee.save();
      result = await caraddeCall(employee, 'POST', '/presensi/checkin', fd);
    }
  }
  return NextResponse.json(result.json, { status: result.status });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
