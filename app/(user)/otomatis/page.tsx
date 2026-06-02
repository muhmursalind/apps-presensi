'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Camera, CheckCircle2, ImagePlus, Loader2, LogIn, LogOut, Pause, Play, Shield, XCircle, Zap, AlarmClock,
} from 'lucide-react';
import { compressImageToMax } from '@/lib/utils/image-client';

interface Attempt {
  date: string;
  success: boolean;
  message: string;
  at: string;
}
interface Schedule {
  active: boolean;
  daysCount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  hasFoto: boolean;
  checkinsCount: number;
  checkoutsCount: number;
  recentCheckins: Attempt[];
  recentCheckouts: Attempt[];
}
interface AutoState {
  enabled: boolean;
  schedule: Schedule | null;
}

const PRESETS = [1, 3, 7, 30];

function fmtDateTime(d: string | Date): string {
  const dt = new Date(d);
  return dt.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function OtomatisPage() {
  const [state, setState] = useState<AutoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSetup, setOpenSetup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Setup form
  const [days, setDays] = useState<number>(7);
  const [customDays, setCustomDays] = useState<string>('');
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fotoSize, setFotoSize] = useState<number | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/auto-presensi');
      const json = await res.json();
      if (json.success) setState(json.data);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const onPickFoto = async (f: File | null) => {
    if (!f) return;
    try {
      const compressed = await compressImageToMax(f, 10 * 1024);
      setFoto(compressed);
      setFotoSize(compressed.size);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      toast.error('Gagal memproses foto');
    }
  };

  const finalDays = days === -1 ? parseInt(customDays || '0', 10) : days;

  const submitSchedule = async () => {
    if (!foto) { toast.error('Foto wajib disertakan'); return; }
    if (!finalDays || finalDays < 1 || finalDays > 365) {
      toast.error('Jumlah hari harus 1-365');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('foto', foto, 'foto.jpg');
      fd.append('daysCount', String(finalDays));
      const res = await fetch('/api/user/auto-presensi', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        toast.success(`Jadwal otomatis aktif selama ${finalDays} hari`);
        setOpenSetup(false);
        setFoto(null); setPreview(null); setFotoSize(null);
        load();
      } else {
        toast.error(json.message || 'Gagal');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const stopSchedule = async () => {
    if (!confirm('Hentikan jadwal presensi otomatis?')) return;
    const res = await fetch('/api/user/auto-presensi', { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast.success('Jadwal dihentikan');
      load();
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-500">Memuat...</div>;

  if (!state?.enabled) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-semibold text-amber-900">Fitur Belum Tersedia</h2>
          <p className="text-sm text-amber-700 mt-2">
            Anda belum mendapatkan akses fitur <strong>Presensi Otomatis</strong>.
            Silakan hubungi administrator sekolah untuk mengaktifkannya.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sched = state.schedule;
  const isActive = !!sched?.active;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Presensi Otomatis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Auto check-in & check-out tepat di jam kerja</p>
        </div>
        {isActive ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Berjalan</Badge> : <Badge variant="secondary">Tidak Aktif</Badge>}
      </div>

      {isActive && sched ? (
        <>
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-emerald-700 font-semibold">Jadwal Aktif</div>
                  <div className="text-2xl font-bold text-emerald-900 mt-1">{sched.daysCount} hari</div>
                  <div className="text-xs text-emerald-700 mt-1">
                    {fmtDateTime(sched.startDate)} — {fmtDateTime(sched.endDate)}
                  </div>
                </div>
                <AlarmClock className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white rounded-lg p-2 border border-emerald-100">
                  <div className="text-[10px] text-slate-500">Check-in sukses</div>
                  <div className="text-lg font-bold text-emerald-700">{sched.recentCheckins.filter(c => c.success).length}</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-emerald-100">
                  <div className="text-[10px] text-slate-500">Check-out sukses</div>
                  <div className="text-lg font-bold text-rose-700">{sched.recentCheckouts.filter(c => c.success).length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={stopSchedule}>
            <Pause className="w-4 h-4 mr-2" /> Hentikan Jadwal
          </Button>

          {/* History */}
          {(sched.recentCheckins.length > 0 || sched.recentCheckouts.length > 0) && (
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Aktivitas Terakhir</div>
                <div className="space-y-2">
                  {[...sched.recentCheckins.map(c => ({ ...c, type: 'in' as const })), ...sched.recentCheckouts.map(c => ({ ...c, type: 'out' as const }))]
                    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                    .slice(0, 8)
                    .map((c, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 text-xs border-b last:border-0 pb-2 last:pb-0">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {c.type === 'in' ? <LogIn className="w-3.5 h-3.5 mt-0.5 text-emerald-600" /> : <LogOut className="w-3.5 h-3.5 mt-0.5 text-rose-600" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800">{c.type === 'in' ? 'Check-in' : 'Check-out'} · {c.date}</div>
                            <div className="text-slate-500 truncate">{c.message}</div>
                          </div>
                        </div>
                        {c.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h2 className="text-base font-semibold text-slate-900">Belum Ada Jadwal</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">Aktifkan presensi otomatis dengan foto selfie & durasi.</p>
            <Button onClick={() => setOpenSetup(true)}>
              <Play className="w-4 h-4 mr-2" /> Mulai Jadwal Otomatis
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-50 border-dashed">
        <CardContent className="p-4 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 mb-1">✨ Cara kerja:</div>
          <div>1. Foto selfie dikompres maksimal <strong>10KB</strong> & disimpan terenkripsi.</div>
          <div>2. Setiap menit sistem cek apakah waktunya presensi.</div>
          <div>3. Pada jam masuk, otomatis check-in. Pada jam keluar, otomatis check-out.</div>
          <div>4. Skip otomatis jika hari libur atau sudah presensi.</div>
        </CardContent>
      </Card>

      <Dialog open={openSetup} onOpenChange={(o) => { setOpenSetup(o); if (!o) { setFoto(null); setPreview(null); setFotoSize(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mulai Presensi Otomatis</DialogTitle>
            <DialogDescription>Pilih foto selfie & durasi. Foto akan dikompres maksimal 10KB.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Days picker */}
            <div className="space-y-2">
              <Label>Durasi (hari)</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((d) => (
                  <Button key={d} type="button" variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => { setDays(d); setCustomDays(''); }}>
                    {d}
                  </Button>
                ))}
              </div>
              <Button type="button" variant={days === -1 ? 'default' : 'outline'} size="sm" onClick={() => setDays(-1)} className="w-full">
                Custom
              </Button>
              {days === -1 && (
                <Input type="number" min="1" max="365" placeholder="Masukkan jumlah hari (1-365)" value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
              )}
            </div>

            {/* Foto picker */}
            <div className="space-y-2">
              <Label>Foto Selfie</Label>
              {preview ? (
                <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {fotoSize ? `${(fotoSize / 1024).toFixed(1)} KB` : ''}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
                  Belum ada foto
                </div>
              )}
              <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => onPickFoto(e.target.files?.[0] || null)} />
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPickFoto(e.target.files?.[0] || null)} />
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-2" /> Kamera
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="w-4 h-4 mr-2" /> Album
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOpenSetup(false)} disabled={submitting}>Batal</Button>
            <Button onClick={submitSchedule} disabled={!foto || submitting || !finalDays}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Aktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
