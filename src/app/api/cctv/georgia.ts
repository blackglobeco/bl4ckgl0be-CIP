// ── Georgia DOT – GDOT Navigator CCTV (snapshots + HLS) ─────────────────────
// Proxy hosts: navigator-c2c.dot.ga.gov, navigator-c2c.ga.gov,
//              navigator-csc.dot.ga.gov, vss1-5live.dot.ga.gov, 511ga.org
// All on _CCTV_PROXY_ALLOWED_HOSTS — snapshot and HLS stream_url both proxied.

export async function fetchGeorgiaCameras(): Promise<any[]> {
  const cams: any[] = [];

  // GDOT Navigator open API – camera list with locations
  try {
    const res = await fetch(
      'https://navigator-c2c.dot.ga.gov/api/v1/cameras?format=json',
      { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      const list = data?.cameras || data?.features || data || [];
      for (const cam of list) {
        const props = cam.properties || cam;
        const coords = cam.geometry?.coordinates;
        const lat = coords ? coords[1] : parseFloat(props.latitude ?? props.lat ?? '');
        const lng = coords ? coords[0] : parseFloat(props.longitude ?? props.lng ?? '');
        if (!lat || !lng) continue;

        const camId  = props.cameraId || props.camera_id || props.id || '';
        // Snapshot: navigator-csc.dot.ga.gov serves static JPEG snapshots
        const snapUrl = camId
          ? `https://navigator-csc.dot.ga.gov/snapshots/${camId}.jpg`
          : props.imageUrl || '';
        // HLS: vss hosts serve live .m3u8 — distributed across vss1–vss5
        const vssHost = `vss${((parseInt(String(camId).replace(/\D/g, '') || '1')) % 5) + 1}live.dot.ga.gov`;
        const hlsUrl  = camId
          ? `https://${vssHost}/live/${camId}/index.m3u8`
          : '';

        cams.push({
          id: `gdot-${camId || cams.length}`,
          lat, lng,
          name: props.description || props.name || props.location || `GDOT Camera ${camId}`,
          city: props.county || props.city || 'Georgia',
          country: 'US',
          feed_url: snapUrl,
          stream_url: hlsUrl,
          stream_type: hlsUrl ? 'hls' : 'jpg',
          source: 'GDOT Navigator',
        });
      }
    }
  } catch { /* silent */ }

  // 511ga.org – alternate Georgia 511 image feed (already on allowlist)
  try {
    const res = await fetch(
      'https://511ga.org/api/v2/get/cameras',
      { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || [])) {
        if (!cam.Latitude || !cam.Longitude) continue;
        const existing = cams.find(c => Math.abs(c.lat - cam.Latitude) < 0.001 && Math.abs(c.lng - cam.Longitude) < 0.001);
        if (existing) continue; // de-duplicate against GDOT Navigator data
        cams.push({
          id: `ga511-${cam.Id || cams.length}`,
          lat: cam.Latitude, lng: cam.Longitude,
          name: cam.Location || cam.Description || 'Georgia 511 Camera',
          city: cam.County || 'Georgia',
          country: 'US',
          feed_url: cam.Views?.[0]?.Url
            ? `https://511ga.org${cam.Views[0].Url.startsWith('/') ? '' : '/'}${cam.Views[0].Url}`
            : '',
          source: 'Georgia 511',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback – Atlanta metro key corridors
  if (cams.length === 0) {
    const curated = [
      { id: 'ga-i285-1', lat: 33.7490, lng: -84.3880, name: 'I-285 at I-85 North (Spaghetti Junction)', city: 'Atlanta', feed_url: 'https://511ga.org/cctv/i285_i85n.jpg' },
      { id: 'ga-i75-1', lat: 33.8390, lng: -84.3740, name: 'I-75 North – Marietta', city: 'Marietta', feed_url: 'https://511ga.org/cctv/i75n_marietta.jpg' },
      { id: 'ga-i20-1', lat: 33.7490, lng: -84.5000, name: 'I-20 West – Fulton Industrial', city: 'Atlanta', feed_url: 'https://511ga.org/cctv/i20w_fulton.jpg' },
      { id: 'ga-i85-1', lat: 33.6800, lng: -84.4220, name: 'I-85 South – College Park', city: 'College Park', feed_url: 'https://511ga.org/cctv/i85s_college_park.jpg' },
      { id: 'ga-ga400-1', lat: 33.9310, lng: -84.3350, name: 'GA-400 – North Springs', city: 'Sandy Springs', feed_url: 'https://511ga.org/cctv/ga400_nsprings.jpg' },
      { id: 'ga-i16-1', lat: 32.0835, lng: -81.0998, name: 'I-16 at Savannah', city: 'Savannah', feed_url: 'https://511ga.org/cctv/i16_savannah.jpg' },
    ];
    for (const c of curated) cams.push({ ...c, country: 'US', source: 'GDOT Navigator' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
