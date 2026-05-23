import type { CctvCamera } from './types';

// Allowlist audit:
//   streaming1.neotel.net.mk → NOT in _CCTV_PROXY_ALLOWED_HOSTS
//   HLS streams from neotel  → cannot be proxied
// Fix: replace HLS stream_url with YouTube live embed (iframe) where available,
//      and keep external_url so users can open the border crossing site directly.

const MACEDONIA_CAMERAS: CctvCamera[] = [
  {
    id: 'mk-deve-bair',
    lat: 42.149, lng: 22.537,
    name: 'Deve Bair – Gyueshevo Border', city: 'Deve Bair', country: 'North Macedonia',
    // Neotel HLS (streaming1.neotel.net.mk) is NOT allowlisted.
    // Use the official GKPP live YouTube stream (iframe) instead.
    stream_url: 'https://www.youtube.com/embed/live_stream?channel=UCmk8mSPPdlQFf9p8r9HgMkQ&autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://gkpp.mkd.gov.mk/',
    source: 'GKPP / Neotel',
  },
  {
    id: 'mk-tabanovce',
    lat: 42.232, lng: 21.718,
    name: 'Tabanovce – Preševo Border', city: 'Tabanovce', country: 'North Macedonia',
    // Same issue — neotel HLS not allowlisted
    stream_url: 'https://www.youtube.com/embed/live_stream?channel=UCmk8mSPPdlQFf9p8r9HgMkQ&autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://gkpp.mkd.gov.mk/',
    source: 'GKPP / Neotel',
  },
];

export async function fetchMacedoniaCameras(): Promise<CctvCamera[]> {
  return MACEDONIA_CAMERAS.filter((cam) => cam.feed_url || cam.stream_url || cam.external_url);
}
