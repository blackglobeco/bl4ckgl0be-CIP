import type { CctvCamera } from './types';

// ── Caltrans California — All 12 Districts ───────────────────────────────────
// Source: cwwp2.dot.ca.gov — official Caltrans open data (public domain)
// Covers districts D01–D12; each has its own JSON endpoint.

const CALTRANS_DISTRICTS = [1,2,3,4,5,6,7,8,9,10,11,12];

function detectMediaType(url: string): 'image' | 'hls' | 'mjpeg' | 'video' {
  const u = url.toLowerCase();
  if (u.includes('.m3u8') || u.includes('hls')) return 'hls';
  if (u.includes('.mjpg') || u.includes('.mjpeg') || u.includes('mjpg')) return 'mjpeg';
  if (u.includes('.mp4') || u.includes('.webm')) return 'video';
  return 'image';
}

async function fetchCaltransDistrict(district: number): Promise<CctvCamera[]> {
  const d = String(district).padStart(2, '0');
  const url = `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${d}.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    const entries: any[] = Array.isArray(data) ? data : (data.data || []);
    const cameras: CctvCamera[] = [];

    for (const wrapper of entries) {
      const entry = wrapper?.cctv ?? wrapper;
      if (!entry || typeof entry !== 'object') continue;
      if (String(entry.inService) === 'false') continue;

      const loc = entry.location || {};
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;

      const imgData = entry.imageData || {};
      const streaming = String(imgData.streamingVideoURL || '').trim();
      const staticImg = String(imgData.static?.currentImageURL || '').trim();
      const streamType = streaming ? detectMediaType(streaming) : 'image';

      let feedUrl = '';
      let streamUrl: string | undefined;
      let streamType2: 'hls' | 'mjpeg' | undefined;

      if (staticImg) {
        feedUrl = staticImg;
      } else if (streaming && (streamType === 'hls' || streamType === 'mjpeg')) {
        streamUrl = streaming;
        streamType2 = streamType as 'hls' | 'mjpeg';
      } else {
        feedUrl = streaming;
      }

      if (!feedUrl && !streamUrl) continue;

      const idx = entry.index ?? cameras.length;
      cameras.push({
        id: `cal-d${d}-${idx}`,
        lat,
        lng,
        name: (
          loc.locationName ||
          loc.nearbyPlace ||
          `CA-${loc.route || '?'}`
        ).slice(0, 120),
        city: 'California',
        country: 'US',
        feed_url: feedUrl || undefined,
        stream_url: streamUrl,
        stream_type: streamType2,
        source: `Caltrans D${d}`,
      });
    }
    return cameras;
  } catch {
    return [];
  }
}

export async function fetchCaltransCameras(): Promise<CctvCamera[]> {
  const results = await Promise.allSettled(
    CALTRANS_DISTRICTS.map((d) => fetchCaltransDistrict(d))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<CctvCamera[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

// ── WSDOT — Washington State DOT (ArcGIS, ~1,500+ cameras) ──────────────────
// Source: wsdot.wa.gov ArcGIS REST service (public open data)

export async function fetchWSDOTCameras(): Promise<CctvCamera[]> {
  try {
    const url =
      'https://www.wsdot.wa.gov/arcgis/rest/services/Production/' +
      'WSDOTTrafficCameras/MapServer/0/query' +
      '?where=1%3D1&outFields=CameraID,CameraTitl,ImageURL,CameraOwne&outSR=4326&f=json';
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) return [];
    const data = await res.json();

    const cameras: CctvCamera[] = [];
    for (const feat of data.features || []) {
      const attrs = feat.attributes || {};
      const geom = feat.geometry || {};
      const lat = Number(geom.y);
      const lng = Number(geom.x);
      const img = String(attrs.ImageURL || '').trim();
      const camId = attrs.CameraID;
      if (!camId || !lat || !lng || !img) continue;

      cameras.push({
        id: `wsdot-${camId}`,
        lat,
        lng,
        name: String(attrs.CameraTitl || 'WA Camera').slice(0, 120),
        city: 'Washington',
        country: 'US',
        feed_url: img,
        source: String(attrs.CameraOwne || 'WSDOT').slice(0, 60),
      });
    }
    return cameras;
  } catch {
    return [];
  }
}

// ── Colorado DOT — COtrip Camera Service ─────────────────────────────────────
// Source: cotg.carsprogram.org/cameras_v1/api/cameras (public JSON API)
// HLS streams proxied via publicstreamer{1-4}.cotrip.org; preview images via cocam.carsprogram.org

export async function fetchColoradoDOTCameras(): Promise<CctvCamera[]> {
  try {
    const res = await fetch(
      'https://cotg.carsprogram.org/cameras_v1/api/cameras',
      {
        signal: AbortSignal.timeout(25000),
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) return [];
    const data: any[] = await res.json();

    const cameras: CctvCamera[] = [];
    for (const item of Array.isArray(data) ? data : []) {
      if (item.public === false || item.active === false) continue;
      const loc = item.location || {};
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (!lat || !lng) continue;

      let feedUrl = '';
      let streamUrl: string | undefined;
      let streamType2: 'hls' | 'mjpeg' | undefined;

      // Prefer preview image; fall back to HLS stream
      for (const view of item.views || []) {
        const preview = String(view.videoPreviewUrl || '').trim();
        if (preview) { feedUrl = preview; break; }
      }
      if (!feedUrl) {
        for (const view of item.views || []) {
          const stream = String(view.url || '').trim();
          const mt = stream ? detectMediaType(stream) : 'image';
          if (stream && (mt === 'hls' || mt === 'mjpeg')) {
            streamUrl = stream;
            streamType2 = mt as 'hls' | 'mjpeg';
            break;
          }
        }
      }
      if (!feedUrl && !streamUrl) continue;

      const owner = item.cameraOwner || {};
      cameras.push({
        id: `codot-${item.id}`,
        lat,
        lng,
        name: String(item.name || loc.routeId || 'Colorado Camera').slice(0, 120),
        city: 'Colorado',
        country: 'US',
        feed_url: feedUrl || undefined,
        stream_url: streamUrl,
        stream_type: streamType2,
        source: String(owner.name || 'Colorado DOT').slice(0, 60),
      });
    }
    return cameras;
  } catch {
    return [];
  }
}

// ── Oregon DOT — TripCheck Camera Service ───────────────────────────────────
// Source: tripcheck.com public API (fetched via Next.js API route proxy
// since TripCheck blocks direct browser requests; the Shadowbroker proxy
// profile for tripcheck.com is already registered in route.ts)

export async function fetchOregonDOTCameras(): Promise<CctvCamera[]> {
  try {
    const res = await fetch(
      'https://api.tripcheck.com/api/cameras?format=json',
      {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items: any[] = data.cameras || data || [];

    return items
      .filter((c) => c.lat && c.lng && (c.imageUrl || c.thumbnailUrl))
      .map((c) => ({
        id: `odot-${c.id || c.cameraId}`,
        lat: Number(c.lat),
        lng: Number(c.lng),
        name: String(c.name || c.description || 'OR Camera').slice(0, 120),
        city: 'Oregon',
        country: 'US',
        feed_url: String(c.imageUrl || c.thumbnailUrl || '').trim(),
        source: 'Oregon TripCheck',
      }));
  } catch {
    return [];
  }
}
