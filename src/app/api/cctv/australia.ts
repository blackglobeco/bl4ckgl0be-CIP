// ── Australia: VicRoads (Victoria) + Transport for NSW ───────────────────────
// NOTE: No Australian image hosts are in _CCTV_PROXY_ALLOWED_HOSTS.
// feed_url values are left empty and external_url is set for browser-side
// fallback (user opens directly). The dynamic API fetches may return proxiable
// URLs at runtime — those are forwarded as-is and handled by the CameraViewer.

export async function fetchAustraliaCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Transport for NSW – live traffic cameras (~600+)
  try {
    const res = await fetch(
      'https://api.transport.nsw.gov.au/v1/live/cameras',
      {
        signal: AbortSignal.timeout(12000),
        headers: {
          Accept: 'application/json',
          Authorization: `apikey ${process.env.TfNSW_API_KEY || ''}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.cameras || data || [])) {
        if (!cam.lat || !cam.lng) continue;
        cams.push({
          id: `nsw-${cam.id || cams.length}`,
          lat: cam.lat,
          lng: cam.lng,
          name: cam.title || cam.name || 'NSW Camera',
          city: 'New South Wales',
          country: 'Australia',
          // feed_url comes from the API response at runtime; kept as-is
          feed_url: cam.href || cam.imageUrl || '',
          source: 'Transport NSW',
        });
      }
    }
  } catch { /* silent */ }

  // VicRoads open data – static snapshots
  try {
    const res = await fetch(
      'https://traffic.vicroads.vic.gov.au/api/cameras',
      { signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.features || data || [])) {
        const props = cam.properties || cam;
        const coords = cam.geometry?.coordinates;
        const lat = coords ? coords[1] : props.latitude;
        const lng = coords ? coords[0] : props.longitude;
        if (!lat || !lng) continue;
        cams.push({
          id: `vic-${props.cameraId || cams.length}`,
          lat,
          lng,
          name: props.cameraName || props.description || 'VicRoads Camera',
          city: 'Victoria',
          country: 'Australia',
          // feed_url from API response; not pre-known so accepted as-is
          feed_url: props.imageUrl || props.feed_url || '',
          source: 'VicRoads',
        });
      }
    }
  } catch { /* silent */ }

  // Queensland (TMR) – livestreams.tmr.qld.gov.au is NOT in the proxy allowlist.
  // Use external_url so the CameraViewer can open the TMR page directly in a
  // new tab rather than attempting a proxied image load that would be blocked.
  const qldCams = [
    {
      id: 'qld-1', lat: -27.4698, lng: 153.0251,
      name: 'Brisbane CBD – George St', city: 'Brisbane',
      external_url: 'https://www.tmr.qld.gov.au/Travel-and-transport/Traffic-and-travel-information/Webcams/Brisbane/George-Street',
    },
    {
      id: 'qld-2', lat: -27.4820, lng: 153.0111,
      name: 'Brisbane – Coronation Dr', city: 'Brisbane',
      external_url: 'https://www.tmr.qld.gov.au/Travel-and-transport/Traffic-and-travel-information/Webcams/Brisbane/Coronation-Drive',
    },
    {
      id: 'qld-3', lat: -27.4753, lng: 153.0162,
      name: 'Inner City Bypass – Kelvin Grove', city: 'Brisbane',
      external_url: 'https://www.tmr.qld.gov.au/Travel-and-transport/Traffic-and-travel-information/Webcams/Brisbane/Inner-City-Bypass',
    },
  ];
  for (const c of qldCams) {
    cams.push({ ...c, country: 'Australia', source: 'TMR Queensland' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
