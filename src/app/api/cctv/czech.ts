// ── Czech Republic: NDIC (National Traffic Information Centre) ───────────────

export async function fetchCzechCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Czech NDIC open traffic data – camera list
  try {
    const res = await fetch(
      'https://dopravniinfo.cz/api/cameras.json',
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.cameras || data || [])) {
        if (!cam.lat || !cam.lng) continue;
        cams.push({
          id: `cz-${cam.id || cams.length}`,
          lat: cam.lat, lng: cam.lng,
          name: cam.name || cam.description || 'Czech Camera',
          city: cam.city || 'Czech Republic',
          country: 'CZ',
          feed_url: cam.url || cam.imageUrl || '',
          source: 'NDIC CZ',
        });
      }
    }
  } catch { /* silent */ }

  // Curated Czech highway cameras (D1, D5, D8 open snapshots)
  const curated = [
    { id: 'cz-d1-01', lat: 49.9958, lng: 14.6128, name: 'D1 km 5 – Praha–Brno', city: 'Praha', feed_url: 'https://kamery.rsd.cz/data/1/00001.jpg' },
    { id: 'cz-d1-02', lat: 49.7488, lng: 16.1528, name: 'D1 km 160 – Svitavy', city: 'Svitavy', feed_url: 'https://kamery.rsd.cz/data/1/00160.jpg' },
    { id: 'cz-d1-03', lat: 49.3031, lng: 16.6142, name: 'D1 km 196 – Brno', city: 'Brno', feed_url: 'https://kamery.rsd.cz/data/1/00196.jpg' },
    { id: 'cz-d8-01', lat: 50.5560, lng: 14.0430, name: 'D8 – Lovosice (border area)', city: 'Lovosice', feed_url: 'https://kamery.rsd.cz/data/8/00070.jpg' },
    { id: 'cz-d5-01', lat: 49.9006, lng: 13.4820, name: 'D5 – Plzeň–Germany', city: 'Plzeň', feed_url: 'https://kamery.rsd.cz/data/5/00090.jpg' },
    { id: 'cz-prague-1', lat: 50.0755, lng: 14.4378, name: 'Praha – Nuselský Bridge', city: 'Praha', feed_url: '' },
  ];
  for (const c of curated) {
    if (!cams.find(x => x.id === c.id)) cams.push({ ...c, country: 'CZ', source: 'RSD CZ' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
