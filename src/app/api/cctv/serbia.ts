import type { CctvCamera } from './types';

// Allowlist audit:
//   stream.uzivobeograd.rs  → NOT in _CCTV_PROXY_ALLOWED_HOSTS
//   kamere.amss.org.rs      → NOT in _CCTV_PROXY_ALLOWED_HOSTS
// Fix:
//   Belgrade cam  → Windy webcam covering Belgrade (www.windy.com + imgproxy.windy.com ALLOWED)
//   Kalotina HLS  → YouTube live embed (iframe, no proxy needed) or external_url

const SERBIA_CAMERAS: CctvCamera[] = [
  {
    id: 'rs-belgrade-windy',
    lat: 44.817, lng: 20.456,
    name: 'Belgrade – City View', city: 'Belgrade', country: 'Serbia',
    // www.windy.com → ALLOWED (stream_type iframe)
    stream_url: 'https://www.windy.com/webcams/1511515270/embed',
    stream_type: 'iframe',
    // imgproxy.windy.com → ALLOWED for snapshot
    feed_url: 'https://imgproxy.windy.com/15/1511515270/current/full/1511515270.jpg',
    external_url: 'https://www.windy.com/webcams/1511515270',
    source: 'Windy',
  },
  {
    id: 'rs-kalotina-gradina-1',
    lat: 42.997, lng: 22.882,
    name: 'Kalotina – Gradina Border (lane 1)', city: 'Gradina', country: 'Serbia',
    // kamere.amss.org.rs HLS NOT allowlisted.
    // AMSS publishes border camera footage on YouTube — use iframe embed.
    stream_url: 'https://www.youtube.com/embed/live_stream?channel=UCamss&autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://www.amss.org.rs/granicni-prelazi/',
    source: 'AMSS / GKPP',
  },
  {
    id: 'rs-horgos',
    lat: 46.168, lng: 19.980,
    name: 'Horgoš – Hungary Border', city: 'Horgoš', country: 'Serbia',
    external_url: 'https://www.amss.org.rs/granicni-prelazi/',
    source: 'AMSS / GKPP',
  },
];

export async function fetchSerbiaCameras(): Promise<CctvCamera[]> {
  return SERBIA_CAMERAS.filter((cam) => cam.feed_url || cam.stream_url || cam.external_url);
}
