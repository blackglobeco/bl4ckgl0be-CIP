// ── Spain – DGT National Traffic Cameras + Madrid City Cameras ───────────────
// Proxy hosts: infocar.dgt.es (profile "dgt-spain"), informo.madrid.es (profile "madrid-city")
// Both on _CCTV_PROXY_ALLOWED_HOSTS

export async function fetchSpainCameras(): Promise<any[]> {
  const cams: any[] = [];

  // DGT (Dirección General de Tráfico) – national highway cameras (~3000+)
  // Open data: data.gob.es / DGT InfoCAR API
  try {
    const res = await fetch(
      'https://infocar.dgt.es/datex2/dgt/CCTVSiteTablePublication/content.xml',
      { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/xml,*/*', Referer: 'https://infocar.dgt.es/' } }
    );
    if (res.ok) {
      const text = await res.text();
      // Parse DATEX2 XML – extract cctv records
      const idMatches     = [...text.matchAll(/<cctvCameraIdentifier>([^<]+)<\/cctvCameraIdentifier>/g)];
      const latMatches    = [...text.matchAll(/<latitude>([^<]+)<\/latitude>/g)];
      const lngMatches    = [...text.matchAll(/<longitude>([^<]+)<\/longitude>/g)];
      const descMatches   = [...text.matchAll(/<descriptionValue[^>]*>([^<]+)<\/descriptionValue>/g)];
      const urlMatches    = [...text.matchAll(/<stillImageUrl[^>]*>([^<]+)<\/stillImageUrl>/g)];

      const count = Math.min(idMatches.length, latMatches.length, lngMatches.length);
      for (let i = 0; i < count; i++) {
        const lat = parseFloat(latMatches[i][1]);
        const lng = parseFloat(lngMatches[i][1]);
        if (!lat || !lng) continue;
        const camId = idMatches[i][1].trim();
        cams.push({
          id: `es-dgt-${camId}`,
          lat, lng,
          name: descMatches[i]?.[1]?.trim() || `DGT ${camId}`,
          city: 'Spain',
          country: 'ES',
          feed_url: urlMatches[i]?.[1]?.trim()
            || `https://infocar.dgt.es/etraffic/BuscarCamaras?camaraNombre=${encodeURIComponent(camId)}`,
          source: 'DGT Spain',
        });
      }
    }
  } catch { /* silent */ }

  // DGT JSON fallback (newer API endpoint)
  if (cams.length === 0) {
    try {
      const res = await fetch(
        'https://infocar.dgt.es/etraffic/SituacionTrafico?lat=40.4168&lon=-3.7038&zoom=6&accion=GetBitrateSource',
        { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json', Referer: 'https://infocar.dgt.es/' } }
      );
      if (res.ok) {
        const data = await res.json();
        for (const cam of (data?.camaras || data || [])) {
          const lat = parseFloat(cam.latitud || cam.lat || '');
          const lng = parseFloat(cam.longitud || cam.lng || '');
          if (!lat || !lng) continue;
          cams.push({
            id: `es-dgt-${cam.idCamara || cam.id || cams.length}`,
            lat, lng,
            name: cam.descripcion || cam.nombre || 'DGT Camera',
            city: cam.provincia || 'Spain',
            country: 'ES',
            feed_url: `https://infocar.dgt.es/etraffic/BuscarCamaras?camaraNombre=${encodeURIComponent(cam.idCamara || '')}`,
            source: 'DGT Spain',
          });
        }
      }
    } catch { /* silent */ }
  }

  // Madrid city cameras – informo.madrid.es
  try {
    const res = await fetch(
      'https://informo.madrid.es/informo/tmadrid/cam.xml',
      { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/xml,*/*', Referer: 'https://informo.madrid.es/' } }
    );
    if (res.ok) {
      const text = await res.text();
      const cameras = [...text.matchAll(/<camera[^>]*>([\s\S]*?)<\/camera>/gi)];
      for (const match of cameras) {
        const block = match[1];
        const id   = (block.match(/<id>([^<]+)<\/id>/))?.[1] || '';
        const name = (block.match(/<name>([^<]+)<\/name>/))?.[1] || `Madrid Camera ${id}`;
        const lat  = parseFloat((block.match(/<lat>([^<]+)<\/lat>/))?.[1] || '');
        const lng  = parseFloat((block.match(/<lon>([^<]+)<\/lon>/))?.[1] || '');
        if (!lat || !lng) continue;
        cams.push({
          id: `es-madrid-${id}`,
          lat, lng,
          name,
          city: 'Madrid',
          country: 'ES',
          feed_url: id
            ? `https://informo.madrid.es/cameras/camara${id}.jpg`
            : '',
          source: 'Madrid City',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback – major Spanish cities and arteries
  if (cams.length === 0) {
    const curated = [
      { id: 'es-m30-1', lat: 40.4168, lng: -3.7038, name: 'M-30 – Madrid (Nudo Sur)', city: 'Madrid', feed_url: 'https://informo.madrid.es/cameras/camara001.jpg' },
      { id: 'es-m30-2', lat: 40.4300, lng: -3.6800, name: 'M-30 – Madrid (Plaza Elíptica)', city: 'Madrid', feed_url: 'https://informo.madrid.es/cameras/camara002.jpg' },
      { id: 'es-a6-1', lat: 40.4510, lng: -3.8060, name: 'A-6 – Las Rozas', city: 'Las Rozas', feed_url: 'https://infocar.dgt.es/etraffic/BuscarCamaras?camaraNombre=a6_lasrozas' },
      { id: 'es-ap7-bcn', lat: 41.3851, lng: 2.1734, name: 'AP-7 – Barcelona (Llobregat)', city: 'Barcelona', feed_url: 'https://infocar.dgt.es/etraffic/BuscarCamaras?camaraNombre=ap7_bcn' },
      { id: 'es-a4-seville', lat: 37.3891, lng: -5.9845, name: 'A-4 – Seville (Airport)', city: 'Seville', feed_url: 'https://infocar.dgt.es/etraffic/BuscarCamaras?camaraNombre=a4_sevilla' },
      { id: 'es-a3-valencia', lat: 39.4699, lng: -0.3763, name: 'A-3 – Valencia (Bypass)', city: 'Valencia', feed_url: 'https://infocar.dgt.es/etraffic/BuscarCamaras?camaraNombre=a3_valencia' },
    ];
    for (const c of curated) cams.push({ ...c, country: 'ES', source: 'DGT Spain' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
