// ── Austin, TX – Austin Transportation & Mobility (cctv.austinmobility.io) ──
// Proxy host: cctv.austinmobility.io (already in _CCTV_PROXY_ALLOWED_HOSTS)

export async function fetchAustinCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Austin open data portal – traffic cameras (Socrata)
  try {
    const res = await fetch(
      'https://data.austintexas.gov/resource/b4k4-adkb.json?$limit=500',
      { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || [])) {
        const lat = parseFloat(cam.location?.latitude ?? cam.latitude ?? '');
        const lng = parseFloat(cam.location?.longitude ?? cam.longitude ?? '');
        if (!lat || !lng) continue;
        const camId = cam.camera_id || cam.cameraId || cam.id || '';
        cams.push({
          id: `atx-${camId || cams.length}`,
          lat, lng,
          name: cam.camera_name || cam.location_name || cam.primary_st || 'Austin Camera',
          city: 'Austin',
          country: 'US',
          // cctv.austinmobility.io is on the proxy allowlist
          feed_url: camId
            ? `https://cctv.austinmobility.io/image/${camId}.jpg`
            : '',
          source: 'Austin Mobility',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback – known Austin CCTV camera IDs from public feed
  if (cams.length === 0) {
    const curated = [
      { id: 'atx-1', lat: 30.2672, lng: -97.7431, name: 'I-35 at 6th St', feed_url: 'https://cctv.austinmobility.io/image/1.jpg' },
      { id: 'atx-2', lat: 30.2747, lng: -97.7404, name: 'I-35 at 12th St', feed_url: 'https://cctv.austinmobility.io/image/2.jpg' },
      { id: 'atx-3', lat: 30.2849, lng: -97.7341, name: 'US-183 at Airport Blvd', feed_url: 'https://cctv.austinmobility.io/image/3.jpg' },
      { id: 'atx-4', lat: 30.2500, lng: -97.8000, name: 'MoPac at Slaughter Ln', feed_url: 'https://cctv.austinmobility.io/image/4.jpg' },
      { id: 'atx-5', lat: 30.3030, lng: -97.7560, name: 'TX-1 Loop – North Austin', feed_url: 'https://cctv.austinmobility.io/image/5.jpg' },
      { id: 'atx-6', lat: 30.2212, lng: -97.7714, name: 'SH-71 at Ben White Blvd', feed_url: 'https://cctv.austinmobility.io/image/6.jpg' },
      { id: 'atx-7', lat: 30.2621, lng: -97.7484, name: 'Congress Ave at Town Lake', feed_url: 'https://cctv.austinmobility.io/image/7.jpg' },
      { id: 'atx-8', lat: 30.2360, lng: -97.8090, name: 'William Cannon at MoPac', feed_url: 'https://cctv.austinmobility.io/image/8.jpg' },
    ];
    for (const c of curated) cams.push({ ...c, city: 'Austin', country: 'US', source: 'Austin Mobility' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
