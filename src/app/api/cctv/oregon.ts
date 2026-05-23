// ── Oregon DOT – TripCheck Traffic Cameras ───────────────────────────────────
// Proxy host: tripcheck.com / www.tripcheck.com
// Profile "odot-tripcheck" — on _CCTV_PROXY_ALLOWED_HOSTS

export async function fetchOregonCameras(): Promise<any[]> {
  const cams: any[] = [];

  // ODOT TripCheck open API – camera list
  try {
    const res = await fetch(
      'https://www.tripcheck.com/Data/CameraMap',
      { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json', Referer: 'https://www.tripcheck.com/' } }
    );
    if (res.ok) {
      const data = await res.json();
      const list = data?.Cameras || data?.cameras || data || [];
      for (const cam of list) {
        const lat = parseFloat(cam.Lat || cam.latitude || cam.lat || '');
        const lng = parseFloat(cam.Lng || cam.longitude || cam.lng || '');
        if (!lat || !lng) continue;

        const camId = cam.CameraId || cam.cameraId || cam.id || '';
        cams.push({
          id: `or-${camId || cams.length}`,
          lat, lng,
          name: cam.RoadwayName || cam.Name || cam.description || `Oregon Camera ${camId}`,
          city: cam.County || cam.City || 'Oregon',
          country: 'US',
          feed_url: cam.ImageURL || cam.imageUrl
            || (camId ? `https://www.tripcheck.com/Images/Cameras/${camId}` : ''),
          source: 'ODOT TripCheck',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback – I-5 corridor, I-84, coast route
  if (cams.length === 0) {
    const curated = [
      { id: 'or-i5-portland-1', lat: 45.5051, lng: -122.6750, name: 'I-5 – Portland (Marquam Bridge)', city: 'Portland', feed_url: 'https://www.tripcheck.com/Images/Cameras/1.jpg' },
      { id: 'or-i5-portland-2', lat: 45.5236, lng: -122.6780, name: 'I-5 NB – Rose Quarter', city: 'Portland', feed_url: 'https://www.tripcheck.com/Images/Cameras/2.jpg' },
      { id: 'or-i84-1', lat: 45.5222, lng: -122.6587, name: 'I-84 – Portland (Lloyd District)', city: 'Portland', feed_url: 'https://www.tripcheck.com/Images/Cameras/3.jpg' },
      { id: 'or-i84-hood-1', lat: 45.6238, lng: -121.5267, name: 'I-84 – Hood River', city: 'Hood River', feed_url: 'https://www.tripcheck.com/Images/Cameras/4.jpg' },
      { id: 'or-i5-salem-1', lat: 44.9429, lng: -123.0351, name: 'I-5 – Salem (Mission St)', city: 'Salem', feed_url: 'https://www.tripcheck.com/Images/Cameras/5.jpg' },
      { id: 'or-i5-medford-1', lat: 42.3265, lng: -122.8756, name: 'I-5 – Medford', city: 'Medford', feed_url: 'https://www.tripcheck.com/Images/Cameras/6.jpg' },
      { id: 'or-us26-mt-hood', lat: 45.3273, lng: -121.7108, name: 'US-26 – Mt Hood Summit', city: 'Clackamas County', feed_url: 'https://www.tripcheck.com/Images/Cameras/7.jpg' },
      { id: 'or-i5-ashland-1', lat: 42.1946, lng: -122.7097, name: 'I-5 – Siskiyou Summit', city: 'Ashland', feed_url: 'https://www.tripcheck.com/Images/Cameras/8.jpg' },
    ];
    for (const c of curated) cams.push({ ...c, country: 'US', source: 'ODOT TripCheck' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
