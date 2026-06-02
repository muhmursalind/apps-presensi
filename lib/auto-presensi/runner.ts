import { connectDB } from '@/lib/db';
import { Employee, type EmployeeDoc } from '@/lib/models/Employee';
import { caraddeCall } from '@/lib/caradde/client';

export interface AutoRunResult {
  employeeId: string;
  nomorInduk: string;
  action: 'skip' | 'checkin' | 'checkout' | 'complete' | 'error';
  success?: boolean;
  message?: string;
  reason?: string;
}

// Build a Web-File from base64 (data URL or raw base64).
function base64ToFile(b64: string, filename = 'foto.jpg'): File {
  const clean = b64.replace(/^data:.+;base64,/, '');
  const bin = Buffer.from(clean, 'base64');
  // Node 18+ has global File
  return new File([bin], filename, { type: 'image/jpeg' });
}

function timeToMinutes(hhmm: string): number {
  const parts = hhmm.split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
}

function todayDateStringID(now = new Date()): string {
  // Use server local date (assumed Asia/Makassar in deployment) — caller can pass now.
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Process one employee for the current minute. Returns what happened.
 * Idempotent: relies on Caradde's `sudah_presensi_*` flags + local attempt tracking.
 */
export async function processOneEmployee(
  employee: EmployeeDoc,
  windowMinutes = 2
): Promise<AutoRunResult> {
  const base: AutoRunResult = {
    employeeId: employee._id,
    nomorInduk: employee.nomorInduk,
    action: 'skip',
  };

  const sched = employee.autoPresensiSchedule;
  if (!sched || !sched.active) return { ...base, reason: 'Jadwal tidak aktif' };
  if (!sched.fotoBase64) return { ...base, reason: 'Foto tidak tersedia' };

  const now = new Date();
  const todayStr = todayDateStringID(now);

  // Date range
  if (sched.startDate && now < new Date(sched.startDate)) {
    return { ...base, reason: 'Jadwal belum dimulai' };
  }
  if (sched.endDate && now > new Date(sched.endDate)) {
    sched.active = false;
    await employee.save();
    return { ...base, action: 'complete', reason: 'Jadwal selesai' };
  }

  // can_presence
  const beranda = await caraddeCall(employee, 'GET', '/beranda');
  if (beranda.json?.meta?.code !== 200) {
    return { ...base, reason: 'Gagal mengambil beranda' };
  }
  const canPresence = (beranda.json.data as { can_presence?: { status: boolean; reason?: string } } | undefined)?.can_presence;
  if (!canPresence?.status) {
    return { ...base, reason: canPresence?.reason || 'Tidak dapat presensi hari ini' };
  }

  // Today's status & jam kerja
  const status = await caraddeCall(employee, 'GET', '/presensi/status-hari-ini');
  if (status.json?.meta?.code !== 200) {
    return { ...base, reason: 'Gagal mengambil status' };
  }
  const sdata = status.json.data as {
    sudah_presensi_datang: boolean;
    sudah_presensi_pulang: boolean;
    jam_kerja?: { jam_masuk_normal: string; jam_keluar_normal: string };
  } | undefined;
  if (!sdata?.jam_kerja) return { ...base, reason: 'Jam kerja tidak tersedia' };

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const jamMasukMins = timeToMinutes(sdata.jam_kerja.jam_masuk_normal);
  const jamKeluarMins = timeToMinutes(sdata.jam_kerja.jam_keluar_normal);

  // Helper to perform a presensi action (checkin or checkout)
  const performAction = async (kind: 'checkin' | 'checkout'): Promise<AutoRunResult> => {
    const loc = await caraddeCall(employee, 'GET', '/presensi');
    if (loc.json?.meta?.code !== 200) {
      return { ...base, action: 'error', reason: 'Gagal mengambil lokasi' };
    }
    const primary = (loc.json.data as { locations?: Array<{ latitude: number; longitude: number; agency_name: string }> } | undefined)?.locations?.[0];
    if (!primary) return { ...base, action: 'error', reason: 'Lokasi tidak ditemukan' };

    employee.instansi = primary.agency_name;
    employee.latitude = primary.latitude;
    employee.longitude = primary.longitude;

    const fd = new FormData();
    fd.append('latitude', String(primary.latitude));
    fd.append('longitude', String(primary.longitude));
    fd.append('lokasi', primary.agency_name);
    fd.append('foto', base64ToFile(sched.fotoBase64), 'foto.jpg');

    const r = await caraddeCall(employee, 'POST', `/presensi/${kind}`, fd);
    const success = r.json?.meta?.code === 200;
    const message = r.json?.meta?.message || (success ? 'Berhasil' : 'Gagal');
    const attempt = { date: todayStr, success, message, at: new Date() };
    if (kind === 'checkin') sched.completedCheckins.push(attempt);
    else sched.completedCheckouts.push(attempt);
    await employee.save();
    return { ...base, action: kind, success, message };
  };

  // CHECK-IN window
  if (!sdata.sudah_presensi_datang) {
    if (Math.abs(nowMins - jamMasukMins) <= windowMinutes) {
      const already = sched.completedCheckins.some((c) => c.date === todayStr && c.success);
      if (already) return { ...base, reason: 'Check-in sudah berhasil hari ini' };
      return await performAction('checkin');
    }
    return { ...base, reason: `Menunggu jam masuk ${sdata.jam_kerja.jam_masuk_normal.substring(0, 5)}` };
  }

  // CHECK-OUT window
  if (!sdata.sudah_presensi_pulang) {
    if (Math.abs(nowMins - jamKeluarMins) <= windowMinutes) {
      const already = sched.completedCheckouts.some((c) => c.date === todayStr && c.success);
      if (already) return { ...base, reason: 'Check-out sudah berhasil hari ini' };
      return await performAction('checkout');
    }
    return { ...base, reason: `Menunggu jam keluar ${sdata.jam_kerja.jam_keluar_normal.substring(0, 5)}` };
  }

  return { ...base, reason: 'Presensi hari ini sudah lengkap' };
}

export async function runAutoPresensiBatch(): Promise<AutoRunResult[]> {
  await connectDB();
  const employees = await Employee.find({
    autoPresensiEnabled: true,
    'autoPresensiSchedule.active': true,
  });
  const results: AutoRunResult[] = [];
  for (const emp of employees) {
    try {
      const r = await processOneEmployee(emp);
      results.push(r);
    } catch (e) {
      results.push({
        employeeId: emp._id,
        nomorInduk: emp.nomorInduk,
        action: 'error',
        reason: (e as Error).message || 'Unknown error',
      });
    }
  }
  return results;
}
