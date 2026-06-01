'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, UserRound, Fingerprint, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get('as') === 'admin' ? 'admin' : 'user';
  const [tab, setTab] = useState<string>(initial);

  // Admin form
  const [aUser, setAUser] = useState('');
  const [aPwd, setAPwd] = useState('');
  const [aLoading, setALoading] = useState(false);

  // User form (just NIP)
  const [nip, setNip] = useState('');
  const [uLoading, setULoading] = useState(false);

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setALoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: aUser, password: aPwd }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Login gagal');
      } else {
        toast.success('Login admin berhasil');
        router.push('/admin');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setALoading(false);
    }
  };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setULoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomorInduk: nip }),
      });
      const json = await res.json();
      const msg = json?.meta?.message || 'Login gagal';
      if (json?.meta?.code === 200) {
        toast.success(msg);
        router.push('/beranda');
      } else {
        toast.error(msg);
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setULoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
          <Fingerprint className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Caradde Presensi</h1>
        <p className="text-sm text-slate-500 mt-1">DINAS PENDIDIKAN KABUPATEN GOWA</p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle>Masuk ke Sistem</CardTitle>
          <CardDescription>Pilih jenis akun untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="user"><UserRound className="w-4 h-4 mr-2" />Pegawai</TabsTrigger>
              <TabsTrigger value="admin"><ShieldCheck className="w-4 h-4 mr-2" />Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              <form onSubmit={submitUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP / NUPTK</Label>
                  <Input id="nip" placeholder="Masukkan NIP atau NUPTK Anda" value={nip} onChange={(e) => setNip(e.target.value)} required autoFocus inputMode="numeric" />
                </div>
                <Button type="submit" className="w-full" disabled={uLoading}>
                  {uLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Masuk
                </Button>
                <p className="text-xs text-slate-500 text-center">Akun pegawai dikelola oleh administrator sekolah.</p>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={submitAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auser">Username</Label>
                  <Input id="auser" placeholder="Username admin" value={aUser} onChange={(e) => setAUser(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apwd">Password</Label>
                  <Input id="apwd" type="password" placeholder="Password admin" value={aPwd} onChange={(e) => setAPwd(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={aLoading}>
                  {aLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                  Masuk sebagai Admin
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-slate-400">&copy; {new Date().getFullYear()} Caradde · Sistem Presensi Pegawai</p>
    </div>
  );
}
