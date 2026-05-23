import type { CctvCamera } from './types';

// Allowlist audit:
//   home-solutions.bg → NOT in _CCTV_PROXY_ALLOWED_HOSTS
// Fix: replace with Windy webcam covering Bucharest (www.windy.com ALLOWED,
//      imgproxy.windy.com ALLOWED for snapshots).

const ROMANIA_CAMERAS: CctvCamera[] = [
  {
    id: 'ro-bucharest-windy',
    lat: 44.4268, lng: 26.1025,
    name: 'Bucharest – City Centre Panorama', city: 'Bucharest', country: 'Romania',
    // www.windy.com → ALLOWED (profile "windy-webcams"), stream_type iframe
    stream_url: 'https://www.windy.com/webcams/1511515262/embed',
    stream_type: 'iframe',
    // imgproxy.windy.com → ALLOWED for snapshot
    feed_url: 'https://imgproxy.windy.com/15/1511515262/current/full/1511515262.jpg',
    external_url: 'https://www.windy.com/webcams/1511515262',
    source: 'Windy',
  },
  {
    id: 'ro-bucharest-a1',
    lat: 44.4390, lng: 26.0521,
    name: 'Bucharest – A1 Motorway (Centura)', city: 'Bucharest', country: 'Romania',
    // CNAIR does not have an open camera API; external_url to traffic portal
    external_url: 'https://www.traffic.ro/',
    source: 'CNAIR',
  },
  {
    id: 'ro-constanta-port',
    lat: 44.1598, lng: 28.6348,
    name: 'Constanța – Port (Black Sea)', city: 'Constanța', country: 'Romania',
    stream_url: 'https://www.windy.com/webcams/1594027155/embed',
    stream_type: 'iframe',
    feed_url: 'https://imgproxy.windy.com/15/1594027155/current/full/1594027155.jpg',
    external_url: 'https://www.windy.com/webcams/1594027155',
    source: 'Windy',
  },
];

export async function fetchRomaniaCameras(): Promise<CctvCamera[]> {
  return ROMANIA_CAMERAS.filter((cam) => cam.feed_url || cam.stream_url || cam.external_url);
}
