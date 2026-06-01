import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = () => new TextEncoder().encode(process.env.JWT_SECRET as string);

async function verify(token: string | undefined): Promise<{ role?: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const adminToken = req.cookies.get('caradde_admin')?.value;
    const p = await verify(adminToken);
    if (!p || p.role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('as', 'admin');
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/beranda' || pathname === '/riwayat') {
    const userToken = req.cookies.get('caradde_user')?.value;
    const p = await verify(userToken);
    if (!p || p.role !== 'user') {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/beranda', '/riwayat'],
};
