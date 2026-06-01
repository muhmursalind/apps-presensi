import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { decrypt } from '@/lib/auth/crypto';
import { loginCaradde } from '@/lib/caradde/client';
import { setSession, USER_COOKIE } from '@/lib/auth/session';
import type { CaraddeLoginData } from '@/lib/caradde/types';

const schema = z.object({ nomorInduk: z.string().min(1, 'NIP/NUPTK wajib diisi').trim() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { meta: { code: 400, status: 'failed', message: parsed.error.issues[0]?.message || 'Input tidak valid' }, data: {} },
        { status: 400 }
      );
    }
    await connectDB();
    const employee = await Employee.findOne({ nomorInduk: parsed.data.nomorInduk });
    if (!employee) {
      return NextResponse.json(
        { meta: { code: 500, status: 'failed', message: 'Terjadi kesalahan internal server' }, data: {} },
        { status: 500 }
      );
    }
    const password = decrypt(employee.passwordEnc);
    const result = await loginCaradde(employee.nomorInduk, password, employee.deviceId);
    if (result.json?.meta?.code === 200 && result.json.data) {
      const data = result.json.data as CaraddeLoginData;
      employee.authorization = `${data.token_type} ${data.access_token}`;
      employee.caraddeUserId = data.user.id;
      employee.employeeName = data.user.name;
      employee.jabatan = data.user.jabatan ?? null;
      employee.email = data.user.email ?? null;
      employee.lastLogin = new Date();
      await employee.save();
      await setSession(USER_COOKIE, { role: 'user', employeeId: employee._id, nomorInduk: employee.nomorInduk });
    }
    // Pass through Caradde response (preserve meta.message for UI)
    return NextResponse.json(result.json, { status: result.json?.meta?.code === 200 ? 200 : (result.status || 401) });
  } catch (e) {
    console.error('User login error', e);
    return NextResponse.json(
      { meta: { code: 500, status: 'failed', message: 'Terjadi kesalahan server' }, data: {} },
      { status: 500 }
    );
  }
}
