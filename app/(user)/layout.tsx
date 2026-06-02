'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Fingerprint, History, Home, LogOut, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/me');
        const json = await res.json();
        if (json.success) setAutoEnabled(!!json.data.autoPresensiEnabled);
      } catch { /* ignore */ }
    })();
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/user/logout', { method: 'POST' });
    toast.success('Anda telah keluar');
    router.push('/login');
  };

  const tabs = [
    { href: '/beranda', label: 'Beranda', icon: Home },
    { href: '/riwayat', label: 'Riwayat', icon: History },
    ...(autoEnabled ? [{ href: '/otomatis', label: 'Otomatis', icon: Zap }] : []),
  ];

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
        <div className="max-w-3xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 text-xs ${pathname === href ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}
            >
              <Icon className="w-5 h-5" /> {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
