import { NextResponse } from 'next/server';
import { fetchAsfinagCameras } from './asfinag';
import { fetchBulgariaCameras } from './bulgaria';
import { fetchGreeceCameras } from './greece';
import { fetchSerbiaCameras } from './serbia';
import { fetchMacedoniaCameras } from './macedonia';
import { fetchTurkeyCameras } from './turkey';
import { fetchRomaniaCameras } from './romania';
import { fetchMalaysiaCameras } from './malaysia';
import { fetchAustraliaCameras } from './australia';
import { fetchBlackeyeCameras } from './blackeye';

// ── New sources ported from Shadowbroker ──────────────────────────────────────
import {
  fetchAustinTXCameras,
  fetchNYCDOTCameras,
  fetchGeorgiaDOTCameras,
  fetchIllinoisDOTCameras,
  fetchMichiganDOTCameras,
} from './us-east';
import {
  fetchCaltransCameras,
  fetchWSDOTCameras,
  fetchColoradoDOTCameras,
  fetchOregonDOTCameras,
} from './us-west-extended';
import {
  fetchDGTSpainCameras,
  fetchMadridCityCameras,
  fetchNetherlandsCameras,
} from './europe-extended';

/**
 * OSIRIS — Worldwide CCTV Camera API v2
 * Viewport-aware: pass ?region=xx to load cameras for specific regions.
 * Sources now include Shadowbroker ports: Austin TX, NYC DOT, Georgia DOT,
 * Illinois DOT, Michigan DOT, Caltrans (all 12 districts), WSDOT ArcGIS,
 * Colorado DOT, Oregon TripCheck, DGT Spain, Madrid City Hall, Netherlands RWS.
 * Blackeye: 743 worldwide open RTSP cameras (SE Asia, US, UK, AU, ME, etc.)
 */

// ═══ CAMERA SOURCE DEFINITIONS ═══

// ── UK: Transport for London JamCams (~900) ──────────────────────────────────
async function fetchTfLCameras(): Promise<any[]> {
  try {
    const res = await fetch('https://api.tfl.gov.uk/Place/Type/JamCam', {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || [])
      .map((cam: any) => {
        const imgProp = cam.additionalProperties?.find((p: any) => p.key === 'imageUrl');
        const camId = cam.id?.replace('JamCams_', '') || '';
        return {
          id: `tfl-${cam.id}`,
          lat: cam.lat,
          lng: cam.lon,
          name: cam.commonName || 'London JamCam',
          city: 'London',
          country: 'UK',
          feed_url:
            imgProp?.value ||
            `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/${camId}.jpg`,
          source: 'TfL',
        };
      })
      .filter((c: any) => c.lat && c.lng);
  } catch {
    return [];
  }
}

// ── US-WEST: Caltrans (all 12 districts) + WSDOT ArcGIS + Colorado + Oregon ──
async function fetchUSWestCameras(): Promise<any[]> {
  const [caltrans, wsdot, colorado, oregon] = await Promise.allSettled([
    fetchCaltransCameras(),
    fetchWSDOTCameras(),
    fetchColoradoDOTCameras(),
    fetchOregonDOTCameras(),
  ]);
  return [
    ...(caltrans.status === 'fulfilled' ? caltrans.value : []),
    ...(wsdot.status  === 'fulfilled' ? wsdot.value  : []),
    ...(colorado.status === 'fulfilled' ? colorado.value : []),
    ...(oregon.status === 'fulfilled' ? oregon.value   : []),
  ];
}

// ── US-EAST: NYC DOT + Georgia DOT + Illinois DOT + Michigan DOT ─────────────
async function fetchUSEastCameras(): Promise<any[]> {
  const [nyc, georgia, illinois, michigan] = await Promise.allSettled([
    fetchNYCDOTCameras(),
    fetchGeorgiaDOTCameras(),
    fetchIllinoisDOTCameras(),
    fetchMichiganDOTCameras(),
  ]);

  const curated: any[] = [
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
      id: 'cincinnati-covington-earthcam', lat: 39.090510, lng: -84.510413,
      name: 'Cincinnati-Covington EarthCam', city: 'Covington', country: 'US',
      external_url: 'https://www.earthcam.com/usa/kentucky/covington/?cam=covington',
      source: 'Cincinnati, OH',
    },
  ];

  return [
    ...(nyc.status      === 'fulfilled' ? nyc.value      : []),
    ...(georgia.status  === 'fulfilled' ? georgia.value  : []),
    ...(illinois.status === 'fulfilled' ? illinois.value : []),
    ...(michigan.status === 'fulfilled' ? michigan.value : []),
    ...curated,
  ].filter((c) => c.lat && c.lng);
}

