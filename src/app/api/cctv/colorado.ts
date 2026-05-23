// ── Colorado DOT – CoTrip HLS Streams + Preview Images ───────────────────────
// Proxy hosts: publicstreamer1-4.cotrip.org (hls), cocam.carsprogram.org (jpg)
// Profile "cotrip-hls" (m3u8) and "cotrip-preview" (jpg) — both allowlisted.

export async function fetchColoradoCameras(): Promise<any[]> {
  const cams: any[] = [];

  // CoTrip open API – camera metadata list
  try {
    const res = await fetch(
      'https://www.cotrip.org/map/api/v1/cameras',
      { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json', Referer: 'https://www.cotrip.org/' } }
    );
    if (res.ok) {
      const data = await res.json();
      const list = data?.features || data?.cameras || data || [];
      for (const item of list) {
        const props = item.properties || item;
        const coords = item.geometry?.coordinates;
        const lat = coords ? coords[1] : parseFloat(props.latitude || props.lat || '');
        const lng = coords ? coords[0] : parseFloat(props.longitude || props.lng || '');
        if (!lat || !lng) continue;

        const camId = props.cameraId || props.camera_id || props.id || '';
        // publicstreamer hosts are load-balanced 1–4; distribute by camId mod 4
        const streamerNum = (parseInt(String(camId).replace(/\D/g, '') || '0') % 4) + 1;
        const hlsUrl = camId
          ? `https://publicstreamer${streamerNum}.cotrip.org/rtplive/${camId}/playlist.m3u8`
          : '';
        // cocam.carsprogram.org serves JPEG preview thumbnails
        const previewUrl = camId
          ? `https://cocam.carsprogram.org/snapshot/${camId}.jpg`
          : props.imageUrl || '';

        cams.push({
          id: `co-${camId || cams.length}`,
          lat, lng,
          name: props.displayName || props.description || props.name || `CoTrip Camera ${camId}`,
          city: props.county || props.city || 'Colorado',
          country: 'US',
          feed_url: previewUrl,
          stream_url: hlsUrl,
          stream_type: hlsUrl ? 'hls' : 'jpg',
          source: 'CoTrip CO',
        });
      }
    }
  } catch { /* silent */ }

  // Curated fallback – I-70 mountain corridor + Denver metro
  if (cams.length === 0) {
    const makeCoTrip = (id: string, num: number) => ({
      feed_url:    `https://cocam.carsprogram.org/snapshot/${id}.jpg`,
      stream_url:  `https://publicstreamer${(num % 4) + 1}.cotrip.org/rtplive/${id}/playlist.m3u8`,
      stream_type: 'hls' as const,
    });
    const curated = [
      { id: 'co-i70-eisenhower', lat: 39.6866, lng: -105.9069, name: 'I-70 – Eisenhower Tunnel', city: 'Clear Creek', ...makeCoTrip('i70_eisenhower', 1) },
      { id: 'co-i70-vail', lat: 39.6433, lng: -106.3742, name: 'I-70 – Vail Pass Summit', city: 'Eagle County', ...makeCoTrip('i70_vail', 2) },
      { id: 'co-i70-glenwood', lat: 39.5487, lng: -107.3240, name: 'I-70 – Glenwood Canyon', city: 'Garfield County', ...makeCoTrip('i70_glenwood', 3) },
      { id: 'co-i25-denver', lat: 39.7392, lng: -104.9903, name: 'I-25 – Denver (Broadway)', city: 'Denver', ...makeCoTrip('i25_denver_broadway', 4) },
      { id: 'co-i25-col-springs', lat: 38.8339, lng: -104.8214, name: 'I-25 – Colorado Springs', city: 'Colorado Springs', ...makeCoTrip('i25_cos', 1) },
      { id: 'co-us6-loveland', lat: 39.6820, lng: -105.7870, name: 'US-6 – Loveland Pass', city: 'Clear Creek', ...makeCoTrip('us6_loveland', 2) },
      { id: 'co-i70-aurora', lat: 39.7294, lng: -104.8319, name: 'I-70 – Aurora (I-225 jct)', city: 'Aurora', ...makeCoTrip('i70_aurora', 3) },
      { id: 'co-c470-1', lat: 39.5891, lng: -105.0658, name: 'C-470 – Ken Caryl', city: 'Jefferson County', ...makeCoTrip('c470_kencaryl', 4) },
    ];
    for (const c of curated) cams.push({ ...c, country: 'US', source: 'CoTrip CO' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}
