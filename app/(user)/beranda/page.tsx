'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Camera, CheckCircle2, Clock, ImagePlus, Loader2, LogIn, LogOut, MapPin, XCircle } from 'lucide-react';
import { compressImageToMax } from '@/lib/utils/image-client';
import { formatJamShort } from '@/lib/utils/date-id';

interface Me { id: string; nomorInduk: string; employeeName: string | null; jabatan: string | null; instansi: string | null }
interface Beranda {
  can_presence: { status: boolean; reason?: string };
  date: { bulan: string; hari: string; tgl: string };
  status_minggu_ini: Record<string, string | null>;
  kehadiran: number; cuti: number; berlangsung: string;
  operator_instansi?: Array<{ id: string; name: string }>;
}
interface Status {
  sudah_presensi_datang: boolean;
  sudah_presensi_pulang: boolean;
  tanggal: string;
  jam_kerja: { jam_masuk_normal: string; jam_keluar_normal: string };
}

const DAY_KEYS: { key: string; label: string }[] = [
  { key: 'senin', label: 'Sen' },
  { key: 'selasa', label: 'Sel' },
  { key: 'rabu', label: 'Rab' },
  { key: 'kamis', label: 'Kam' },
  { key: 'jumat', label: 'Jum' },
  { key: 'sabtu', label: 'Sab' },
  { key: 'minggu', label: 'Min' },
];

function StatusChip({ status }: { status: string | null }) {
  const s = (status || '').toLowerCase();
  if (s === 'hadir') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Hadir</Badge>;
  if (s === 'alpa') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Alpa</Badge>;
  if (s === 'cuti') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Cuti</Badge>;
  if (s === 'izin' || s === 'sakit') return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{s}</Badge>;
  if (s === 'libur') return <Badge variant="secondary">Libur</Badge>;
  return <span className="text-slate-300 text-xs">—</span>;
}

export default function BerandaPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [beranda, setBeranda] = useState<Beranda | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [meRes, brRes, stRes] = await Promise.all([
        fetch('/api/user/me'),
        fetch('/api/user/beranda'),
        fetch('/api/user/presensi/status'),
      ]);
      const meJson = await meRes.json();
      const brJson = await brRes.json();
      const stJson = await stRes.json();
      if (meJson.success) setMe(meJson.data);
      if (brJson?.meta?.code === 200) setBeranda(brJson.data);
      if (stJson?.meta?.code === 200) setStatus(stJson.data);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const onFile = async (f: File | null) => {
    if (!f) return;
    try {
      const compressed = await compressImageToMax(f, 20 * 1024);
      setSelectedFile(compressed);
      setCompressedSize(compressed.size);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      toast.error('Gagal memproses foto');
    }
  };

  const presensiAction: 'checkin' | 'checkout' | 'done' | 'cannot' = !beranda?.can_presence?.status
    ? 'cannot'
    : status?.sudah_presensi_pulang
    ? 'done'
    : status?.sudah_presensi_datang
    ? 'checkout'
    : 'checkin';

  const submitPresensi = async () => {
    if (!selectedFile) {
      toast.error('Foto wajib diisi');
      return;
    }
    if (presensiAction !== 'checkin' && presensiAction !== 'checkout') return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('foto', selectedFile, 'foto.jpg');
      const endpoint = presensiAction === 'checkin' ? '/api/user/presensi/checkin' : '/api/user/presensi/checkout';
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const json = await res.json();
      if (json?.meta?.code === 200) {
        const d = json.data || {};
        toast.success(`${d.message || 'Presensi berhasil'} · ${d.tanggal || ''} ${d.waktu || ''}`);
        setPresenceOpen(false);
        setSelectedFile(null);
        setPreview(null);
        setCompressedSize(null);
        fetchAll();
      } else {
        toast.error(json?.meta?.message || 'Presensi gagal');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Memuat beranda...</div>;
  }

  const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg">
        <CardContent className="p-5">
          <div className="text-xs opacity-90">Selamat datang,</div>
          <div className="text-lg font-bold mt-0.5 leading-tight">{me?.employeeName || 'Pegawai'}</div>
          <div className="text-xs opacity-80 font-mono mt-1">{me?.nomorInduk}</div>
          {me?.jabatan && <div className="text-xs opacity-80 mt-0.5">{me.jabatan}</div>}
          {me?.instansi && (
            <div className="flex items-center gap-1 text-xs opacity-90 mt-2">
              <MapPin className="w-3 h-3" /> {me.instansi}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date + clock */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{beranda?.date?.hari || ''}</div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">{beranda?.date?.tgl} {beranda?.date?.bulan}</div>
            <div className="text-xs text-slate-500 mt-0.5">{new Date().getFullYear()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Sekarang</div>
            <div className="text-3xl font-bold font-mono text-indigo-600">{jam}</div>
          </div>
        </CardContent>
      </Card>

      {/* Jam Kerja */}
      {status && (
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Jam Kerja Hari Ini</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 mb-1"><LogIn className="w-3.5 h-3.5" /> Jam Masuk</div>
                <div className="text-xl font-bold text-emerald-700 font-mono">{formatJamShort(status.jam_kerja.jam_masuk_normal)}</div>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-rose-700 mb-1"><LogOut className="w-3.5 h-3.5" /> Jam Keluar</div>
                <div className="text-xl font-bold text-rose-700 font-mono">{formatJamShort(status.jam_kerja.jam_keluar_normal)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Presensi Button */}
      <Card className="border-2 border-dashed border-slate-200">
        <CardContent className="p-5">
          {presensiAction === 'cannot' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="font-semibold text-slate-900">Tidak dapat presensi</div>
              <div className="text-sm text-slate-500 mt-1">{beranda?.can_presence?.reason || 'Hari ini tidak ada jadwal presensi'}</div>
            </div>
          )}
          {presensiAction === 'done' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="font-semibold text-slate-900">Presensi Selesai</div>
              <div className="text-sm text-slate-500 mt-1">Anda telah menyelesaikan presensi hari ini</div>
            </div>
          )}
          {presensiAction === 'checkin' && (
            <Button size="lg" className="w-full h-16 text-base bg-emerald-600 hover:bg-emerald-700" onClick={() => setPresenceOpen(true)}>
              <LogIn className="w-5 h-5 mr-2" /> Presensi Masuk
            </Button>
          )}
          {presensiAction === 'checkout' && (
            <Button size="lg" className="w-full h-16 text-base bg-rose-600 hover:bg-rose-700" onClick={() => setPresenceOpen(true)}>
              <LogOut className="w-5 h-5 mr-2" /> Presensi Pulang
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Status Minggu Ini */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Minggu Ini</div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAY_KEYS.map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center gap-1.5 text-center">
                <div className="text-[10px] font-medium text-slate-500">{label}</div>
                <StatusChip status={beranda?.status_minggu_ini?.[key] ?? null} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={presenceOpen} onOpenChange={(o) => { setPresenceOpen(o); if (!o) { setSelectedFile(null); setPreview(null); setCompressedSize(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{presensiAction === 'checkout' ? 'Presensi Pulang' : 'Presensi Masuk'}</DialogTitle>
            <DialogDescription>Ambil atau pilih foto. Foto akan dikompres otomatis (maks 20 KB).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {preview ? (
              <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-square">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  {compressedSize ? `${(compressedSize / 1024).toFixed(1)} KB` : ''}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
                Belum ada foto
              </div>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => cameraRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" /> Kamera
              </Button>
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" /> Album
              </Button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPresenceOpen(false)} disabled={submitting}>Batal</Button>
            <Button onClick={submitPresensi} disabled={!selectedFile || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Kirim Presensi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
