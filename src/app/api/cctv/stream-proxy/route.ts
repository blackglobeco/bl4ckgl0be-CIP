import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Allowlist — only proxy bl4ckeye.onrender.com
  let parsed: URL;
  try { parsed = new URL(url); } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }
  if (parsed.hostname !== 'bl4ckeye.onrender.com') {
    return NextResponse.json({ error: 'Forbidden host' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlackGlobe/1.0)' },
    });

    const contentType = upstream.headers.get('content-type') || '';

    // Non-HTML (video/image stream) — proxy bytes directly
    if (!contentType.includes('text/html')) {
      const body = await upstream.arrayBuffer();
      return new NextResponse(body, {
        status: upstream.status,
        headers: {
          'content-type': contentType,
          'cache-control': 'no-store',
          'access-control-allow-origin': '*',
        },
      });
    }

    // HTML page — inject CSS to make video player fill 100% of viewport
    let html = await upstream.text();

    // The Blackeye player page renders a <video> or canvas that we need
    // to stretch to fill whatever viewport it's given.
    const injectStyle = `<style>
*{box-sizing:border-box}
html,body{
  margin:0!important;padding:0!important;
  width:100%!important;height:100%!important;
  overflow:hidden!important;background:#000!important;
}
video,canvas{
  position:fixed!important;
  top:0!important;left:0!important;
  width:100%!important;height:100%!important;
  object-fit:fill!important;
}
/* Hide any UI chrome the player might show */
.controls,.navbar,.header,.footer,nav,header,footer{display:none!important}
/* Common player wrapper divs */
#player,#app,.player,.app,.container,#container,
[class*="player"],[class*="video"],[id*="player"],[id*="video"]{
  position:fixed!important;top:0!important;left:0!important;
  width:100%!important;height:100%!important;
  margin:0!important;padding:0!important;
}
</style>`;

    // Inject right after <head> opens (or prepend if no <head>)
    if (/<head(\s[^>]*)?>/i.test(html)) {
      html = html.replace(/(<head(\s[^>]*)?>)/i, `$1${injectStyle}`);
    } else {
      html = injectStyle + html;
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
  }
}
