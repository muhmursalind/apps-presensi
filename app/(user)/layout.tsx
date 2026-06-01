'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Fingerprint, History, Home, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/user/logout', { method: 'POST' });
    toast.success('Anda telah keluar');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/beranda" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-tight">Caradde</div>
              <div className="text-[11px] text-slate-500 leading-tight">Presensi Pegawai</div>
            </div>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout} className="text-slate-600">
            <LogOut className="w-4 h-4 mr-1.5" /> Keluar
          </Button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-5">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40">
        <div className="max-w-3xl mx-auto grid grid-cols-2">
          <Link href="/beranda" className={`flex flex-col items-center gap-1 py-3 text-xs ${pathname === '/beranda' ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}>
            <Home className="w-5 h-5" /> Beranda
          </Link>
          <Link href="/riwayat" className={`flex flex-col items-center gap-1 py-3 text-xs ${pathname === '/riwayat' ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}>
            <History className="w-5 h-5" /> Riwayat
          </Link>
        </div>
      </nav>
    </div>
  );
}
