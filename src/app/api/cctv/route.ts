import { NextResponse } from 'next/server';
import { fetchAsfinagCameras } from './asfinag';
import { fetchBulgariaCameras } from './bulgaria';
import { fetchGreeceCameras } from './greece';
import { fetchSerbiaCameras } from './serbia';
import { fetchMacedoniaCameras } from './macedonia';
import { fetchTurkeyCameras } from './turkey';
import { fetchRomaniaCameras } from './romania';
// ── Sources derived from cctv.py proxy allowlist ─────────────────────────────
import { fetchNYCCameras } from './nyc';
import { fetchAustinCameras } from './austin';
import { fetchGeorgiaCameras } from './georgia';
import { fetchMichiganCameras } from './michigan';
import { fetchColoradoCameras } from './colorado';
import { fetchOregonCameras } from './oregon';
import { fetchSpainCameras } from './spain';
import { fetchWashingtonRegionalCameras, fetchNPSCameras } from './washington-regional';

/**
 * OSIRIS – Worldwide CCTV Camera API v3
 * Viewport-aware: pass ?region=xx to load cameras for specific regions
 *
 * Regions: uk, us-east, us-west, us-central, us-northwest, us-southeast,
 *          us-georgia, us-michigan, us-colorado, us-oregon, canada, europe,
 *          europe-spain, asia, balkans + individual Balkan sub-regions,
 *          nps (National Parks)
 *
 * Or pass ?lat=x&lng=y&radius=5 for proximity-based loading
 *
 * Proxy hosts (cctv.py _CCTV_PROXY_ALLOWED_HOSTS) are respected — all
 * feed_url / stream_url values produced here use only allowlisted hostnames.
 */

// ▄▄▄ EXISTING SOURCE FUNCTIONS ▄▄▄

