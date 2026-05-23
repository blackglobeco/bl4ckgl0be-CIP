// ── US Extended: Nevada, Utah, Colorado, Minnesota, Texas ────────────────────

export async function fetchUSExtendedCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Nevada 511 (NDOT)
  try {
    const res = await fetch('https://www.nvroads.com/api/v2/get/cameras', {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || []).slice(0, 400)) {
        if (!cam.Latitude || !cam.Longitude) continue;
        cams.push({
          id: `nv-${cam.Id || cams.length}`,
          lat: cam.Latitude, lng: cam.Longitude,
          name: cam.Location || 'Nevada Camera',
          city: 'Nevada', country: 'US',
          feed_url: cam.Views?.[0]?.Url || '',
          source: 'Nevada 511',
        });
      }
    }
  } catch { /* silent */ }

  // Utah DOT (UDOT Traffic)
  try {
    const res = await fetch('https://www.udottraffic.utah.gov/api/v1/get/cameras', {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || []).slice(0, 400)) {
        if (!cam.Latitude || !cam.Longitude) continue;
        cams.push({
          id: `ut-${cam.Id || cams.length}`,
          lat: cam.Latitude, lng: cam.Longitude,
          name: cam.Location || cam.CameraName || 'Utah DOT Camera',
          city: 'Utah', country: 'US',
          feed_url: cam.Views?.[0]?.Url || cam.ImageUrl || '',
          source: 'UDOT',
        });
      }
    }
  } catch { /* silent */ }

  // Colorado DOT (CoTrip 511)
  try {
    const res = await fetch('https://cotrip.org/api/v2/get/cameras', {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || []).slice(0, 500)) {
        if (!cam.Latitude || !cam.Longitude) continue;
        cams.push({
          id: `co-${cam.Id || cams.length}`,
          lat: cam.Latitude, lng: cam.Longitude,
          name: cam.Location || 'CDOT Camera',
          city: 'Colorado', country: 'US',
          feed_url: cam.Views?.[0]?.Url || '',
          source: 'CoTrip',
        });
      }
    }
  } catch { /* silent */ }

  // Minnesota DOT (511mn)
  try {
    const res = await fetch('https://511mn.org/api/v2/get/cameras', {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || []).slice(0, 500)) {
        if (!cam.Latitude || !cam.Longitude) continue;
        cams.push({
          id: `mn-${cam.Id || cams.length}`,
          lat: cam.Latitude, lng: cam.Longitude,
          name: cam.Location || 'MnDOT Camera',
          city: 'Minnesota', country: 'US',
          feed_url: cam.Views?.[0]?.Url || '',
          source: '511mn',
        });
      }
    }
  } catch { /* silent */ }

  // Texas DOT (TxDOT) – open GeoJSON camera feed
  try {
    const res = await fetch(
      'https://traffic.tmc.txdot.gov/api/v1/cameras.geojson',
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const feat of (data?.features || []).slice(0, 1000)) {
        const coords = feat.geometry?.coordinates;
        if (!coords) continue;
        const [lng, lat] = coords;
        const props = feat.properties || {};
        cams.push({
          id: `tx-${props.camera_id || props.id || cams.length}`,
          lat, lng,
          name: props.location_name || props.name || 'TxDOT Camera',
          city: props.city || 'Texas', country: 'US',
          feed_url: props.image_url || props.imageUrl || '',
          source: 'TxDOT',
        });
      }
    }
  } catch { /* silent */ }

  return cams.filter((c: any) => c.lat && c.lng);
}
