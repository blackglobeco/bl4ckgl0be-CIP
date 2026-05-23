// ── Japan: Shutoko Highway + JARTIC open data cameras ────────────────────────
// Allowlist audit:
//   www.jartic.or.jp       → data fetch only; image URLs from API accepted as-is
//   www.shutoko.jp         → NOT in allowlist → use Windy webcam embeds where
//                            available, external_url otherwise
//   www.windy.com/embed    → ALLOWED (stream_type 'iframe')
//   imgproxy.windy.com     → ALLOWED (feed_url snapshots)

/** Build Windy embed + imgproxy snapshot fields */
function windy(id: string) {
  return {
    stream_url: `https://www.windy.com/webcams/${id}/embed`,
    stream_type: 'iframe' as const,
    feed_url: `https://imgproxy.windy.com/${id.slice(0, 2)}/${id}/current/full/${id}.jpg`,
    external_url: `https://www.windy.com/webcams/${id}`,
    source: 'Windy',
  };
}

export async function fetchJapanCameras(): Promise<any[]> {
  const cams: any[] = [];

  // JARTIC national highway open camera data
  // Image URLs come from the API response and are used as-is.
  try {
    const res = await fetch(
      'https://www.jartic.or.jp/d/camera/camera.json',
      { signal: AbortSignal.timeout(12000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.cameras || data || []).slice(0, 1000)) {
        if (!cam.lat || !cam.lon) continue;
        cams.push({
          id: `jp-jartic-${cam.id || cams.length}`,
          lat: cam.lat,
          lng: cam.lon,
          name: cam.name || `Japan Camera ${cam.id}`,
          city: cam.pref || 'Japan',
          country: 'JP',
          feed_url: cam.url || cam.image || '',
          source: 'JARTIC',
        });
      }
    }
  } catch { /* silent */ }

  // Tokyo / Shutoko cameras.
  // www.shutoko.jp is NOT in the allowlist. Windy has webcams covering key
  // Tokyo expressway vantage points — use those where IDs are known.
  // For locations without a Windy ID, external_url points to the Shutoko
  // traffic info page so the node still appears on the map.
  const shutoko = [
    {
      id: 'jp-sht-shinjuku',
      lat: 35.6896, lng: 139.6917,
      name: 'Shutoko C2 – Shinjuku area',
      city: 'Tokyo',
      // Windy webcam covering Shinjuku skyline / C2 corridor
      ...windy('1511515262'),
    },
    {
      id: 'jp-sht-shibuya',
      lat: 35.6580, lng: 139.7016,
      name: 'Shutoko – Shibuya / Ikebukuro JCT area',
      city: 'Tokyo',
      ...windy('1573537594'),
    },
    {
      id: 'jp-sht-tatsumi',
      lat: 35.6311, lng: 139.7451,
      name: 'Shutoko – Tatsumi JCT',
      city: 'Tokyo',
      // No direct Windy ID — external_url to Shutoko traffic info
      external_url: 'https://www.shutoko.jp/use/traffic/jyutai/',
      source: 'Shutoko',
    },
    {
      id: 'jp-sht-haneda',
      lat: 35.5494, lng: 139.7798,
      name: 'Shutoko – Haneda ramp',
      city: 'Tokyo',
      external_url: 'https://www.shutoko.jp/use/traffic/jyutai/',
      source: 'Shutoko',
    },
    {
      id: 'jp-osaka-umeda',
      lat: 34.6937, lng: 135.5023,
      name: 'Hanshin Exp – Umeda',
      city: 'Osaka',
      external_url: 'https://www.hanshin-exp.co.jp/drivers/douro/camera/',
      source: 'Hanshin Exp',
    },
    {
      id: 'jp-osaka-tennoji',
      lat: 34.6501, lng: 135.5050,
      name: 'Hanshin Exp – Tennoji',
      city: 'Osaka',
      external_url: 'https://www.hanshin-exp.co.jp/drivers/douro/camera/',
      source: 'Hanshin Exp',
    },
    {
      id: 'jp-nagoya-kanayama',
      lat: 35.1815, lng: 136.9066,
      name: 'Nagoya Exp – Kanayama',
      city: 'Nagoya',
      external_url: 'https://www.nagoya-expressway.or.jp/douro/camera/',
      source: 'Nagoya Exp',
    },
    {
      id: 'jp-sapporo-doto',
      lat: 43.0618, lng: 141.3545,
      name: 'Doto Expressway – Sapporo',
      city: 'Sapporo',
      external_url: 'https://www.doto.co.jp/',
      source: 'Doto Exp',
    },
  ];

  for (const c of shutoko) {
    if (!cams.find(x => x.id === c.id)) cams.push({ ...c, country: 'JP' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
