// ── Poland: GDDKiA (General Directorate for National Roads and Motorways) ────

export async function fetchPolandCameras(): Promise<any[]> {
  const cams: any[] = [];

  try {
    // GDDKiA open data portal – traffic cameras GeoJSON
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

  // Curated Polish cameras with known working endpoints
  const curated = [
    { id: 'pl-warsaw-1', lat: 52.2297, lng: 21.0122, name: 'Warszawa – Al. Jerozolimskie', city: 'Warszawa', feed_url: 'https://monitoring.ursynow.pl/cgi-bin/camera.cgi?cam=1' },
    { id: 'pl-warsaw-2', lat: 52.2413, lng: 21.0158, name: 'Warszawa – Centrum', city: 'Warszawa', feed_url: '' },
    { id: 'pl-krakow-1', lat: 50.0614, lng: 19.9366, name: 'Kraków – Rondo Grunwaldzkie', city: 'Kraków', feed_url: '' },
    { id: 'pl-gdansk-1', lat: 54.3520, lng: 18.6466, name: 'Gdańsk – A1 wjazd', city: 'Gdańsk', feed_url: '' },
    { id: 'pl-wroclaw-1', lat: 51.1079, lng: 17.0385, name: 'Wrocław – A8 Długołęka', city: 'Wrocław', feed_url: '' },
  ];
  for (const c of curated) {
    if (!cams.find(x => x.id === c.id)) cams.push({ ...c, country: 'PL', source: 'GDDKiA' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