// ── US-CENTRAL: Austin TX + Illinois TravelMidwest fallback ─────────────────
async function fetchUSCentralCameras(): Promise<any[]> {
  const cams: any[] = [];

  const [austin] = await Promise.allSettled([fetchAustinTXCameras()]);
  if (austin.status === 'fulfilled') cams.push(...austin.value);

  // TravelMidwest fallback (covers cases where ArcGIS FeatureServer is slow)
  try {
    const res = await fetch('https://www.travelmidwest.com/lmiga/cameraReport.json', {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data?.cameraReports || data || []).slice(0, 800)) {
        if (!cam.latitude || !cam.longitude) continue;
        cams.push({
          id: `ildot-legacy-${cams.length}`,
          lat: cam.latitude,
          lng: cam.longitude,
          name: cam.cameraName || cam.description || 'IDOT Camera',
          city: 'Illinois',
          country: 'US',
          feed_url: cam.imageUrl || cam.url || '',
          source: 'IDOT (TravelMidwest)',
        });
      }
    }
  } catch { /* silent */ }

  // Florida 511
  try {
    const res = await fetch('https://fl511.com/api/v2/cameras', {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
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

  return cams.filter((c) => c.lat && c.lng);
}

// ── CANADA: Ontario 511 + Alberta 511 + Montréal ────────────────────────────
async function fetchCanadaCameras(): Promise<any[]> {
  const cams: any[] = [];

  try {
    const res = await fetch('https://511on.ca/api/v2/get/cameras', {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      for (const cam of (await res.json()) || []) {
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
    const res = await fetch('https://511.alberta.ca/api/v2/get/cameras', {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      for (const cam of (await res.json()) || []) {
        if (!cam.Latitude || !cam.Longitude || !cam.Views?.[0]?.Url) continue;
        cams.push({
          id: `ab-${cam.Id || cams.length}`, lat: cam.Latitude, lng: cam.Longitude,
          name: cam.Location || 'Alberta Camera', city: 'Alberta', country: 'Canada',
          feed_url: cam.Views[0].Url, source: 'Alberta 511',
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
      for (const cam of (await res.json()) || []) {
        cams.push({
          id: `mtl-${cams.length}`, lat: cam.latitude || cam.lat, lng: cam.longitude || cam.lng,
          name: cam.description || cam.name || 'Montréal Camera', city: 'Montréal', country: 'Canada',
          feed_url: cam.url || cam.imageUrl || '', source: 'Ville MTL',
        });
      }
    }
  } catch { /* silent */ }

  return cams.filter((c) => c.lat && c.lng);
}

// ── EUROPE: ASFINAG + Netherlands RWS + DGT Spain + Madrid City Hall ─────────
async function fetchEuropeCameras(): Promise<any[]> {
  const [asfinag, nl, dgt, madrid] = await Promise.allSettled([
    fetchAsfinagCameras(),
    fetchNetherlandsCameras(),
    fetchDGTSpainCameras(),
    fetchMadridCityCameras(),
  ]);
  return [
    ...(asfinag.status === 'fulfilled' ? asfinag.value : []),
    ...(nl.status     === 'fulfilled' ? nl.value     : []),
    ...(dgt.status    === 'fulfilled' ? dgt.value    : []),
    ...(madrid.status === 'fulfilled' ? madrid.value : []),
  ].filter((c) => c.lat && c.lng);
}

// ── ASIA/PACIFIC: Singapore LTA + Australia Live Traffic ────────────────────
async function fetchAsiaCameras(): Promise<any[]> {
  const cams: any[] = [];

  try {
    const res = await fetch('https://api.data.gov.sg/v1/transport/traffic-images', {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      for (const cam of data.items?.[0]?.cameras || []) {
        if (!cam.location?.latitude || !cam.location?.longitude || !cam.image) continue;
        cams.push({
          id: `sin-${cam.camera_id}`,
          lat: cam.location.latitude,
          lng: cam.location.longitude,
          name: `Camera ${cam.camera_id}`,
          city: 'Singapore',
          country: 'Singapore',
          feed_url: cam.image,
          source: 'LTA Singapore',
        });
      }
    }
  } catch { /* silent */ }

  return cams;
}

// ═══ REGION MAPPING ═══
const REGION_FETCHERS: Record<string, () => Promise<any[]>> = {
  // Composite regions
  'uk':         fetchTfLCameras,
  'us-west':    fetchUSWestCameras,
  'us-east':    fetchUSEastCameras,
  'us-central': fetchUSCentralCameras,
  'canada':     fetchCanadaCameras,
  'europe':     fetchEuropeCameras,
  'asia':       fetchAsiaCameras,

  // Granular Balkan / Eastern Europe
  'bulgaria':  fetchBulgariaCameras,
  'greece':    fetchGreeceCameras,
  'serbia':    fetchSerbiaCameras,
  'macedonia': fetchMacedoniaCameras,
  'turkey':    fetchTurkeyCameras,
  'romania':   fetchRomaniaCameras,

  // Asia-Pacific specific
  'malaysia':  fetchMalaysiaCameras,
  'australia': fetchAustraliaCameras,

  // Worldwide open RTSP cameras via Blackeye proxy
  'blackeye':  fetchBlackeyeCameras,

  // Granular US sub-regions (for explicit ?region= requests)
  'us-austin':   fetchAustinTXCameras,
  'us-nyc':      fetchNYCDOTCameras,
  'us-georgia':  fetchGeorgiaDOTCameras,
  'us-illinois': fetchIllinoisDOTCameras,
  'us-michigan': fetchMichiganDOTCameras,
  'us-caltrans': fetchCaltransCameras,
  'us-wsdot':    fetchWSDOTCameras,
  'us-colorado': fetchColoradoDOTCameras,
  'us-oregon':   fetchOregonDOTCameras,

  // Granular Europe sub-regions
  'spain': async () => {
    const [dgt, madrid] = await Promise.allSettled([
      fetchDGTSpainCameras(),
      fetchMadridCityCameras(),
    ]);
    return [
      ...(dgt.status    === 'fulfilled' ? dgt.value    : []),
      ...(madrid.status === 'fulfilled' ? madrid.value : []),
    ];
  },
  'netherlands': fetchNetherlandsCameras,
};

// Determine which regions to fetch based on viewport bounds
function getRegionsForBounds(lat: number, lng: number, _radius: number): string[] {
  const regions: string[] = [];

  if (lat > 49 && lat < 61 && lng > -8  && lng < 2)   regions.push('uk');
  if (lat > 24 && lat < 49 && lng > -85  && lng < -66) regions.push('us-east');
  if (lat > 24 && lat < 49 && lng > -125 && lng < -100) regions.push('us-west');
  if (lat > 24 && lat < 49 && lng > -105 && lng < -80) regions.push('us-central');
  if (lat > 42 && lat < 70 && lng > -141 && lng < -52) regions.push('canada');

  const inBulgaria  = lat > 41   && lat < 44.5 && lng > 22   && lng < 29.5;
  const inGreece    = lat > 34.5 && lat < 41.8 && lng > 19   && lng < 30;
  const inSerbia    = lat > 42   && lat < 46.5 && lng > 18.8 && lng < 23.3;
  const inMacedonia = lat > 40.8 && lat < 42.8 && lng > 20.4 && lng < 23.2;
  const inRomania   = lat > 43.5 && lat < 48.5 && lng > 20   && lng < 29.8;
  const inTurkey    = lat > 35.5 && lat < 42.5 && lng > 25.5 && lng < 45;
  const inSpain     = lat > 35.8 && lat < 43.8 && lng > -9.5 && lng < 4.5;
  const inBalkans   = inBulgaria || inGreece || inSerbia || inMacedonia || inRomania || inTurkey;

  if (inBulgaria)  regions.push('bulgaria');
  if (inGreece)    regions.push('greece');
  if (inSerbia)    regions.push('serbia');
  if (inMacedonia) regions.push('macedonia');
  if (inRomania)   regions.push('romania');
  if (inTurkey)    regions.push('turkey');
  if (inSpain)     regions.push('spain');

  if (lat > 35 && lat < 72 && lng > -11 && lng < 40 && !inBalkans && !inSpain) {
    regions.push('europe');
  }

  if (lat > -10  && lat < 60  && lng > 60  && lng < 150) regions.push('asia');
  if (lat > -45  && lat < -10 && lng > 110 && lng < 155) regions.push('australia');
  if (lat > 1.0  && lat < 7.5 && lng > 99.5 && lng < 119.5) regions.push('malaysia');

  // Blackeye cameras span worldwide — always include them
  regions.push('blackeye');

  return regions.length > 0 ? regions : ['uk', 'us-east', 'blackeye'];
}

// Default region set for global coverage (avoids double-counting sub-regions)
const DEFAULT_REGIONS = [
  'uk', 'us-west', 'us-east', 'us-central', 'canada',
  'europe', 'asia', 'malaysia', 'australia',
  'bulgaria', 'greece', 'serbia', 'macedonia', 'turkey', 'romania', 'spain',
  'blackeye',
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10');

    let regionsToFetch: string[];

    if (region === 'all') {
      regionsToFetch = DEFAULT_REGIONS;
    } else if (region) {
      regionsToFetch = region.split(',').filter((r) => r in REGION_FETCHERS);
    } else if (lat !== 0 || lng !== 0) {
      regionsToFetch = getRegionsForBounds(lat, lng, radius);
    } else {
      regionsToFetch = DEFAULT_REGIONS;
    }

    const results = await Promise.allSettled(
      regionsToFetch.map((r) => REGION_FETCHERS[r]())
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

    return NextResponse.json(
      {
        cameras: allCameras,
        total: allCameras.length,
        sources,
        regions: regionsToFetch,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('CCTV fetch error:', error);
    return NextResponse.json({ cameras: [], error: 'Failed' }, { status: 500 });
  }
}
