'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, History, LogIn, LogOut, MapPin } from 'lucide-react';

interface RiwayatItem {
  id: string;
  title: string;
  tanggal: string;
  hari: string;
  date_label: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  status: string;
  jenis: string;
  instansi: { id: string; name: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.includes('hadir')) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{status}</Badge>;
  if (s.includes('tidak') || s.includes('alpa')) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{status}</Badge>;
  if (s.includes('cuti')) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{status}</Badge>;
  if (s.includes('libur')) return <Badge variant="secondary">{status}</Badge>;
  if (s.includes('izin') || s.includes('sakit')) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function RiwayatPage() {
  const [items, setItems] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/riwayat?page=1&limit=31&filter=Bulan%20ini');
        const json = await res.json();
        if (json?.meta?.code === 200) {
          setItems(json.data?.items || []);
        } else {
          toast.error(json?.meta?.message || 'Gagal memuat riwayat');
        }
      } catch {
        toast.error('Gagal memuat riwayat');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" /> Riwayat Presensi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Bulan ini</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Memuat riwayat...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <div className="text-slate-500">Belum ada riwayat presensi</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-semibold text-slate-900">{it.title}</div>
                      <StatusBadge status={it.status} />
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {it.date_label || `${it.hari}, ${it.tanggal}`}
                    </div>
                    {it.instansi?.name && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {it.instansi.name}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <div className="flex items-center gap-1 text-emerald-700 font-mono">
                      <LogIn className="w-3 h-3" />{it.jam_masuk ? it.jam_masuk.substring(0, 5) : '--:--'}
                    </div>
                    <div className="flex items-center gap-1 text-rose-700 font-mono">
                      <LogOut className="w-3 h-3" />{it.jam_keluar ? it.jam_keluar.substring(0, 5) : '--:--'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
