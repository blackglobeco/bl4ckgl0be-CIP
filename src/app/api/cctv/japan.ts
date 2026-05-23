// ── Japan: Shutoko Highway + MLIT open data cameras ─────────────────────────

export async function fetchJapanCameras(): Promise<any[]> {
  const cams: any[] = [];

  // MLIT G-XML road cameras (National Highway open data)
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

  // Curated Shutoko (Tokyo expressway) known public camera endpoints
  const shutoko = [
    { id: 'jp-sht-1', lat: 35.6762, lng: 139.6503, name: 'Shutoko C2 – Shinjuku', city: 'Tokyo', feed_url: 'https://www.shutoko.jp/use/traffic/jyutai/images/cam/c2_shinjuku.jpg' },
    { id: 'jp-sht-2', lat: 35.6580, lng: 139.7016, name: 'Shutoko S1 – Ikebukuro JCT', city: 'Tokyo', feed_url: 'https://www.shutoko.jp/use/traffic/jyutai/images/cam/s1_ikebukuro.jpg' },
    { id: 'jp-sht-3', lat: 35.6311, lng: 139.7451, name: 'Shutoko – Tatsumi JCT', city: 'Tokyo', feed_url: 'https://www.shutoko.jp/use/traffic/jyutai/images/cam/tatsumi.jpg' },
    { id: 'jp-sht-4', lat: 35.5494, lng: 139.7798, name: 'Shutoko – Haneda ramp', city: 'Tokyo', feed_url: 'https://www.shutoko.jp/use/traffic/jyutai/images/cam/haneda.jpg' },
    { id: 'jp-osaka-1', lat: 34.6937, lng: 135.5023, name: 'Hanshin Exp – Umeda', city: 'Osaka', feed_url: '' },
    { id: 'jp-osaka-2', lat: 34.6501, lng: 135.5050, name: 'Hanshin Exp – Tennoji', city: 'Osaka', feed_url: '' },
    { id: 'jp-nagoya-1', lat: 35.1815, lng: 136.9066, name: 'Nagoya Exp – Kanayama', city: 'Nagoya', feed_url: '' },
    { id: 'jp-sapporo-1', lat: 43.0618, lng: 141.3545, name: 'Doto Expressway – Sapporo', city: 'Sapporo', feed_url: '' },
  ];
  for (const c of shutoko) {
    if (!cams.find(x => x.id === c.id)) cams.push({ ...c, country: 'JP', source: 'Shutoko' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
