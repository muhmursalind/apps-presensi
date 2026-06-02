import { NextRequest, NextResponse } from 'next/server';
import { runAutoPresensiBatch } from '@/lib/auto-presensi/runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const headerSecret = req.headers.get('x-cron-secret');
  const auth = req.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  // Allow query param fallback so external cron services (which can't always set headers) still work.
  const qsSecret = req.nextUrl.searchParams.get('secret');

  if (headerSecret !== secret && bearer !== secret && qsSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  try {
    const results = await runAutoPresensiBatch();
    return NextResponse.json({
      success: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      processed: results.length,
      results,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
