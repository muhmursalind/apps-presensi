'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Plus, Search, Trash2, Users, MapPin, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeRow {
  id: string;
  nomorInduk: string;
  deviceId: string;
  employeeName: string | null;
  instansi: string | null;
  jabatan: string | null;
  email: string | null;
  hasAuthorization: boolean;
  autoPresensiEnabled?: boolean;
  lastLogin: string | null;
}

export default function AdminEmployeesPage() {
  const [list, setList] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [delTarget, setDelTarget] = useState<EmployeeRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees');
      const json = await res.json();
      if (json.success) setList(json.data);
    } catch {
      toast.error('Gagal memuat daftar pegawai');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async () => {
    if (!delTarget) return;
    const res = await fetch(`/api/admin/employees/${delTarget.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast.success('Pegawai dihapus');
      setDelTarget(null);
      load();
    } else {
      toast.error(json.message || 'Gagal menghapus');
    }
  };

  const toggleAuto = async (emp: EmployeeRow, enabled: boolean) => {
    setTogglingId(emp.id);
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}/auto-presensi`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(enabled ? 'Akses Auto Presensi diaktifkan' : 'Akses Auto Presensi dinonaktifkan');
        setList((prev) => prev.map((e) => (e.id === emp.id ? { ...e, autoPresensiEnabled: enabled } : e)));
      } else {
        toast.error(json.message || 'Gagal');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = list.filter((e) => {
    const s = q.toLowerCase();
    return (
      e.nomorInduk.toLowerCase().includes(s) ||
      (e.employeeName || '').toLowerCase().includes(s) ||
      (e.instansi || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-indigo-600" /> Daftar Pegawai</h1>
          <p className="text-sm text-slate-500">Kelola akun pegawai untuk presensi Caradde</p>
        </div>
        <Link href="/admin/pegawai/tambah">
          <Button><Plus className="w-4 h-4 mr-2" /> Tambah Pegawai</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Cari NIP, nama, atau instansi..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Belum ada pegawai terdaftar</p>
              <Link href="/admin/pegawai/tambah" className="inline-block mt-4">
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Tambah Pegawai</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr className="text-left">
                    <th className="p-3 font-medium">NIP/NUPTK</th>
                    <th className="p-3 font-medium">Nama</th>
                    <th className="p-3 font-medium">Instansi</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium"><span className="inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Auto</span></th>
                    <th className="p-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs">{e.nomorInduk}</td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">{e.employeeName || <span className="text-slate-400 italic">Belum login</span>}</div>
                        {e.jabatan && <div className="text-xs text-slate-500">{e.jabatan}</div>}
                      </td>
                      <td className="p-3 text-slate-700">
                        {e.instansi ? (
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{e.instansi}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {e.hasAuthorization ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Belum login</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Switch
                          checked={!!e.autoPresensiEnabled}
                          disabled={togglingId === e.id}
                          onCheckedChange={(v) => toggleAuto(e, v)}
                          aria-label="Toggle Auto Presensi"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/pegawai/${e.id}`}>
                            <Button variant="outline" size="sm"><Edit className="w-3.5 h-3.5" /></Button>
                          </Link>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDelTarget(e)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pegawai?</AlertDialogTitle>
            <AlertDialogDescription>
              NIP/NUPTK <strong>{delTarget?.nomorInduk}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
