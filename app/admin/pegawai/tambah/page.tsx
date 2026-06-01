'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

export default function TambahPegawaiPage() {
  const router = useRouter();
  const [nomorInduk, setNomorInduk] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomorInduk, password, deviceId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Pegawai berhasil ditambahkan');
        router.push('/admin');
      } else {
        toast.error(json.message || 'Gagal menambahkan');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pegawai
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600" /> Tambah Pegawai</CardTitle>
          <CardDescription>Masukkan kredensial Caradde yang akan digunakan oleh pegawai untuk presensi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ni">NIP / NUPTK <span className="text-red-500">*</span></Label>
              <Input id="ni" required value={nomorInduk} onChange={(e) => setNomorInduk(e.target.value)} placeholder="Contoh: 199810292025211068" inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Password Caradde <span className="text-red-500">*</span></Label>
              <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password akun Caradde pegawai" />
              <p className="text-xs text-slate-500">Disimpan terenkripsi (AES-256) untuk auto-refresh token.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="did">Device ID <span className="text-red-500">*</span></Label>
              <Input id="did" required value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Contoh: O11019" />
              <p className="text-xs text-slate-500">Device ID yang terdaftar di Caradde milik pegawai.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/admin"><Button type="button" variant="outline">Batal</Button></Link>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan Pegawai
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
