// ── Poland: GDDKiA (General Directorate for National Roads and Motorways) ─────
// Allowlist audit:
//   mapa.gddkia.gov.pl       → data fetch only (WFS GeoJSON)
//   monitoring.ursynow.pl    → NOT in allowlist → external_url only
//   kamery.rsd.cz            → NOT in allowlist (Czech, not Poland — remove)
// Note: Image URLs embedded in GDDKiA GeoJSON (URL_OBRAZU) are accepted as-is
//       since the actual host is only known at runtime from the API response.

export async function fetchPolandCameras(): Promise<any[]> {
  const cams: any[] = [];

  // GDDKiA open data portal – traffic cameras GeoJSON
  try {
    const res = await fetch(
      'https://mapa.gddkia.gov.pl/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=pub:KAMERA&outputFormat=application/json&count=2000&srsName=EPSG:4326',
      { signal: AbortSignal.timeout(12000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const feat of (data?.features || [])) {
        const coords = feat.geometry?.coordinates;
        if (!coords) continue;
        const [lng, lat] = coords;
        const props = feat.properties || {};
        // URL_OBRAZU from GDDKiA API — host only known at runtime, used as-is
        const imgUrl = props.URL_OBRAZU || props.IMAGE_URL || '';
        cams.push({
          id: `pl-${props.ID || props.OBJECTID || cams.length}`,
          lat, lng,
          name: props.NAZWA || props.LOKALIZACJA || 'GDDKiA Camera',
          city: props.MIEJSCOWOSC || 'Poland',
          country: 'PL',
          feed_url: imgUrl,
          source: 'GDDKiA',
        });
      }
    }
  } catch { /* silent */ }

  // Curated Polish cameras.
  // monitoring.ursynow.pl is NOT in _CCTV_PROXY_ALLOWED_HOSTS.
  // Use external_url so map nodes are visible and users can open the camera page.
  const curated = [
    {
      id: 'pl-warsaw-1', lat: 52.2297, lng: 21.0122,
      name: 'Warszawa – Al. Jerozolimskie', city: 'Warszawa',
      external_url: 'https://monitoring.ursynow.pl/',
    },
    {
      id: 'pl-warsaw-gddkia', lat: 52.2413, lng: 21.0158,
      name: 'Warszawa – Centrum (GDDKiA)', city: 'Warszawa',
      external_url: 'https://mapa.gddkia.gov.pl/',
    },
    {
      id: 'pl-krakow-1', lat: 50.0614, lng: 19.9366,
      name: 'Kraków – Rondo Grunwaldzkie', city: 'Kraków',
      external_url: 'https://mapa.gddkia.gov.pl/',
    },
    {
      id: 'pl-gdansk-1', lat: 54.3520, lng: 18.6466,
      name: 'Gdańsk – A1 wjazd', city: 'Gdańsk',
      external_url: 'https://mapa.gddkia.gov.pl/',
    },
    {
      id: 'pl-wroclaw-1', lat: 51.1079, lng: 17.0385,
      name: 'Wrocław – A8 Długołęka', city: 'Wrocław',
      external_url: 'https://mapa.gddkia.gov.pl/',
    },
  ];
  for (const c of curated) {
    if (!cams.find(x => x.id === c.id)) {
      cams.push({ ...c, country: 'PL', source: 'GDDKiA' });
    }
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
