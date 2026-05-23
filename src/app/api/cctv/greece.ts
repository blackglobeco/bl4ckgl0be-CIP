import type { CctvCamera } from './types';

// Allowlist audit:
//   ipcamlive.com          → data fetch only (API call to get stream/snapshot URLs)
//   ipcamlive HLS URLs     → host NOT in allowlist → use stream_type 'iframe' via ipcamlive player
//   ipcamlive snapshot URLs → host NOT in allowlist → use external_url fallback
//   www.aodos.gr           → NOT in allowlist → external_url only
//   www.youtube.com/embed  → stream_type 'iframe' → OK (no proxy needed)
//   click2stream.com       → stream_type 'iframe' → OK (no proxy needed)
//   www.windy.com/embed    → stream_type 'iframe' → www.windy.com ALLOWED
//   imgproxy.windy.com     → ALLOWED for feed_url snapshots

const IPCAMLIVE_API_SECRET = '65586c9ba88ef';

// ipcamlive player embed URL — rendered as iframe, no proxy required
function ipcamPlayerUrl(alias: string): string {
  return `https://ipcamlive.com/player/player.php?alias=${alias}`;
}

const ATTiki_ODOS_CAMERAS = [
  {
    alias: 'cam128', name: 'I/C D. Plakentias', city: 'Athens',
    lat: 38.0208, lng: 23.8578,
  },
  {
    alias: 'cam231', name: 'I/C Papagou', city: 'Athens',
    lat: 37.9906, lng: 23.7947,
  },
];

const GREECE_REGIONAL_CAMERAS: CctvCamera[] = [
  {
    id: 'gr-thessaloniki-center-live',
    lat: 40.6401, lng: 22.9444,
    name: 'Thessaloniki – Center (live)', city: 'Thessaloniki', country: 'Greece',
    // YouTube embed → iframe → no proxy needed
    stream_url: 'https://www.youtube.com/embed/7V0IRFbzRFI?autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://www.webcameras.gr/loc_wc/webcameras.asp?ID=510&lang=en',
    source: 'meteothes.gr',
  },
  {
    id: 'gr-kavala-live',
    lat: 40.939, lng: 24.408,
    name: 'Kavala – City View (live)', city: 'Kavala', country: 'Greece',
    // click2stream → iframe → no proxy needed
    stream_url: 'https://city-view-of-kavala.click2stream.com/',
    stream_type: 'iframe',
    external_url: 'https://www.webcameras.gr/loc_wc/webcameras.asp?ID=286&lang=en',
    source: 'click2stream',
  },
];

export async function fetchGreeceCameras(): Promise<CctvCamera[]> {
  // Build Attiki Odos cameras.
  // We call the ipcamlive API to check if streams are live, but because the
  // returned HLS/snapshot hosts are NOT in _CCTV_PROXY_ALLOWED_HOSTS we use
  // the ipcamlive embedded player (iframe) instead — no proxy path needed.
  const attiki: CctvCamera[] = ATTiki_ODOS_CAMERAS.map((cam) => ({
    id: `gr-aodos-${cam.alias}`,
    lat: cam.lat, lng: cam.lng,
    name: cam.name, city: cam.city, country: 'Greece',
    // ipcamlive player iframe — rendered client-side, bypasses proxy entirely
    stream_url: ipcamPlayerUrl(cam.alias),
    stream_type: 'iframe' as const,
    // www.aodos.gr is NOT allowlisted; use ipcamlive page as external fallback
    external_url: `https://ipcamlive.com/camera/${cam.alias}`,
    source: 'Attiki Odos',
  }));

  return [...attiki, ...GREECE_REGIONAL_CAMERAS];
}