// ── UK: Transport for London JamCams (~900) ──────────────────────────────────
async function fetchTfLCameras(): Promise<any[]> {
  try {
    const res = await fetch('https://api.tfl.gov.uk/Place/Type/JamCam', { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((cam: any) => {
      const imgProp = cam.additionalProperties?.find((p: any) => p.key === 'imageUrl');
      const camId = cam.id?.replace('JamCams_', '') || '';
      return {
        id: `tfl-${cam.id}`, lat: cam.lat, lng: cam.lon,
        name: cam.commonName || 'London JamCam', city: 'London', country: 'UK',
        // s3-eu-west-1.amazonaws.com & jamcams.tfl.gov.uk — both on allowlist
        feed_url: imgProp?.value || `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/${camId}.jpg`,
        source: 'TfL',
      };
    }).filter((c: any) => c.lat && c.lng);
  } catch { return []; }
}

// ── US-WEST: WSDOT Washington State (~500) ───────────────────────────────────
// images.wsdot.wa.gov — on allowlist, profile "wsdot"
async function fetchWSDOTCameras(): Promise<any[]> {
  try {
    const res = await fetch('https://data.wsdot.wa.gov/log/public/cameras.json', { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((cam: any) => ({
      id: `wsdot-${cam.CameraID}`,
      lat: cam.CameraLocation?.Latitude, lng: cam.CameraLocation?.Longitude,
      name: cam.Title || 'WSDOT Camera', city: 'Washington', country: 'US',
      // images.wsdot.wa.gov is on the proxy allowlist
      feed_url: cam.ImageURL || '', source: 'WSDOT',
    })).filter((c: any) => c.lat && c.lng && c.feed_url);
  } catch { return []; }
}

// ── US-WEST: Caltrans California Districts ───────────────────────────────────
// cwwp2.dot.ca.gov + wzmedia.dot.ca.gov — both on allowlist, profile "caltrans"
async function fetchCaltransCameras(): Promise<any[]> {
  const allCams: any[] = [];
  for (const dist of ['d03','d04','d05','d06','d07','d08','d10','d11','d12']) {
    try {
      const res = await fetch(
        `https://cwwp2.dot.ca.gov/data/${dist}/cctv/cctvStatus${dist.toUpperCase()}.json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const cam of (data?.data || [])) {
        const lat = parseFloat(cam.location?.latitude);
        const lng = parseFloat(cam.location?.longitude);
        // HLS streams served from wzmedia.dot.ca.gov (also allowlisted)
        const url = cam.cctv?.imageData?.static?.currentImageURL
          || cam.cctv?.streamData?.hls?.url;
        if (!lat || !lng || !url) continue;
        allCams.push({
          id: `cal-${allCams.length}`, lat, lng,
          name: cam.location?.locationName || 'Caltrans', city: 'California', country: 'US',
          feed_url: url, source: 'Caltrans',
        });
      }
    } catch { /* silent */ }
  }
  return allCams;
}

// ── CANADA: Ontario 511, Montréal, Ottawa curated, Alberta 511 ───────────────
async function fetchCanadaCameras(): Promise<any[]> {
  const cams: any[] = [];

  try {
    const res = await fetch('https://511on.ca/api/v2/get/cameras', {
      signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || [])) {
        if (!cam.latitude || !cam.longitude) continue;
        cams.push({
          id: `on-${cam.id || cams.length}`, lat: cam.latitude, lng: cam.longitude,
          name: cam.description || cam.name || 'Ontario Camera', city: 'Ontario', country: 'Canada',
          feed_url: cam.imageUrl || cam.url || '', source: '511 Ontario',
        });
      }
    }
  } catch { /* silent */ }

  try {
    const res = await fetch(
      'https://ville.montreal.qc.ca/circulation/sites/ville.montreal.qc.ca.circulation/files/cameras.json',
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || [])) {
        cams.push({
          id: `mtl-${cams.length}`, lat: cam.latitude || cam.lat, lng: cam.longitude || cam.lng,
          name: cam.description || cam.name || 'Montréal Camera', city: 'Montréal', country: 'Canada',
          feed_url: cam.url || cam.imageUrl || '', source: 'Ville MTL',
        });
      }
    }
  } catch { /* silent */ }

  const ottawaCurated = [
    { id: 'ott-1', lat: 45.4215, lng: -75.6972, name: 'Parliament Hill / Wellington', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=1' },
    { id: 'ott-2', lat: 45.4231, lng: -75.6831, name: 'Rideau / Sussex', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=2' },
    { id: 'ott-3', lat: 45.4195, lng: -75.7009, name: 'Bank / Sparks', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=3' },
    { id: 'ott-4', lat: 45.4249, lng: -75.6950, name: 'King Edward / Rideau', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=4' },
    { id: 'ott-5', lat: 45.3968, lng: -75.7398, name: 'Merivale / Baseline', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=5' },
    { id: 'ott-6', lat: 45.3484, lng: -75.7580, name: 'Fallowfield / Woodroffe', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=6' },
    { id: 'ott-7', lat: 45.4012, lng: -75.6518, name: 'Hwy 417 / Vanier Pkwy', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=7' },
    { id: 'ott-8', lat: 45.4475, lng: -75.4822, name: 'Innes / Orleans Blvd', city: 'Ottawa', feed_url: 'https://traffic.ottawa.ca/map/camera?id=8' },
    { id: 'tor-1', lat: 43.6532, lng: -79.3832, name: 'Yonge / Dundas Square', city: 'Toronto', feed_url: 'https://511on.ca/api/v2/get/cameras' },
    { id: 'tor-2', lat: 43.6426, lng: -79.3871, name: 'CN Tower / Lakeshore', city: 'Toronto', feed_url: 'https://511on.ca/api/v2/get/cameras' },
    { id: 'tor-3', lat: 43.6711, lng: -79.3868, name: 'Bloor / Yonge', city: 'Toronto', feed_url: 'https://511on.ca/api/v2/get/cameras' },
  ];
  cams.push(...ottawaCurated.map(c => ({ ...c, country: 'Canada', source: 'Ottawa' })));

  try {
    const res = await fetch('https://511.alberta.ca/api/v2/get/cameras', {
      signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || [])) {
        if (!cam.Latitude || !cam.Longitude || !cam.Views?.[0]?.Url) continue;
        cams.push({
          id: `ab-${cam.Id || cams.length}`, lat: cam.Latitude, lng: cam.Longitude,
          name: cam.Location || 'Alberta Camera', city: 'Alberta', country: 'Canada',
          feed_url: cam.Views[0].Url, source: 'Alberta 511',
        });
      }
    }
  } catch { /* silent */ }

  return cams.filter((c: any) => c.lat && c.lng);
}

// ── US-CENTRAL: Illinois DOT (gettingaroundillinois.com / cctv.travelmidwest.com) ──
// Both hosts on _CCTV_PROXY_ALLOWED_HOSTS, profile "illinois-dot"
async function fetchUSCentralCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Primary: gettingaroundillinois.com (direct JPEG image host)
  try {
    const res = await fetch(
      'https://www.gettingaroundillinois.com/lmiga/cameraReport.json',
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.cameraReports || data || []).slice(0, 800)) {
        if (!cam.latitude || !cam.longitude) continue;
        cams.push({
          id: `ildot-${cams.length}`, lat: cam.latitude, lng: cam.longitude,
          name: cam.cameraName || cam.description || 'IDOT Camera', city: 'Illinois', country: 'US',
          // gettingaroundillinois.com is on the allowlist for image proxy
          feed_url: cam.imageUrl
            || (cam.cameraId ? `https://gettingaroundillinois.com/images/${cam.cameraId}.jpg` : '')
            || cam.url || '',
          source: 'IDOT',
        });
      }
    }
  } catch { /* silent */ }

  // Fallback: cctv.travelmidwest.com (covers IL + IN + OH)
  if (cams.length === 0) {
    try {
      const res = await fetch(
        'https://www.travelmidwest.com/lmiga/cameraReport.json',
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        for (const cam of (data?.cameraReports || data || []).slice(0, 800)) {
          if (!cam.latitude || !cam.longitude) continue;
          cams.push({
            id: `mw-${cams.length}`, lat: cam.latitude, lng: cam.longitude,
            name: cam.cameraName || cam.description || 'Midwest Camera', city: 'Illinois', country: 'US',
            feed_url: cam.imageUrl
              ? `https://cctv.travelmidwest.com${cam.imageUrl.startsWith('/') ? '' : '/'}${cam.imageUrl}`
              : '',
            source: 'Travel Midwest',
          });
        }
      }
    } catch { /* silent */ }
  }

  return cams.filter((c: any) => c.lat && c.lng);
}

// ── US-EAST: Butler County OH, Cincinnati, Florida 511 ───────────────────────
async function fetchUSEastCameras(): Promise<any[]> {
  const cams: any[] = [];

  cams.push(
    {
      id: 'butler-oh-hamilton', lat: 39.3988617, lng: -84.5595353,
      name: 'Hamilton, OH', city: 'Hamilton', country: 'US',
      feed_url: 'https://gsccam.butlersheriff.org/axis-cgi/jpg/image.cgi',
      external_url: 'https://gsccam.butlersheriff.org/camera/index.html#/video',
      source: 'Butler County, OH',
    },
    {
      id: 'butler-oh-129-747', lat: 39.381435, lng: -84.438423,
      name: 'OH-129 at 747', city: 'Butler County', country: 'US',
      feed_url: 'https://towercam.butlersheriff.org/axis-cgi/jpg/image.cgi',
      external_url: 'https://towercam.butlersheriff.org/aca/index.html#view',
      source: 'Butler County, OH',
    },
    {
      id: 'cincinnati-cincyvision-yt', lat: 39.089101, lng: -84.527943,
      name: 'CincyVision YT', city: 'Cincinnati', country: 'US',
      external_url: 'https://www.youtube.com/@AaronPreslin/live',
      source: 'Cincinnati, OH',
    },
    {
      id: 'cincinnati-covington-earthcam', lat: 39.090510, lng: -84.510413,
      name: 'Cincinnati-Covington EarthCam', city: 'Covington', country: 'US',
      external_url: 'https://www.earthcam.com/usa/kentucky/covington/?cam=covington',
      source: 'Cincinnati, OH',
    },
  );

  try {
    const res = await fetch('https://fl511.com/api/v2/cameras', {
      signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || []).slice(0, 800)) {
        if (!cam.latitude || !cam.longitude) continue;
        cams.push({
          id: `fl-${cams.length}`, lat: cam.latitude, lng: cam.longitude,
          name: cam.description || 'FL-511 Camera', city: 'Florida', country: 'US',
          feed_url: cam.imageUrl || '', source: 'FL-511',
        });
      }
    }
  } catch { /* silent */ }

  return cams.filter((c: any) => c.lat && c.lng);
}

// ── EUROPE: Netherlands RWS + ASFINAG Austria ─────────────────────────────────
async function fetchEuropeCameras(): Promise<any[]> {
  const cams: any[] = [];
  try {
    const res = await fetch('https://opendata.ndw.nu/cameras.json', { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || []).slice(0, 1000)) {
        if (!cam.lat || !cam.lng) continue;
        cams.push({
          id: `nl-${cams.length}`, lat: cam.lat, lng: cam.lng,
          name: cam.name || 'NL Camera', city: 'Netherlands', country: 'NL',
          feed_url: cam.imageUrl || '', source: 'RWS',
        });
      }
    }
  } catch { /* silent */ }
  cams.push(...await fetchAsfinagCameras());
  return cams.filter((c: any) => c.lat && c.lng);
}

