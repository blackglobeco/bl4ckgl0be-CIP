import type { CctvCamera } from './types';

// Allowlist audit:
//   www.windy.com/webcams/{id}/embed → stream_type 'iframe' → www.windy.com ALLOWED ✓
//   images-webcams.windy.com         → NOT in allowlist (imgproxy.windy.com IS)
//   imgproxy.windy.com               → ALLOWED ✓
//   lh3.googleusercontent.com        → NOT in allowlist → external_url only
// Fix:
//   Replace images-webcams.windy.com feed_url with imgproxy.windy.com equivalent
//   Replace lh3.googleusercontent.com feed_url with external_url only

/** Windy embed + imgproxy snapshot — both hosts allowlisted */
function windy(id: string) {
  return {
    stream_url: `https://www.windy.com/webcams/${id}/embed`,
    stream_type: 'iframe' as const,
    // imgproxy.windy.com IS in the allowlist (profile "windy-webcams")
    feed_url: `https://imgproxy.windy.com/${id.slice(0, 2)}/${id}/current/full/${id}.jpg`,
    external_url: `https://www.windy.com/webcams/${id}`,
    source: 'Windy',
  };
}

const TURKEY_CAMERAS: CctvCamera[] = [
  // Makaza / Nymfea (GR-TR border, Rhodopes)
  {
    id: 'tr-makaza-nymfea-1',
    lat: 41.295, lng: 24.137,
    name: 'Makaza – Nymfea Border (cam 1)',
    city: 'Komotini', country: 'Turkey',
    // YouTube embed → iframe → no proxy needed
    stream_url: 'https://www.youtube.com/embed/pnr0lhrqRAc?autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://weather-webcam.eu/ueb-kameri-ot-gkpp-makaza-nimfeya/',
    source: 'YouTube / GKPP',
  },
  {
    id: 'tr-makaza-nymfea-2',
    lat: 41.294, lng: 24.139,
    name: 'Makaza – Nymfea Border (cam 2)',
    city: 'Komotini', country: 'Turkey',
    stream_url: 'https://www.youtube.com/embed/YXN19ZEpIkc?autoplay=1&mute=1',
    stream_type: 'iframe',
    external_url: 'https://weather-webcam.eu/ueb-kameri-ot-gkpp-makaza-nimfeya/',
    source: 'YouTube / GKPP',
  },
  // Kapikule border (BG→TR)
  {
    id: 'tr-kapikule-windy',
    lat: 41.717, lng: 26.330,
    name: 'Kapikule – Customs (TR, BG direction)',
    city: 'Edirne', country: 'Turkey',
    // windy() produces imgproxy.windy.com (ALLOWED) snapshot + www.windy.com embed
    ...windy('1375653055'),
  },
  {
    // lh3.googleusercontent.com NOT allowlisted → external_url only
    id: 'tr-kapikule-entry',
    lat: 41.716, lng: 26.334,
    name: 'Kapikule – Entry Queue (TR)',
    city: 'Edirne', country: 'Turkey',
    external_url: 'http://alltrafficcams.com/tr/canli/sinir-kapisi-gumruk/bulgaristan/turkiye/kapikule-kapitan-andreevo/',
    source: 'alltrafficcams.com',
  },
  {
    id: 'tr-kapikule-exit',
    lat: 41.714, lng: 26.328,
    name: 'Kapikule – Exit Lane (TR)',
    city: 'Edirne', country: 'Turkey',
    external_url: 'http://alltrafficcams.com/tr/canli/sinir-kapisi-gumruk/bulgaristan/turkiye/kapikule-kapitan-andreevo/',
    source: 'alltrafficcams.com',
  },
  // Hamzabeyli border (BG→TR, Lesovo)
  {
    id: 'tr-hamzabeyli-windy',
    lat: 41.970, lng: 26.388,
    name: 'Hamzabeyli – Border (TR, live)',
    city: 'Edirne', country: 'Turkey',
    ...windy('1639080445'),
    external_url: 'https://weather-webcam.eu/lesovo-hamzabeyli-live-kamera-balgaria-turcia-granica-trafik-vremeto/',
  },
  {
    // lh3.googleusercontent.com NOT allowlisted → external_url only
    id: 'tr-hamzabeyli-queue',
    lat: 41.968, lng: 26.385,
    name: 'Hamzabeyli – Queue (TR)',
    city: 'Edirne', country: 'Turkey',
    external_url: 'http://alltrafficcams.com/tr/canli/sinir-kapisi-gumruk/bulgaristan/turkiye/hamzabeyli-lesovo/',
    source: 'alltrafficcams.com',
  },
  {
    // lh3.googleusercontent.com NOT allowlisted → external_url only
    id: 'tr-derekoy-live',
    lat: 41.405, lng: 27.521,
    name: 'Derekoy – Border Queue (TR)',
    city: 'Kirklareli', country: 'Turkey',
    external_url: 'http://alltrafficcams.com/tr/canli/sinir-kapisi-gumruk/bulgaristan/turkiye/derekoy-malko-tarnovo/',
    source: 'alltrafficcams.com',
  },
  // Ipsala border (TR→GR)
  {
    // lh3.googleusercontent.com NOT allowlisted → external_url only
    id: 'tr-ipsala-exit',
    lat: 40.928, lng: 26.245,
    name: 'Ipsala – Passenger Exit (TR)',
    city: 'Edirne', country: 'Turkey',
    external_url: 'http://alltrafficcams.com/tr/canli/sinir-kapisi-gumruk/yunanistan/turkiye/ipsala-kipi/',
    source: 'alltrafficcams.com',
  },
  {
    id: 'tr-ipsala-truck',
    lat: 40.925, lng: 26.248,
    name: 'Ipsala – Truck Park (TR)',
    city: 'Edirne', country: 'Turkey',
    external_url: 'http://alltrafficcams.com/tr/canli/sinir-kapisi-gumruk/yunanistan/turkiye/ipsala-kipi/',
    source: 'alltrafficcams.com',
  },
  {
    // lh3.googleusercontent.com NOT allowlisted → external_url only
    id: 'tr-pazarkule',
    lat: 41.645, lng: 26.478,
    name: 'Pazarkule – Kastanies Border (TR)',
    city: 'Edirne', country: 'Turkey',
    external_url: 'http://alltrafficcams.com/tr/canli/sinir-kapisi-gumruk/yunanistan/turkiye/pazarkule-kestanelik/',
    source: 'alltrafficcams.com',
  },
  // Tekirdag (European coast)
  {
    id: 'tr-tekirdag-cumhuriyet',
    lat: 40.983, lng: 27.515,
    name: 'Tekirdag – Cumhuriyet Mahallesi',
    city: 'Tekirdag', country: 'Turkey',
    ...windy('1641362068'),
  },
  {
    id: 'tr-tekirdag-center',
    lat: 40.978, lng: 27.508,
    name: 'Tekirdag – City Center',
    city: 'Tekirdag', country: 'Turkey',
    ...windy('1610814488'),
  },
  // Istanbul – European side & Bosphorus
  {
    id: 'tr-istanbul-galata',
    lat: 41.019, lng: 28.974,
    name: 'Istanbul – Galata Bridge',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1573888456'),
  },
  {
    id: 'tr-istanbul-sultanahmet',
    lat: 41.009, lng: 28.977,
    name: 'Istanbul – Sultanahmet / Grand Bazaar',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1573537594'),
  },
  {
    id: 'tr-istanbul-bosphorus',
    lat: 41.042, lng: 29.009,
    name: 'Istanbul – Bosphorus (Radisson view)',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1511515262'),
  },
  {
    id: 'tr-istanbul-yavuz-bridge',
    lat: 41.202, lng: 29.121,
    name: 'Istanbul – Yavuz Sultan Selim Bridge',
    city: 'Istanbul', country: 'Turkey',
    ...windy('1601452975'),
  },
];

export async function fetchTurkeyCameras(): Promise<CctvCamera[]> {
  return TURKEY_CAMERAS.filter((cam) => cam.feed_url || cam.stream_url || cam.external_url);
}

export default TURKEY_CAMERAS;
