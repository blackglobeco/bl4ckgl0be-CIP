import { NextResponse } from 'next/server';

const ITRAFIK_LIST_URL = 'https://itrafik.mbjb.gov.my/itrafik/list_cctv';
const ITRAFIK_BASE     = 'https://itrafik.mbjb.gov.my';
const ALLOWED_HOST     = 'itrafik.mbjb.gov.my';
const REFERER          = 'https://itrafik.mbjb.gov.my/itrafik/list_cctv';

// In-memory cache: { camSlot -> { url, expiresAt } }
const urlCache = new Map<string, { url: string; expiresAt: number }>();
let pageCache: { html: string; expiresAt: number } | null = null;

async function fetchListPage(): Promise<string> {
  const now = Date.now();
  if (pageCache && pageCache.expiresAt > now) return pageCache.html;

  const res = await fetch(ITRAFIK_LIST_URL, {
    signal: AbortSignal.timeout(10000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CCTVProxy/1.0)',
      'Accept': 'text/html',
    },
  });
  if (!res.ok) throw new Error(`iTrafik list fetch failed: ${res.status}`);
  const html = await res.text();
  pageCache = { html, expiresAt: now + 60_000 }; // cache 60 s
  return html;
}

function extractSnapshotUrl(html: string, camSlot: string): string | null {
  // Match: cctv_snapshots/L01_Cam1/...jpg (with optional ?timestamp)
  const escaped = camSlot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `cctv_snapshots/${escaped}/[^"']+\\.jpg(?:\\?[^"']*)?`,
    'i'
  );
  const match = html.match(pattern);
  if (!match) return null;
  const path = match[0];
  // Skip the no_image placeholder
  if (path.includes('no_image')) return null;
  return path.startsWith('http') ? path : `${ITRAFIK_BASE}/itrafik/${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cam = searchParams.get('cam');

  if (!cam || !/^L\d{2}_Cam\d$/.test(cam)) {
    return new NextResponse('Invalid cam param', { status: 400 });
  }

  // Check per-cam cache
  const now = Date.now();
  const cached = urlCache.get(cam);
  let imageUrl = (cached && cached.expiresAt > now) ? cached.url : null;

  if (!imageUrl) {
    try {
      const html = await fetchListPage();
      imageUrl = extractSnapshotUrl(html, cam) ?? null;
      if (imageUrl) {
        urlCache.set(cam, { url: imageUrl, expiresAt: now + 55_000 });
      }
    } catch {
      return new NextResponse('Failed to fetch iTrafik list', { status: 502 });
    }
  }

  if (!imageUrl) {
    return new NextResponse('Camera not found or offline', { status: 404 });
  }

  // Validate host
  try {
    const parsed = new URL(imageUrl);
    if (parsed.hostname !== ALLOWED_HOST) {
      return new NextResponse('Unexpected host', { status: 403 });
    }
  } catch {
    return new NextResponse('Bad image URL', { status: 502 });
  }

  // Proxy the image
  try {
    const upstream = await fetch(imageUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'Referer':     REFERER,
        'User-Agent':  'Mozilla/5.0 (compatible; CCTVProxy/1.0)',
        'Accept':      'image/jpeg,image/*',
      },
    });
    if (!upstream.ok) return new NextResponse('Upstream image error', { status: 502 });

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':                contentType,
        'Cache-Control':               'public, max-age=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Image fetch failed', { status: 502 });
  }
}
