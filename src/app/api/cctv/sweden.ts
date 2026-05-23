// ── Sweden: Trafikverket Open API ────────────────────────────────────────────

export async function fetchSwedenCameras(): Promise<any[]> {
  const cams: any[] = [];

  try {
    // Trafikverket Open Data API – Camera objects
    const body = JSON.stringify({
      REQUEST: {
        LOGIN: { authenticationkey: process.env.TRAFIKVERKET_API_KEY || 'demo' },
        QUERY: {
          objecttype: 'Camera',
          schemaversion: '1',
          FILTER: { EQ: { name: 'Active', value: 'true' } },
          INCLUDE: ['Id', 'Name', 'IconId', 'Geometry.WGS84', 'PhotoUrl', 'Description'],
        },
      },
    });

    const res = await fetch('https://api.trafikinfo.trafikverket.se/v2/data.json', {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      const cameras = data?.RESPONSE?.RESULT?.[0]?.Camera || [];
      for (const cam of cameras) {
        // WGS84 comes as "POINT (lng lat)"
        const wkt = cam['Geometry.WGS84'] || cam.Geometry?.WGS84 || '';
        const match = wkt.match(/POINT\s*\(([^ ]+)\s+([^ )]+)\)/);
        if (!match) continue;
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        cams.push({
          id: `se-${cam.Id}`,
          lat, lng,
          name: cam.Name || cam.Description || 'Trafikverket Camera',
          city: 'Sweden',
          country: 'SE',
          feed_url: cam.PhotoUrl || '',
          source: 'Trafikverket',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback
  if (cams.length === 0) {
    const curated = [
      { id: 'se-stockholm-1', lat: 59.3293, lng: 18.0686, name: 'Stockholm – Centralbron', city: 'Stockholm', feed_url: 'https://www.trafikverket.se/trafikinformation/vag/?TrafficType=personalTraffic&map=1/18.0686/59.3293' },
      { id: 'se-gothenburg-1', lat: 57.7089, lng: 11.9746, name: 'Göteborg – Tingstad', city: 'Gothenburg', feed_url: '' },
      { id: 'se-malmo-1', lat: 55.6050, lng: 13.0038, name: 'Malmö – E6 Yttre Ring', city: 'Malmö', feed_url: '' },
      { id: 'se-e4-1', lat: 58.4108, lng: 15.6214, name: 'E4 – Linköping', city: 'Linköping', feed_url: '' },
    ];
    for (const c of curated) cams.push({ ...c, country: 'SE', source: 'Trafikverket' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
