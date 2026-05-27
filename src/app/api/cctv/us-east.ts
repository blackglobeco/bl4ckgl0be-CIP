import type { CctvCamera } from './types';

// ── Austin, TX — City of Austin Traffic Cameras ─────────────────────────────
// Source: data.austintexas.gov open data API (public domain)
// Image proxy: cctv.austinmobility.io

export async function fetchAustinTXCameras(): Promise<CctvCamera[]> {
  try {
    const res = await fetch(
      'https://data.austintexas.gov/resource/b4k4-adkb.json?$limit=2000',
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data: any[] = await res.json();

    return data
      .filter((item) => {
        const status = String(item.camera_status || '').trim().toUpperCase();
        return item.camera_id && (!status || status === 'TURNED_ON');
      })
      .map((item) => {
        const coords: number[] = item.location?.coordinates || [];
        if (coords.length < 2) return null;
        const [lng, lat] = coords;
        const feedUrl =
          String(item.screenshot_address || '').trim() ||
          `https://cctv.austinmobility.io/image/${item.camera_id}.jpg`;
        return {
          id: `atx-${item.camera_id}`,
          lat,
          lng,
          name: item.location_name || `Austin Camera ${item.camera_id}`,
          city: 'Austin',
          country: 'US',
          feed_url: feedUrl,
          source: 'Austin TxDOT',
        } as CctvCamera;
      })
      .filter((c): c is CctvCamera => c !== null && !!c.lat && !!c.lng);
  } catch {
    return [];
  }
}

// ── NYC DOT — New York City Traffic Cameras ──────────────────────────────────
// Source: webcams.nyctmc.org public API

export async function fetchNYCDOTCameras(): Promise<CctvCamera[]> {
  try {
    const res = await fetch('https://webcams.nyctmc.org/api/cameras', {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();

    return data
      .filter((item) => {
        if (!item.id || !item.latitude || !item.longitude) return false;
        if (String(item.isOnline) === 'false') return false;
        return true;
      })
      .map((item) => ({
        id: `nyc-${item.id}`,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        name: item.name || `NYC Camera ${item.id}`,
        city: item.area ? `NYC – ${item.area}` : 'New York City',
        country: 'US',
        // webcams.nyctmc.org blocks direct browser requests (CORS + Referer enforcement).
        // Use the dedicated server-side proxy at /api/cctv/nyc-snapshot.
        feed_url: `/api/cctv/nyc-snapshot?cam=${item.id}`,
        source: 'NYC DOT',
      }));
  } catch {
    return [];
  }
}

// ── Georgia DOT — 511GA Camera Network ──────────────────────────────────────
// Source: 511ga.org/List/GetData/Cameras (paginated POST API)

const POINT_WKT_RE = /POINT\s*\(\s*([-+]?\d+(?:\.\d+)?)\s+([-+]?\d+(?:\.\d+)?)\s*\)/i;

function parseWktPoint(raw: string): [number, number] | null {
  const match = POINT_WKT_RE.exec(raw || '');
  if (!match) return null;
  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return [lat, lon];
}

export async function fetchGeorgiaDOTCameras(): Promise<CctvCamera[]> {
  const cameras: CctvCamera[] = [];
  let start = 0;
  let draw = 1;
  const pageSize = 500;

  while (true) {
    try {
      const res = await fetch('https://511ga.org/List/GetData/Cameras', {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Referer: 'https://511ga.org/cctv',
          Origin: 'https://511ga.org',
        },
        body: JSON.stringify({ draw, start, length: pageSize }),
      });
      if (!res.ok) break;
      const data = await res.json();
      const rows: any[] = data.data || [];
      if (!rows.length) break;

      for (const row of rows) {
        const siteId = row.id || row.DT_RowId;
        const location = row.location || row.roadway || 'GA Camera';
        const latLng = row.latLng || {};
        const geography = latLng.geography || {};
        const coords = parseWktPoint(geography.wellKnownText || '');
        if (!coords) continue;
        const [lat, lng] = coords;

        const images: any[] = row.images || [];
        const image = images.find(
          (img) => img.imageUrl && !img.blocked
        );
        if (!image || !siteId) continue;

        const rawUrl = String(image.imageUrl || '').trim();
        const feedUrl = rawUrl.startsWith('http')
          ? rawUrl
          : `https://511ga.org${rawUrl}`;

        cameras.push({
          id: `gdot-${siteId}`,
          lat,
          lng,
          name: String(location).slice(0, 120),
          city: 'Georgia',
          country: 'US',
          feed_url: feedUrl,
          source: 'Georgia DOT',
        });
      }

      start += rows.length;
      draw++;
      const total = Number(data.recordsTotal || 0);
      if ((total && start >= total) || (!total && rows.length < pageSize)) break;
    } catch {
      break;
    }
  }
  return cameras;
}

// ── Illinois DOT — ArcGIS FeatureServer (~3,400 cameras) ────────────────────
// Source: services2.arcgis.com/aIrBD8yn1TDTEXoz (public open data)

export async function fetchIllinoisDOTCameras(): Promise<CctvCamera[]> {
  try {
    const url =
      'https://services2.arcgis.com/aIrBD8yn1TDTEXoz/arcgis/rest/services/' +
      'TrafficCamerasTM_Public/FeatureServer/0/query' +
      '?where=1%3D1&outFields=CameraLocation,CameraDirection,SnapShot&outSR=4326&f=json';
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return [];
    const data = await res.json();

    const cameras: CctvCamera[] = [];
    for (const feat of data.features || []) {
      const attrs = feat.attributes || {};
      const geom = feat.geometry || {};
      const lat = Number(geom.y);
      const lng = Number(geom.x);
      const img = String(attrs.SnapShot || '').trim();
      if (!lat || !lng || !img) continue;

      cameras.push({
        id: `idot-${cameras.length}`,
        lat,
        lng,
        name: String(attrs.CameraLocation || attrs.CameraDirection || 'IL Camera').slice(0, 120),
        city: 'Illinois',
        country: 'US',
        feed_url: img,
        source: 'Illinois DOT',
      });
    }
    return cameras;
  } catch {
    return [];
  }
}

// ── Michigan DOT — MiDrive Camera List ──────────────────────────────────────
// Source: mdotjboss.state.mi.us/MiDrive/camera/list (public JSON + HTML snippets)

export async function fetchMichiganDOTCameras(): Promise<CctvCamera[]> {
  try {
    const res = await fetch(
      'https://mdotjboss.state.mi.us/MiDrive/camera/list',
      { signal: AbortSignal.timeout(20000) }
    );
    if (!res.ok) return [];
    const data: any[] = await res.json();

    const cameras: CctvCamera[] = [];
    for (const cam of data) {
      const county: string = cam.county || '';
      const latLonMatch = /lat=([\d.-]+)&lon=([\d.-]+)/.exec(county);
      if (!latLonMatch) continue;
      const lat = parseFloat(latLonMatch[1]);
      const lng = parseFloat(latLonMatch[2]);
      if (isNaN(lat) || isNaN(lng)) continue;

      const imgMatch = /src="([^"]+)"/.exec(cam.image || '');
      if (!imgMatch) continue;

      const idMatch = /id=(\d+)/.exec(county);
      const camId = idMatch ? idMatch[1] : String(cameras.length);
      const mediaUrl = imgMatch[1].startsWith('http')
        ? imgMatch[1]
        : `https://mdotjboss.state.mi.us${imgMatch[1]}`;

      cameras.push({
        id: `mdot-${camId}`,
        lat,
        lng,
        name: `${cam.route || ''} ${cam.location || ''}`.trim() || 'MI Camera',
        city: 'Michigan',
        country: 'US',
        feed_url: mediaUrl,
        source: 'Michigan DOT',
      });
    }
    return cameras;
  } catch {
    return [];
  }
}
