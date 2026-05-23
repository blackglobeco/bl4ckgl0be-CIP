// ── New Zealand: NZTA (Waka Kotahi) + Auckland Transport ─────────────────────
// Allowlist audit:
//   api.nzta.govt.nz        → data fetch only; image URLs from API as-is
//   data.at.govt.nz         → data fetch only
//   infovision.nzta.govt.nz → NOT in allowlist → cannot proxy images
// Fix: curated fallback uses external_url pointing to the NZTA traffic map.

export async function fetchNewZealandCameras(): Promise<any[]> {
  const cams: any[] = [];

  // NZTA Traffic & Travel Info API – cameras
  // feed_url comes from API response; accepted as-is (host only known at runtime)
  try {
    const res = await fetch(
      'https://api.nzta.govt.nz/v1/trafficcameras',
      {
        signal: AbortSignal.timeout(10000),
        headers: {
          Accept: 'application/json',
          'Ocp-Apim-Subscription-Key': process.env.NZTA_API_KEY || '',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.cameras || data || [])) {
        if (!cam.lat || !cam.lng) continue;
        cams.push({
          id: `nz-nzta-${cam.id || cams.length}`,
          lat: cam.lat, lng: cam.lng,
          name: cam.title || cam.name || 'NZTA Camera',
          city: cam.region || 'New Zealand',
          country: 'NZ',
          feed_url: cam.imageUrl || cam.image || '',
          source: 'NZTA',
        });
      }
    }
  } catch { /* silent */ }

  // Auckland Transport open data
  try {
    const res = await fetch(
      'https://data.at.govt.nz/v2/trafficcameras?limit=500',
      { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.response?.features || [])) {
        const coords = cam.geometry?.coordinates;
        if (!coords) continue;
        const [lng, lat] = coords;
        const props = cam.properties || {};
        cams.push({
          id: `nz-at-${props.id || cams.length}`,
          lat, lng,
          name: props.name || 'AT Camera',
          city: 'Auckland',
          country: 'NZ',
          feed_url: props.imageUrl || '',
          source: 'Auckland Transport',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback.
  // infovision.nzta.govt.nz is NOT in _CCTV_PROXY_ALLOWED_HOSTS.
  // Use external_url → NZTA Journey Planner / traffic map so nodes remain on map.
  if (cams.length === 0) {
    const curated = [
      {
        id: 'nz-akl-1', lat: -36.8485, lng: 174.7633,
        name: 'Auckland – Harbour Bridge', city: 'Auckland',
        external_url: 'https://www.journeys.nzta.govt.nz/traffic/cameras',
      },
      {
        id: 'nz-akl-2', lat: -36.8713, lng: 174.7658,
        name: 'Auckland – Spaghetti Junction', city: 'Auckland',
        external_url: 'https://www.journeys.nzta.govt.nz/traffic/cameras',
      },
      {
        id: 'nz-wlg-1', lat: -41.2865, lng: 174.7762,
        name: 'Wellington – Terrace Tunnel', city: 'Wellington',
        external_url: 'https://www.journeys.nzta.govt.nz/traffic/cameras',
      },
      {
        id: 'nz-chc-1', lat: -43.5321, lng: 172.6362,
        name: 'Christchurch – Memorial Ave', city: 'Christchurch',
        external_url: 'https://www.journeys.nzta.govt.nz/traffic/cameras',
      },
    ];
    for (const c of curated) cams.push({ ...c, country: 'NZ', source: 'NZTA' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
