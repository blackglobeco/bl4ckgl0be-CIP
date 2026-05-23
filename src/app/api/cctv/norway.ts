// ── Norway: Statens Vegvesen (NVDB open API) ─────────────────────────────────
// Allowlist audit:
//   nvdbapiles-v3.atlas.vegvesen.no → data fetch only
//   webkamera.vegvesen.no           → NOT in allowlist → cannot proxy images
// Fix: curated fallback uses Windy webcam embeds (www.windy.com ALLOWED,
//      imgproxy.windy.com ALLOWED) for Norwegian locations where Windy IDs exist,
//      and external_url to vegvesen.no viewer for others.

/** Build Windy embed + imgproxy snapshot for a given Windy webcam ID */
function windy(id: string) {
  return {
    stream_url: `https://www.windy.com/webcams/${id}/embed`,
    stream_type: 'iframe' as const,
    feed_url: `https://imgproxy.windy.com/${id.slice(0, 2)}/${id}/current/full/${id}.jpg`,
    external_url: `https://www.windy.com/webcams/${id}`,
    source: 'Windy / Vegvesen',
  };
}

export async function fetchNorwayCameras(): Promise<any[]> {
  const cams: any[] = [];

  // NVDB API v3 – traffic cameras (vegobjekttype 105)
  // Image URLs returned in egenskaper may be on webkamera.vegvesen.no which is
  // not allowlisted. We skip those feed_urls and rely on external_url instead.
  try {
    const res = await fetch(
      'https://nvdbapiles-v3.atlas.vegvesen.no/vegobjekter/105?inkluder=egenskaper,lokasjon&antall=1000&srid=4326',
      {
        signal: AbortSignal.timeout(12000),
        headers: {
          'X-Client': 'bl4ckgl0be-osint',
          Accept: 'application/vnd.vegvesen.nvdb-v3-rev2+json',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const obj of (data?.objekter || [])) {
        const wkt = obj.lokasjon?.geometri?.wkt || '';
        const match = wkt.match(/POINT\s*\(([^ ]+)\s+([^ )]+)\)/);
        if (!match) continue;
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);

        const nameProp = obj.egenskaper?.find((e: any) => e.navn === 'Navn');
        const urlProp  = obj.egenskaper?.find((e: any) => e.navn === 'Bilde-URL' || e.navn === 'Url');
        const rawUrl: string = urlProp?.verdi || '';

        // Only use feed_url if the host is not webkamera.vegvesen.no (not allowlisted)
        const isVegvesenImg = rawUrl.includes('webkamera.vegvesen.no');

        cams.push({
          id: `no-${obj.id}`,
          lat, lng,
          name: nameProp?.verdi || `Vegvesen Camera ${obj.id}`,
          city: 'Norway',
          country: 'NO',
          feed_url: isVegvesenImg ? '' : rawUrl,
          external_url: isVegvesenImg
            ? `https://www.vegvesen.no/trafikk/underveis/webkameraer/`
            : undefined,
          source: 'Statens Vegvesen',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback using Windy webcams for major Norwegian locations.
  // Windy has good coverage of Norwegian mountain passes and cities.
  if (cams.length === 0) {
    const curated = [
      {
        id: 'no-oslo-aker-brygge',
        lat: 59.9108, lng: 10.7280,
        name: 'Oslo – Aker Brygge Harbour',
        city: 'Oslo',
        ...windy('1643785260'),
      },
      {
        id: 'no-oslo-holmenkollen',
        lat: 59.9638, lng: 10.6671,
        name: 'Oslo – Holmenkollen (ski jump)',
        city: 'Oslo',
        ...windy('1575469025'),
      },
      {
        id: 'no-bergen-bryggen',
        lat: 60.3975, lng: 5.3239,
        name: 'Bergen – Bryggen Wharf',
        city: 'Bergen',
        ...windy('1481896290'),
      },
      {
        id: 'no-flam-fjord',
        lat: 60.8633, lng: 7.1109,
        name: 'Flåm – Sognefjord',
        city: 'Flåm',
        ...windy('1508943613'),
      },
      {
        id: 'no-e6-karihaugen',
        lat: 59.9139, lng: 10.7522,
        name: 'Oslo – E6 Karihaugen',
        city: 'Oslo',
        // No Windy ID for this road cam; link to vegvesen viewer
        external_url: 'https://www.vegvesen.no/trafikk/underveis/webkameraer/',
        source: 'Statens Vegvesen',
      },
      {
        id: 'no-trondheim-torget',
        lat: 63.4305, lng: 10.3951,
        name: 'Trondheim – Torget',
        city: 'Trondheim',
        ...windy('1527670839'),
      },
      {
        id: 'no-stavanger-harbor',
        lat: 58.9700, lng: 5.7331,
        name: 'Stavanger – Harbour',
        city: 'Stavanger',
        ...windy('1511775260'),
      },
      {
        id: 'no-lofoten-reine',
        lat: 67.9327, lng: 13.0900,
        name: 'Lofoten – Reine',
        city: 'Lofoten',
        ...windy('1536233124'),
      },
    ];
    for (const c of curated) cams.push({ ...c, country: 'NO' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
