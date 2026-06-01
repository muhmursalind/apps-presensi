'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function EditPegawaiPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nomorInduk, setNomorInduk] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [instansi, setInstansi] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/employees/${id}`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setNomorInduk(d.nomorInduk || '');
        setDeviceId(d.deviceId || '');
        setEmployeeName(d.employeeName || '');
        setInstansi(d.instansi || '');
        setLatitude(d.latitude?.toString() || '');
        setLongitude(d.longitude?.toString() || '');
      } else {
        toast.error(json.message || 'Gagal memuat data');
      }
      setLoading(false);
    })();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nomorInduk,
        deviceId,
        employeeName: employeeName || null,
        instansi: instansi || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };
      if (password) payload.password = password;
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data pegawai diperbarui');
        router.push('/admin');
      } else {
        toast.error(json.message || 'Gagal menyimpan');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-12 text-slate-500">Memuat data pegawai...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pegawai
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Edit Pegawai</CardTitle>
          <CardDescription>Perbarui informasi akun & data pegawai.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Akun Pegawai</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ni">NIP / NUPTK</Label>
                  <Input id="ni" required value={nomorInduk} onChange={(e) => setNomorInduk(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Password (kosongkan jika tidak diubah)</Label>
                  <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="did">Device ID</Label>
                  <Input id="did" required value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Data Pegawai (Opsional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nama">Nama Pegawai</Label>
                  <Input id="nama" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ins">Instansi</Label>
                  <Input id="ins" value={instansi} onChange={(e) => setInstansi(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input id="lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} inputMode="decimal" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input id="lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} inputMode="decimal" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/admin"><Button type="button" variant="outline">Batal</Button></Link>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
