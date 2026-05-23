// ── Sweden: Trafikverket Open API ─────────────────────────────────────────────
// Allowlist audit:
//   api.trafikinfo.trafikverket.se → data fetch only (POST request for metadata)
//   Trafikverket PhotoUrl hosts    → typically *.trafikverket.se — NOT allowlisted
//   www.trafikverket.se            → NOT in allowlist
// Fix: curated fallback uses Windy webcam embeds (www.windy.com + imgproxy.windy.com
//      both ALLOWED) for Swedish cities and major roads.
// Runtime: if Trafikverket API returns PhotoUrl on a non-allowlisted host, those
//          records get external_url fallback so map nodes still render.

/** Build Windy embed + imgproxy snapshot for a given Windy webcam ID */
function windy(id: string) {
  return {
    stream_url: `https://www.windy.com/webcams/${id}/embed`,
    stream_type: 'iframe' as const,
    feed_url: `https://imgproxy.windy.com/${id.slice(0, 2)}/${id}/current/full/${id}.jpg`,
    external_url: `https://www.windy.com/webcams/${id}`,
    source: 'Windy / Trafikverket',
  };
}

const NON_ALLOWLISTED_HOSTS = new Set([
  'www.trafikverket.se',
  'api.trafikinfo.trafikverket.se',
  'regional.trafikverket.se',
]);

function hostAllowed(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'www.windy.com' || host === 'imgproxy.windy.com') return true;
    return !NON_ALLOWLISTED_HOSTS.has(host) && !host.endsWith('.trafikverket.se');
  } catch { return false; }
}

export async function fetchSwedenCameras(): Promise<any[]> {
  const cams: any[] = [];

  try {
    const body = JSON.stringify({
      REQUEST: {
        LOGIN: { authenticationkey: process.env.TRAFIKVERKET_API_KEY || 'demo' },
        QUERY: {
          objecttype: 'Camera',
          schemaversion: '1',
          FILTER: { EQ: { name: 'Active', value: 'true' } },
          INCLUDE: ['Id', 'Name', 'Geometry.WGS84', 'PhotoUrl', 'Description'],
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
        const wkt = cam['Geometry.WGS84'] || cam.Geometry?.WGS84 || '';
        const match = wkt.match(/POINT\s*\(([^ ]+)\s+([^ )]+)\)/);
        if (!match) continue;
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        const photoUrl: string = cam.PhotoUrl || '';
        const allowed = photoUrl && hostAllowed(photoUrl);
        cams.push({
          id: `se-${cam.Id}`,
          lat, lng,
          name: cam.Name || cam.Description || 'Trafikverket Camera',
          city: 'Sweden',
          country: 'SE',
          feed_url: allowed ? photoUrl : '',
          external_url: allowed ? undefined : 'https://www.trafikverket.se/trafikinformation/vag/',
          source: 'Trafikverket',
        });
      }
    }
  } catch { /* silent */ }

  // Curated Windy fallback for Swedish cities — all on allowlisted hosts
  if (cams.length === 0) {
    const curated = [
      {
        id: 'se-stockholm-gamla-stan',
        lat: 59.3250, lng: 18.0710,
        name: 'Stockholm – Gamla Stan (Old Town)',
        city: 'Stockholm',
        ...windy('1511622527'),
      },
      {
        id: 'se-stockholm-sergels',
        lat: 59.3328, lng: 18.0649,
        name: 'Stockholm – Sergels Torg',
        city: 'Stockholm',
        ...windy('1573537620'),
      },
      {
        id: 'se-gothenburg-avenyn',
        lat: 57.6970, lng: 11.9742,
        name: 'Göteborg – Avenyn',
        city: 'Gothenburg',
        ...windy('1511775245'),
      },
      {
        id: 'se-malmo-stortorget',
        lat: 55.6050, lng: 13.0034,
        name: 'Malmö – Stortorget',
        city: 'Malmö',
        ...windy('1594027166'),
      },
      {
        id: 'se-are-ski',
        lat: 63.3985, lng: 13.0818,
        name: 'Åre – Ski Resort',
        city: 'Åre',
        ...windy('1481896280'),
      },
      {
        id: 'se-kiruna-north',
        lat: 67.8558, lng: 20.2253,
        name: 'Kiruna – Arctic Circle',
        city: 'Kiruna',
        ...windy('1536233120'),
      },
    ];
    for (const c of curated) cams.push({ ...c, country: 'SE' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
