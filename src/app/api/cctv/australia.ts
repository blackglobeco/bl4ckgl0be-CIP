// ── Australia: VicRoads (Victoria) + Transport for NSW ──────────────────────

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
          feed_url: props.imageUrl || props.feed_url || '',
          source: 'VicRoads',
        });
      }
    }
  } catch { /* silent */ }

  // Queensland (TMR) curated public cameras
  const qldCams = [
    { id: 'qld-1', lat: -27.4698, lng: 153.0251, name: 'Brisbane CBD – George St', city: 'Brisbane', feed_url: 'https://livestreams.tmr.qld.gov.au/camimages/bnegeorge.jpg' },
    { id: 'qld-2', lat: -27.4820, lng: 153.0111, name: 'Brisbane – Coronation Dr', city: 'Brisbane', feed_url: 'https://livestreams.tmr.qld.gov.au/camimages/bnecoronation.jpg' },
    { id: 'qld-3', lat: -27.4753, lng: 153.0162, name: 'Inner City Bypass – Kelvin Grove', city: 'Brisbane', feed_url: 'https://livestreams.tmr.qld.gov.au/camimages/icbkelvin.jpg' },
  ];
  for (const c of qldCams) cams.push({ ...c, country: 'Australia', source: 'TMR Queensland' });

  return cams.filter((c: any) => c.lat && c.lng);
}
