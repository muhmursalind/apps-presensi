'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Fingerprint, LogOut, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    toast.success('Anda telah keluar');
    router.push('/login?as=admin');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">Caradde Admin</div>
              <div className="text-[11px] text-slate-500 leading-tight flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Panel Administrasi</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin" className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm ${pathname === '/admin' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Users className="w-4 h-4" /> Pegawai
            </Link>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1.5" /> Keluar
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
