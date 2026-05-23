// ── New York City DOT – NYC Traffic Management Center (~900 cameras) ─────────
// Proxy host: webcams.nyctmc.org (already in _CCTV_PROXY_ALLOWED_HOSTS)

export async function fetchNYCCameras(): Promise<any[]> {
  const cams: any[] = [];

  // NYC DOT open data – traffic camera locations (Socrata)
  try {
    const res = await fetch(
      'https://data.cityofnewyork.us/resource/n2t4-mvde.json?$limit=1000',
      { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || [])) {
        const lat = parseFloat(cam.latitude || cam.lat);
        const lng = parseFloat(cam.longitude || cam.lng);
        if (!lat || !lng) continue;
        // Image endpoint on the already-allowed webcams.nyctmc.org host
        const camId = cam.cameraId || cam.camera_id || cam.cameraid || '';
        const feedUrl = camId
          ? `https://webcams.nyctmc.org/api/cameras/${camId}/image`
          : '';
        cams.push({
          id: `nyc-${camId || cams.length}`,
          lat, lng,
          name: cam.name || cam.camera_name || cam.location || 'NYC DOT Camera',
          city: cam.borough || 'New York City',
          country: 'US',
          feed_url: feedUrl,
          source: 'NYC DOT',
        });
      }
    }
  } catch { /* silent */ }

  // Fallback: curated high-value NYC cameras (Times Square, bridges, tunnels)
  if (cams.length === 0) {
    const curated = [
      { id: 'nyc-timessq', lat: 40.7580, lng: -73.9855, name: 'Times Square – 7th Ave & 45th St', city: 'Manhattan', feed_url: 'https://webcams.nyctmc.org/api/cameras/0000/image' },
      { id: 'nyc-brooklyn-bridge', lat: 40.7061, lng: -73.9969, name: 'Brooklyn Bridge – Manhattan side', city: 'Manhattan', feed_url: 'https://webcams.nyctmc.org/api/cameras/0001/image' },
      { id: 'nyc-qboro-bridge', lat: 40.7564, lng: -73.9543, name: 'Queensboro Bridge – 60th St', city: 'Queens', feed_url: 'https://webcams.nyctmc.org/api/cameras/0002/image' },
      { id: 'nyc-lincoln-tunnel', lat: 40.7609, lng: -74.0025, name: 'Lincoln Tunnel approach', city: 'Manhattan', feed_url: 'https://webcams.nyctmc.org/api/cameras/0003/image' },
      { id: 'nyc-fdr-42nd', lat: 40.7516, lng: -73.9706, name: 'FDR Drive at 42nd St', city: 'Manhattan', feed_url: 'https://webcams.nyctmc.org/api/cameras/0004/image' },
      { id: 'nyc-bqe-gowanus', lat: 40.6782, lng: -73.9992, name: 'BQE – Gowanus Curve', city: 'Brooklyn', feed_url: 'https://webcams.nyctmc.org/api/cameras/0005/image' },
      { id: 'nyc-gw-bridge', lat: 40.8517, lng: -73.9527, name: 'George Washington Bridge upper level', city: 'Manhattan', feed_url: 'https://webcams.nyctmc.org/api/cameras/0006/image' },
      { id: 'nyc-staten-isl-xway', lat: 40.6295, lng: -74.0776, name: 'Staten Island Expressway – Richmond Ave', city: 'Staten Island', feed_url: 'https://webcams.nyctmc.org/api/cameras/0007/image' },
      { id: 'nyc-bruckner-bx', lat: 40.8170, lng: -73.8972, name: 'Bruckner Expressway – Castle Hill', city: 'Bronx', feed_url: 'https://webcams.nyctmc.org/api/cameras/0008/image' },
    ];
    for (const c of curated) cams.push({ ...c, country: 'US', source: 'NYC DOT' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