// ── ASIA/PACIFIC: Singapore LTA ───────────────────────────────────────────────
// images.data.gov.sg — on allowlist, profile "lta-singapore"
async function fetchAsiaCameras(): Promise<any[]> {
  const cams: any[] = [];
  try {
    const res = await fetch('https://api.data.gov.sg/v1/transport/traffic-images', { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      const items = data.items?.[0]?.cameras || [];
      for (const cam of items) {
        if (!cam.location?.latitude || !cam.location?.longitude || !cam.image) continue;
        cams.push({
          id: `sin-${cam.camera_id}`,
          lat: cam.location.latitude, lng: cam.location.longitude,
          name: `Camera ${cam.camera_id}`, city: 'Singapore', country: 'Singapore',
          // images.data.gov.sg is on allowlist
          feed_url: cam.image,
          source: 'LTA Singapore',
        });
      }
    }
  } catch { /* silent */ }
  return cams;
}


// ▄▄▄ REGION MAPPING ▄▄▄
const REGION_FETCHERS: Record<string, () => Promise<any[]>> = {
  // Existing ─────────────────────────────────────────────────────────────────
  'uk':             fetchTfLCameras,
  'us-west':        async () => [...await fetchWSDOTCameras(), ...await fetchCaltransCameras()],
  'us-east':        fetchUSEastCameras,
  'us-central':     fetchUSCentralCameras,
  'canada':         fetchCanadaCameras,
  'europe':         fetchEuropeCameras,
  'asia':           fetchAsiaCameras,
  // Balkan sources (existing separate files) ─────────────────────────────────
  'bulgaria':       fetchBulgariaCameras,
  'greece':         fetchGreeceCameras,
  'serbia':         fetchSerbiaCameras,
  'macedonia':      fetchMacedoniaCameras,
  'turkey':         fetchTurkeyCameras,
  'romania':        fetchRomaniaCameras,
  // ── New: from cctv.py allowlist ───────────────────────────────────────────
  'us-nyc':         fetchNYCCameras,             // webcams.nyctmc.org
  'us-austin':      fetchAustinCameras,           // cctv.austinmobility.io
  'us-georgia':     fetchGeorgiaCameras,          // navigator-c2c / vss*live / 511ga.org
  'us-michigan':    fetchMichiganCameras,         // mdotjboss.state.mi.us / micamerasimages.net
  'us-colorado':    fetchColoradoCameras,         // publicstreamer*.cotrip.org / cocam.carsprogram.org
  'us-oregon':      fetchOregonCameras,           // tripcheck.com
  'us-northwest':   fetchWashingtonRegionalCameras, // olypen / forks / seattle.gov / nps.gov / etc.
  'nps':            fetchNPSCameras,              // www.nps.gov (national parks)
  'europe-spain':   fetchSpainCameras,            // infocar.dgt.es / informo.madrid.es
};

// Determine which regions to fetch based on viewport centre + radius
function getRegionsForBounds(lat: number, lng: number, radius: number): string[] {
  const regions: string[] = [];

  // ── United Kingdom ────────────────────────────────────────────────────────
  if (lat > 49 && lat < 61 && lng > -8 && lng < 2) regions.push('uk');

  // ── United States – broad bounding boxes ──────────────────────────────────
  // Pacific Northwest (WA/OR)
  if (lat > 42 && lat < 49.5 && lng > -125 && lng < -116) {
    regions.push('us-west', 'us-northwest', 'us-oregon');
  }
  // California
  if (lat > 32 && lat < 42 && lng > -125 && lng < -114) regions.push('us-west');
  // Rocky Mountain / Colorado
  if (lat > 36.5 && lat < 41.5 && lng > -109.5 && lng < -102) regions.push('us-colorado');
  // US Midwest / Central (IL, IN, OH, etc.)
  if (lat > 36 && lat < 49 && lng > -97 && lng < -80) regions.push('us-central', 'us-michigan');
  // US Southeast / Georgia
  if (lat > 30 && lat < 35.5 && lng > -85.5 && lng < -80.5) regions.push('us-georgia', 'us-east');
  // Florida
  if (lat > 24 && lat < 31 && lng > -88 && lng < -80) regions.push('us-east');
  // Texas / Austin
  if (lat > 25.5 && lat < 36.5 && lng > -107 && lng < -93) regions.push('us-austin');
  // NYC metro
  if (lat > 40.4 && lat < 41.4 && lng > -74.5 && lng < -73.6) regions.push('us-nyc', 'us-east');
  // General US East fallback
  if (lat > 24 && lat < 49 && lng > -85 && lng < -66) regions.push('us-east');

  // ── Canada ────────────────────────────────────────────────────────────────
  if (lat > 42 && lat < 70 && lng > -141 && lng < -52) regions.push('canada');

  // ── Europe ────────────────────────────────────────────────────────────────
  // Spain / Iberian Peninsula
  if (lat > 35.5 && lat < 44 && lng > -9.5 && lng < 4.5) regions.push('europe-spain');
  // Balkan sub-regions (granular)
  const inBulgaria  = lat > 41 && lat < 44.5 && lng > 22 && lng < 29.5;
  const inGreece    = lat > 34.5 && lat < 41.8 && lng > 19 && lng < 30;
  const inSerbia    = lat > 42 && lat < 46.5 && lng > 18.8 && lng < 23.3;
  const inMacedonia = lat > 40.8 && lat < 42.8 && lng > 20.4 && lng < 23.2;
  const inRomania   = lat > 43.5 && lat < 48.5 && lng > 20 && lng < 29.8;
  const inTurkey    = lat > 35.5 && lat < 42.5 && lng > 25.5 && lng < 45;
  const inBalkans   = inBulgaria || inGreece || inSerbia || inMacedonia || inRomania || inTurkey;
  if (inBulgaria)  regions.push('bulgaria');
  if (inGreece)    regions.push('greece');
  if (inSerbia)    regions.push('serbia');
  if (inMacedonia) regions.push('macedonia');
  if (inRomania)   regions.push('romania');
  if (inTurkey)    regions.push('turkey');
  // General Europe (excl. Balkans handled above)
  if (lat > 35 && lat < 72 && lng > -11 && lng < 40 && !inBalkans) regions.push('europe');

  // ── Asia/Pacific ──────────────────────────────────────────────────────────
  if (lat > -10 && lat < 60 && lng > 60 && lng < 150) regions.push('asia');
  // Australia
  if (lat > -45 && lat < -10 && lng > 110 && lng < 155) regions.push('asia');

  // ── National Parks (US-wide overlay) ─────────────────────────────────────
  if (lat > 24 && lat < 72 && lng > -172 && lng < -66) regions.push('nps');

  return regions.length > 0 ? [...new Set(regions)] : ['uk', 'us-east'];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10');

    let regionsToFetch: string[];

    if (region === 'all') {
      regionsToFetch = Object.keys(REGION_FETCHERS);
    } else if (region) {
      regionsToFetch = region.split(',').filter(r => r in REGION_FETCHERS);
    } else if (lat !== 0 || lng !== 0) {
      regionsToFetch = getRegionsForBounds(lat, lng, radius);
    } else {
      // Default: full global load
      regionsToFetch = Object.keys(REGION_FETCHERS);
    }

    const results = await Promise.allSettled(
      regionsToFetch.map(r => REGION_FETCHERS[r]())
    );

    const allCameras: any[] = [];
    const sources: Record<string, number> = {};

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const cam of result.value) {
          allCameras.push(cam);
          sources[cam.source] = (sources[cam.source] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      cameras: allCameras,
      total: allCameras.length,
      sources,
      regions: regionsToFetch,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('CCTV fetch error:', error);
    return NextResponse.json({ cameras: [], error: 'Failed' }, { status: 500 });
  }
}
