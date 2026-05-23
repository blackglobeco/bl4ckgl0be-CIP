import type { CctvCamera } from './types';
import { BULGARIA_FWCBG_CAMERAS } from './bulgaria-fwcbg.generated';

// Allowlist audit:
//   cdn.uab.org          → NOT allowlisted → external_url only
//   meteo.chavo.biz      → NOT allowlisted → external_url only
//   pics.smartburgas.eu  → NOT allowlisted (HLS) → external_url only
//   www.youtube.com/embed → iframe stream_type → OK (CameraViewer renders in iframe)
//   www.windy.com        → ALLOWED (stream_type iframe)
//   imgproxy.windy.com   → ALLOWED (feed_url snapshots)

const BULGARIA_MANUAL: CctvCamera[] = [
  {
    // cdn.uab.org NOT in allowlist — display via external_url only
    id: 'bg-sofia-tsarigradsko-uab',
    lat: 42.662, lng: 23.376,
    name: 'Tsarigradsko Shose (UAB)', city: 'Sofia', country: 'Bulgaria',
    external_url: 'https://www.uab.org/en/traffic-cameras',
    source: 'UAB / KAMEPA',
  },
  {
    // meteo.chavo.biz NOT in allowlist — external_url only
    id: 'bg-sofia-banishora',
    lat: 42.704, lng: 23.327,
    name: 'Banishora / Opalchenska', city: 'Sofia', country: 'Bulgaria',
    external_url: 'https://meteo.chavo.biz',
    source: 'meteo.chavo.biz',
  },
  {
    // YouTube embed → stream_type 'iframe' → rendered in sandboxed iframe by CameraViewer, no proxy needed
    id: 'bg-gkpp-makaza-1',
    lat: 41.297, lng: 24.133,
    name: 'GKPP Makaza – Nymfea (cam 1)', city: 'Makaza', country: 'Bulgaria',
    stream_url: 'https://www.youtube.com/embed/pnr0lhrqRAc?autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://weather-webcam.eu/ueb-kameri-ot-gkpp-makaza-nimfeya/',
    source: 'YouTube / GKPP',
  },
  {
    // pics.smartburgas.eu NOT in allowlist; use Windy embed instead which IS allowlisted.
    // Windy webcam ID 1639080445 covers Burgas city centre.
    id: 'bg-burgas-center',
    lat: 42.497, lng: 27.47,
    name: 'Burgas Center', city: 'Burgas', country: 'Bulgaria',
    // www.windy.com → ALLOWED (profile "windy-webcams"), stream_type iframe
    stream_url: 'https://www.windy.com/webcams/1639080445/embed',
    stream_type: 'iframe',
    // imgproxy.windy.com → ALLOWED for still snapshot
    feed_url: 'https://imgproxy.windy.com/1639080445/current/full/1639080445.jpg',
    external_url: 'https://www.windy.com/webcams/1639080445',
    source: 'Windy / Smart Burgas',
  },
];

function cameraKey(cam: CctvCamera): string {
  return (cam.stream_url || cam.feed_url || cam.external_url || cam.id).split('?')[0];
}

export async function fetchBulgariaCameras(): Promise<CctvCamera[]> {
  const seen = new Set<string>();
  const merged: CctvCamera[] = [];

  for (const cam of [...BULGARIA_MANUAL, ...BULGARIA_FWCBG_CAMERAS]) {
    if (!cam.feed_url && !cam.stream_url && !cam.external_url) continue;
    const key = cameraKey(cam);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(cam);
  }

  return merged;
}
