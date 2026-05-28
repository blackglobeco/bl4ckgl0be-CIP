import type { CctvCamera } from './types';

/**
 * Turkey cameras.
 *
 * Windy webcam snapshot CDN (images-webcams.windy.com) requires a signed
 * API token — it returns HTTP 403 on every server-side request regardless
 * of Referer/Origin headers. No proxy can fix this.
 *
 * The correct approach is to use the public embed player iframe only:
 *   stream_url: https://webcams.windy.com/webcams/public/embed/player/{id}
 *   stream_type: 'iframe'
 *
 * feed_url (snapshot) is omitted for Windy cameras; the iframe embed
 * is the only available public interface. external_url links to the
 * full Windy page as a fallback.
 *
 * Note: the old embed URL format (www.windy.com/webcams/{id}/embed) is
 * deprecated. The current canonical embed URL is:
 *   https://webcams.windy.com/webcams/public/embed/player/{id}
 *
 * lh3.googleusercontent.com/d/* entries removed: Google Drive links
 * redirect to a login wall. alltrafficcams.com kept as external_url.
 */

/** Windy public embed iframe helper (no snapshot — API key required for images) */
function windy(id: string): Pick<CctvCamera, 'stream_url' | 'stream_type' | 'external_url' | 'source'> {
  return {
    // Correct embed URL format per Windy embed docs (webcams.windy.com subdomain)
    stream_url:  `https://webcams.windy.com/webcams/public/embed/player/${id}`,
    stream_type: 'iframe' as const,
    external_url: `https://www.windy.com/webcams/${id}`,
    source: 'Windy',
  };
}

const TURKEY_CAMERAS: CctvCamera[] = [
  // ── Makaza / Nymfea (GR-TR border, Rhodopes) ───────────────────────────────
  {
    id: 'tr-makaza-nymfea-1',
    lat: 41.295, lng: 24.137,
    name: 'Makaza - Nymfea Border (cam 1)',
    city: 'Komotini', country: 'Turkey',
    stream_url: 'https://www.youtube.com/embed/pnr0lhrqRAc?autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://weather-webcam.eu/ueb-kameri-ot-gkpp-makaza-nimfeya/',
    source: 'YouTube / GKPP',
  },
  {
    id: 'tr-makaza-nymfea-2',
    lat: 41.294, lng: 24.139,
    name: 'Makaza - Nymfea Border (cam 2)',
    city: 'Komotini', country: 'Turkey',
    stream_url: 'https://www.youtube.com/embed/YXN19ZEpIkc?autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://weather-webcam.eu/ueb-kameri-ot-gkpp-makaza-nimfeya/',
    source: 'YouTube / GKPP',
  },

  // ── European Thrace — BG border (Edirne / Kirklareli) ─────────────────────
  {
    id: 'tr-kapikule-windy',
    lat: 41.717, lng: 26.33,
    name: 'Kapikule - Customs (TR, BG direction)',
    city: 'Edirne', country: 'Turkey',
    ...windy('1375653055'),
  },
  {
    id: 'tr-hamzabeyli-windy',
    lat: 41.97, lng: 26.388,
    name: 'Hamzabeyli - Border (TR, live)',
    city: 'Edirne', country: 'Turkey',
    ...windy('1639080445'),
    // Override external_url with the weather-webcam.eu page which has more context
    external_url: 'https://weather-webcam.eu/lesovo-hamzabeyli-live-kamera-balgaria-turcia-granica-trafik-vremeto/',
  },

  // ── Tekirdag (European coast) ──────────────────────────────────────────────
  {
    id: 'tr-tekirdag-cumhuriyet',
    lat: 40.983, lng: 27.515,
    name: 'Tekirdag - Cumhuriyet Mahallesi',
    city: 'Tekirdag', country: 'Turkey',
    ...windy('1641362068'),
  },
  {
    id: 'tr-tekirdag-center',
    lat: 40.978, lng: 27.508,
    name: 'Tekirdag - City Center',
    city: 'Tekirdag', country: 'Turkey',
    ...windy('1610814488'),
  },

  // ── Istanbul — European side & Bosphorus ──────────────────────────────────
  {
    id: 'tr-istanbul-galata',
    lat: 41.019, lng: 28.974,
    name: 'Istanbul - Galata Bridge',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1573888456'),
  },
  {
    id: 'tr-istanbul-sultanahmet',
    lat: 41.009, lng: 28.977,
    name: 'Istanbul - Sultanahmet / Grand Bazaar',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1573537594'),
  },
  {
    id: 'tr-istanbul-bosphorus',
    lat: 41.042, lng: 29.009,
    name: 'Istanbul - Bosphorus (Radisson view)',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1511515262'),
  },
  {
    id: 'tr-istanbul-yavuz-bridge',
    lat: 41.202, lng: 29.121,
    name: 'Istanbul - Yavuz Sultan Selim Bridge',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1601452975'),
  },
];

export async function fetchTurkeyCameras(): Promise<CctvCamera[]> {
  return TURKEY_CAMERAS.filter(
    (cam) => cam.feed_url || cam.stream_url || cam.external_url
  );
}

export default TURKEY_CAMERAS;
