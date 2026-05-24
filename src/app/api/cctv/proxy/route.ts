import { NextResponse } from 'next/server';

/**
 * /api/cctv/proxy?url=<encoded-image-url>
 *
 * Server-side image proxy for sources that require a specific Referer.
 * Used by MBJB (c10.fgies.com) which blocks requests without Referer: jalanow.com
 *
 * Security: only whitelisted domains are proxied.
 */

const ALLOWED_HOSTS = [
  'c10.fgies.com',   // MBJB – Johor Bahru (via jalanow.com)
];

const REFERER_MAP: Record<string, string> = {
  'c10.fgies.com': 'https://www.jalanow.com/',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  const referer = REFERER_MAP[parsed.hostname] ?? '';

  try {
    const upstream = await fetch(target, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (compatible; CCTVProxy/1.0)',
        'Accept': 'image/jpeg,image/*',
      },
    });

    if (!upstream.ok) {
      return new NextResponse('Upstream error', { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Fetch failed', { status: 502 });
  }
}
