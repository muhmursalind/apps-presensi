import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Employee } from '@/lib/models/Employee';
import { getSession, USER_COOKIE, type UserPayload } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getMe() {
  const s = await getSession<UserPayload>(USER_COOKIE);
  if (!s) return null;
  await connectDB();
  const emp = await Employee.findById(s.employeeId);
  return emp;
}

export async function GET() {
  const emp = await getMe();
  if (!emp) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const sched = emp.autoPresensiSchedule;
  return NextResponse.json({
    success: true,
    data: {
      enabled: !!emp.autoPresensiEnabled,
      schedule: sched
        ? {
            active: sched.active,
            daysCount: sched.daysCount,
            startDate: sched.startDate,
            endDate: sched.endDate,
            createdAt: sched.createdAt,
            hasFoto: !!sched.fotoBase64,
            checkinsCount: sched.completedCheckins?.length || 0,
            checkoutsCount: sched.completedCheckouts?.length || 0,
            recentCheckins: (sched.completedCheckins || []).slice(-10).reverse(),
            recentCheckouts: (sched.completedCheckouts || []).slice(-10).reverse(),
          }
        : null,
    },
  });
}

export async function POST(req: NextRequest) {
  const emp = await getMe();
  if (!emp) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!emp.autoPresensiEnabled) {
    return NextResponse.json(
      { success: false, message: 'Anda belum diberi akses fitur Presensi Otomatis. Hubungi admin.' },
      { status: 403 }
    );
  }
  try {
    const fd = await req.formData();
    const foto = fd.get('foto');
    const daysCount = parseInt(String(fd.get('daysCount') || '1'), 10);
    if (!foto || !(foto instanceof File)) {
      return NextResponse.json({ success: false, message: 'Foto wajib disertakan' }, { status: 400 });
    }
    if (!Number.isFinite(daysCount) || daysCount < 1 || daysCount > 365) {
      return NextResponse.json({ success: false, message: 'Jumlah hari harus 1-365' }, { status: 400 });
    }
    // Enforce <=15KB to be safe (10KB target, allow some headroom)
    if (foto.size > 15 * 1024) {
      return NextResponse.json(
        { success: false, message: `Foto terlalu besar (${(foto.size / 1024).toFixed(1)}KB). Maksimal 10KB.` },
        { status: 400 }
      );
    }
    const arrayBuf = await foto.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString('base64');

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + daysCount);
    end.setHours(23, 59, 59, 999);

    emp.autoPresensiSchedule = {
      active: true,
      fotoBase64: base64,
      startDate: start,
      endDate: end,
      daysCount,
      completedCheckins: [],
      completedCheckouts: [],
      createdAt: new Date(),
    } as typeof emp.autoPresensiSchedule;
    await emp.save();

    return NextResponse.json({
      success: true,
      data: {
        active: true,
        daysCount,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        fotoSizeKB: (foto.size / 1024).toFixed(2),
      },
    });
  } catch (e) {
    console.error('Setup auto-presensi error', e);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan jadwal: ' + (e as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const emp = await getMe();
  if (!emp) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (emp.autoPresensiSchedule) {
    emp.autoPresensiSchedule.active = false;
    await emp.save();
  }
  return NextResponse.json({ success: true, data: { message: 'Jadwal dihentikan' } });
}
