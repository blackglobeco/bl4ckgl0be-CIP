// ── Ireland: TII (Transport Infrastructure Ireland) + Dublin City Council ─────
// Allowlist audit:
//   trafficwatch.ie → NOT in _CCTV_PROXY_ALLOWED_HOSTS → external_url only
//   data.smartdublin.ie → data fetch only; image URLs from API accepted as-is

export async function fetchIrelandCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Dublin City Council open CCTV / traffic cam data (Socrata)
  // Image URLs returned by the API are used as-is (host only known at runtime)
  try {
    const res = await fetch(
      'https://data.smartdublin.ie/dataset/traffic-cameras/resource/cctv-cameras.json',
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.result?.records || data || [])) {
        if (!cam.latitude || !cam.longitude) continue;
        cams.push({
          id: `ie-dcc-${cam._id || cams.length}`,
          lat: parseFloat(cam.latitude),
          lng: parseFloat(cam.longitude),
          name: cam.location || cam.name || 'Dublin Camera',
          city: 'Dublin',
          country: 'IE',
          feed_url: cam.image_url || cam.url || '',
          source: 'Dublin CC',
        });
      }
    }
  } catch { /* silent */ }

  // Curated TII / national road cameras.
  // trafficwatch.ie is NOT in _CCTV_PROXY_ALLOWED_HOSTS — cannot serve
  // feed_url through the proxy. Set external_url so the node is visible on
  // the map and users can open the TII camera page directly.
  const curated = [
    {
      id: 'ie-m50-1', lat: 53.3244, lng: -6.3756,
      name: 'M50 – Ballymount Interchange', city: 'Dublin',
      external_url: 'https://www.tii.ie/tii-library/public-road-data/traffic-data/cctv-cameras/',
    },
    {
      id: 'ie-m50-2', lat: 53.3498, lng: -6.3322,
      name: 'M50 – Red Cow Interchange', city: 'Dublin',
      external_url: 'https://www.tii.ie/tii-library/public-road-data/traffic-data/cctv-cameras/',
    },
    {
      id: 'ie-m1-1', lat: 53.5503, lng: -6.2024,
      name: 'M1 – Balbriggan', city: 'Balbriggan',
      external_url: 'https://www.tii.ie/tii-library/public-road-data/traffic-data/cctv-cameras/',
    },
    {
      id: 'ie-n7-1', lat: 53.2910, lng: -6.4411,
      name: 'N7 – Citywest', city: 'Dublin',
      external_url: 'https://www.tii.ie/tii-library/public-road-data/traffic-data/cctv-cameras/',
    },
    {
      id: 'ie-cork-1', lat: 51.8985, lng: -8.4756,
      name: 'Cork – Jack Lynch Tunnel', city: 'Cork',
      external_url: 'https://www.tii.ie/tii-library/public-road-data/traffic-data/cctv-cameras/',
    },
    {
      id: 'ie-galway-1', lat: 53.2707, lng: -9.0568,
      name: 'Galway – N6 Galway Bypass', city: 'Galway',
      external_url: 'https://www.tii.ie/tii-library/public-road-data/traffic-data/cctv-cameras/',
    },
  ];
  for (const c of curated) {
    if (!cams.find(x => x.id === c.id)) {
      cams.push({ ...c, country: 'IE', source: 'TII Ireland' });
    }
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
