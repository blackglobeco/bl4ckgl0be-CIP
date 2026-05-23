// ── US Extended: Nevada, Utah, Minnesota, Texas ───────────────────────────────
// Allowlist audit:
//   www.nvroads.com              → NOT in _CCTV_PROXY_ALLOWED_HOSTS
//   www.udottraffic.utah.gov     → NOT in allowlist
//   cotrip.org (root)            → NOT in allowlist
//     publicstreamer1-4.cotrip.org → ALLOWED (HLS streams)
//     cocam.carsprogram.org        → ALLOWED (JPEG previews)
//   511mn.org                    → NOT in allowlist
//   traffic.tmc.txdot.gov        → NOT in allowlist
//
// Strategy per source:
//   Nevada   → API fetch for metadata; image URLs from Views[].Url accepted as-is
//              (actual image host from API response — only known at runtime)
//   Utah     → same pattern
//   Colorado → already handled correctly in colorado.ts (publicstreamer + cocam)
//   Minnesota → API fetch; image URLs as-is from runtime response
//   Texas    → API fetch; image URLs as-is from runtime response
//
// For curated fallbacks where the image host IS known and NOT allowlisted,
// we use external_url so the node still appears on the map.

export async function fetchUSExtendedCameras(): Promise<any[]> {
  const cams: any[] = [];

  // ── Nevada 511 (NDOT) ───────────────────────────────────────────────────────
  // www.nvroads.com is not allowlisted, but the Views[].Url image URLs it
  // returns often point to an allowlisted CDN (e.g. images.wsdot.wa.gov or
  // similar state DOT hosts). We pass them through and let the proxy gate them.
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
          // URL from API response — host gated by the proxy at request time
          feed_url: cam.Views?.[0]?.Url || '',
          source: 'Nevada 511',
        });
      }
    }
  } catch { /* silent */ }

  // Curated Nevada fallback — no known allowlisted image host; external_url only
  if (!cams.find(c => c.id?.startsWith('nv-'))) {
    const nvCurated = [
      { id: 'nv-las-vegas-strip', lat: 36.1147, lng: -115.1729, name: 'Las Vegas – Strip (I-15)', city: 'Las Vegas', external_url: 'https://nvroads.com/cameras' },
      { id: 'nv-i80-reno', lat: 39.5296, lng: -119.8138, name: 'Reno – I-80 at Virginia St', city: 'Reno', external_url: 'https://nvroads.com/cameras' },
      { id: 'nv-us95-henderson', lat: 36.0395, lng: -114.9817, name: 'Henderson – US-95', city: 'Henderson', external_url: 'https://nvroads.com/cameras' },
    ];
    for (const c of nvCurated) cams.push({ ...c, country: 'US', source: 'Nevada 511' });
  }

  // ── Utah DOT (UDOT Traffic) ──────────────────────────────────────────────────
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

  if (!cams.find(c => c.id?.startsWith('ut-'))) {
    const utCurated = [
      { id: 'ut-i15-slc', lat: 40.7608, lng: -111.8910, name: 'Salt Lake City – I-15 at 600S', city: 'Salt Lake City', external_url: 'https://udottraffic.utah.gov/' },
      { id: 'ut-i80-parley', lat: 40.7236, lng: -111.7960, name: "I-80 – Parley's Canyon", city: 'Salt Lake City', external_url: 'https://udottraffic.utah.gov/' },
      { id: 'ut-i15-provo', lat: 40.2338, lng: -111.6585, name: 'Provo – I-15 at University Ave', city: 'Provo', external_url: 'https://udottraffic.utah.gov/' },
    ];
    for (const c of utCurated) cams.push({ ...c, country: 'US', source: 'UDOT' });
  }

  // ── Minnesota DOT (511mn) ────────────────────────────────────────────────────
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

  if (!cams.find(c => c.id?.startsWith('mn-'))) {
    const mnCurated = [
      { id: 'mn-i35w-mpls', lat: 44.9778, lng: -93.2650, name: 'Minneapolis – I-35W at Washington Ave', city: 'Minneapolis', external_url: 'https://511mn.org/' },
      { id: 'mn-i94-stpaul', lat: 44.9537, lng: -93.0900, name: 'St Paul – I-94 at Marion St', city: 'Saint Paul', external_url: 'https://511mn.org/' },
      { id: 'mn-i494-bloomington', lat: 44.8606, lng: -93.3301, name: 'Bloomington – I-494 at 34th Ave', city: 'Bloomington', external_url: 'https://511mn.org/' },
    ];
    for (const c of mnCurated) cams.push({ ...c, country: 'US', source: '511mn' });
  }

  // ── Texas DOT (TxDOT) ────────────────────────────────────────────────────────
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

  if (!cams.find(c => c.id?.startsWith('tx-'))) {
    const txCurated = [
      { id: 'tx-i35-austin', lat: 30.2672, lng: -97.7431, name: 'Austin – I-35 at 6th St', city: 'Austin', external_url: 'https://traffic.tmc.txdot.gov/' },
      { id: 'tx-i10-houston', lat: 29.7604, lng: -95.3698, name: 'Houston – I-10 at Downtown', city: 'Houston', external_url: 'https://traffic.tmc.txdot.gov/' },
      { id: 'tx-i30-dallas', lat: 32.7767, lng: -96.7970, name: 'Dallas – I-30 at I-35E', city: 'Dallas', external_url: 'https://traffic.tmc.txdot.gov/' },
      { id: 'tx-i410-sanantonio', lat: 29.4241, lng: -98.4936, name: 'San Antonio – I-410 Loop', city: 'San Antonio', external_url: 'https://traffic.tmc.txdot.gov/' },
    ];
    for (const c of txCurated) cams.push({ ...c, country: 'US', source: 'TxDOT' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
