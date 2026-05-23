// ── Czech Republic: NDIC (National Traffic Information Centre) + RSD ─────────
// Allowlist audit:
//   dopravniinfo.cz    → data fetch only (not a media host)
//   kamery.rsd.cz      → NOT in allowlist → feed_url removed, external_url set

export async function fetchCzechCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Czech NDIC open traffic data – camera list
  // Image URLs returned by the API may be on any host; they are used as-is
  // since the actual hosts are only known at runtime.
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
          // URL comes from API response; accepted as-is (host unknown at build time)
          feed_url: cam.url || cam.imageUrl || '',
          source: 'NDIC CZ',
        });
      }
    }
  } catch { /* silent */ }

  // Curated Czech highway cameras.
  // kamery.rsd.cz is NOT in _CCTV_PROXY_ALLOWED_HOSTS, so we cannot use it
  // as feed_url. Point to the public RSD camera viewer page via external_url
  // so users can open it in a new tab.
  const curated = [
    {
      id: 'cz-d1-01', lat: 49.9958, lng: 14.6128,
      name: 'D1 km 5 – Praha–Brno', city: 'Praha',
      external_url: 'https://kamery.rsd.cz/weby/kamery/index.aspx#d1km005',
    },
    {
      id: 'cz-d1-02', lat: 49.7488, lng: 16.1528,
      name: 'D1 km 160 – Svitavy', city: 'Svitavy',
      external_url: 'https://kamery.rsd.cz/weby/kamery/index.aspx#d1km160',
    },
    {
      id: 'cz-d1-03', lat: 49.3031, lng: 16.6142,
      name: 'D1 km 196 – Brno', city: 'Brno',
      external_url: 'https://kamery.rsd.cz/weby/kamery/index.aspx#d1km196',
    },
    {
      id: 'cz-d8-01', lat: 50.5560, lng: 14.0430,
      name: 'D8 – Lovosice (border area)', city: 'Lovosice',
      external_url: 'https://kamery.rsd.cz/weby/kamery/index.aspx#d8km070',
    },
    {
      id: 'cz-d5-01', lat: 49.9006, lng: 13.4820,
      name: 'D5 – Plzeň–Germany', city: 'Plzeň',
      external_url: 'https://kamery.rsd.cz/weby/kamery/index.aspx#d5km090',
    },
    {
      id: 'cz-prague-1', lat: 50.0755, lng: 14.4378,
      name: 'Praha – Nuselský Bridge', city: 'Praha',
      external_url: 'https://kamery.rsd.cz/weby/kamery/index.aspx',
    },
  ];
  for (const c of curated) {
    if (!cams.find(x => x.id === c.id)) {
      cams.push({ ...c, country: 'CZ', source: 'RSD CZ' });
    }
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
