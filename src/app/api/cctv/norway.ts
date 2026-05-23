// ── Norway: Statens Vegvesen (NVDB open API) ────────────────────────────────

export async function fetchNorwayCameras(): Promise<any[]> {
  const cams: any[] = [];

  try {
    // NVDB API v3 – traffic cameras (vegobjekttype 105)
    const res = await fetch(
      'https://nvdbapiles-v3.atlas.vegvesen.no/vegobjekter/105?inkluder=egenskaper,lokasjon&antall=1000&srid=4326',
      {
        signal: AbortSignal.timeout(12000),
        headers: { 'X-Client': 'bl4ckgl0be-osint', Accept: 'application/vnd.vegvesen.nvdb-v3-rev2+json' },
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const obj of (data?.objekter || [])) {
        const lat = obj.lokasjon?.geometri?.wkt
          ? parseFloat(obj.lokasjon.geometri.wkt.replace(/^POINT\s*\(([^ ]+) ([^ )]+)\).*/, '$2'))
          : null;
        const lng = obj.lokasjon?.geometri?.wkt
          ? parseFloat(obj.lokasjon.geometri.wkt.replace(/^POINT\s*\(([^ ]+) ([^ )]+)\).*/, '$1'))
          : null;
        if (!lat || !lng) continue;

        const nameProp = obj.egenskaper?.find((e: any) => e.navn === 'Navn');
        const urlProp  = obj.egenskaper?.find((e: any) => e.navn === 'Bilde-URL' || e.navn === 'Url');

        cams.push({
          id: `no-${obj.id}`,
          lat, lng,
          name: nameProp?.verdi || `Vegvesen Camera ${obj.id}`,
          city: 'Norway',
          country: 'NO',
          feed_url: urlProp?.verdi || '',
          source: 'Statens Vegvesen',
        });
      }
    }
  } catch { /* silent */ }

  // Fallback: curated major Norwegian cameras (public JPEG endpoints)
  if (cams.length === 0) {
    const curated = [
      { id: 'no-oslo-1', lat: 59.9139, lng: 10.7522, name: 'Oslo – E6 Karihaugen', city: 'Oslo', feed_url: 'https://webkamera.vegvesen.no/public?camera=1000311' },
      { id: 'no-oslo-2', lat: 59.9300, lng: 10.7530, name: 'Oslo – Ring 3 Sinsen', city: 'Oslo', feed_url: 'https://webkamera.vegvesen.no/public?camera=1000312' },
      { id: 'no-bergen-1', lat: 60.3913, lng: 5.3221, name: 'Bergen – E39 Nygårdstunnel', city: 'Bergen', feed_url: 'https://webkamera.vegvesen.no/public?camera=2000113' },
      { id: 'no-trondheim-1', lat: 63.4305, lng: 10.3951, name: 'Trondheim – E6 Sluppen', city: 'Trondheim', feed_url: 'https://webkamera.vegvesen.no/public?camera=3000201' },
      { id: 'no-stavanger-1', lat: 58.9700, lng: 5.7331, name: 'Stavanger – E39 Ryfylketunnel', city: 'Stavanger', feed_url: 'https://webkamera.vegvesen.no/public?camera=4000101' },
      { id: 'no-e16-1', lat: 60.4720, lng: 8.4721, name: 'E16 – Filefjell', city: 'Vestland', feed_url: 'https://webkamera.vegvesen.no/public?camera=2000500' },
    ];
    for (const c of curated) cams.push({ ...c, country: 'NO', source: 'Statens Vegvesen' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
