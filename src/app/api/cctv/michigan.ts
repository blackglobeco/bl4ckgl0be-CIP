// ── Michigan DOT – MDOT Traffic Cameras ──────────────────────────────────────
// Proxy hosts: mdotjboss.state.mi.us, micamerasimages.net
// Both on _CCTV_PROXY_ALLOWED_HOSTS with profile "michigan-dot"

export async function fetchMichiganCameras(): Promise<any[]> {
  const cams: any[] = [];

  // MDOT open data – camera feed (GeoJSON)
  try {
    const res = await fetch(
      'https://mdotjboss.state.mi.us/MiDrive/map/getAllCameras',
      { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      const list = data?.cameraList || data?.cameras || data || [];
      for (const cam of list) {
        const lat = parseFloat(cam.latitude || cam.lat || '');
        const lng = parseFloat(cam.longitude || cam.lon || cam.lng || '');
        if (!lat || !lng) continue;

        const camId = cam.cameraId || cam.camera_id || cam.id || '';
        // micamerasimages.net serves the actual JPEG images
        const feedUrl = cam.imageUrl
          || (camId ? `https://micamerasimages.net/${camId}.jpg` : '');

        cams.push({
          id: `mi-${camId || cams.length}`,
          lat, lng,
          name: cam.description || cam.name || cam.location || `MDOT Camera ${camId}`,
          city: cam.city || cam.county || 'Michigan',
          country: 'US',
          feed_url: feedUrl,
          source: 'MDOT',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback – Detroit metro + major corridors
  if (cams.length === 0) {
    const curated = [
      { id: 'mi-i94-det-1', lat: 42.3314, lng: -83.0458, name: 'I-94 – Detroit / I-75 interchange', city: 'Detroit', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=1' },
      { id: 'mi-i75-det-1', lat: 42.3550, lng: -83.0680, name: 'I-75 NB – Detroit Downtown', city: 'Detroit', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=2' },
      { id: 'mi-i96-lans-1', lat: 42.7325, lng: -84.5555, name: 'I-96 – Lansing (Capital Circle)', city: 'Lansing', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=3' },
      { id: 'mi-i196-gr-1', lat: 42.9634, lng: -85.6681, name: 'I-196 – Grand Rapids', city: 'Grand Rapids', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=4' },
      { id: 'mi-us23-aa-1', lat: 42.2808, lng: -83.7430, name: 'US-23 – Ann Arbor (Washtenaw)', city: 'Ann Arbor', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=5' },
      { id: 'mi-i69-flint-1', lat: 43.0125, lng: -83.6875, name: 'I-69 – Flint (Dort Hwy)', city: 'Flint', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=6' },
      { id: 'mi-i275-novi-1', lat: 42.4755, lng: -83.4822, name: 'I-275 – Novi / 12 Mile Rd', city: 'Novi', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=7' },
      { id: 'mi-m10-det-1', lat: 42.3825, lng: -83.1042, name: 'M-10 Lodge Freeway – Detroit', city: 'Detroit', feed_url: 'https://mdotjboss.state.mi.us/MiDrive/getCameraImage?cameraId=8' },
    ];
    for (const c of curated) cams.push({ ...c, country: 'US', source: 'MDOT' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
