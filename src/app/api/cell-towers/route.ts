import { NextRequest, NextResponse } from 'next/server';

/**
 * OSIRIS — Cell Tower Intelligence API
 * Sources: OpenCelliD community API (opencellid.org)
 *
 * Official API docs: https://wiki.opencellid.org/wiki/API
 *
 * RATE LIMIT STRATEGY:
 * OpenCelliD free tier = 100,000 requests/day. This route calls OpenCelliD at most
 * ONCE PER DAY using a module-level server cache (survives across all user requests
 * within the same Vercel function instance). All user traffic is served from the
 * in-memory cache — OpenCelliD never sees individual user requests.
 *
 * Cache lifecycle:
 *  - First request of the day → fetch OpenCelliD → cache result + timestamp
 *  - Subsequent requests within 24h → serve from cache (0 OpenCelliD calls)
 *  - After 24h → re-fetch once, refresh cache
 *
 * Worst case OpenCelliD calls = number of Vercel function cold starts per day
 * (typically 1–3 on hobby/pro plans), never proportional to user count.
 */

const OPENCELLID_TOKEN = process.env.OPENCELLID_TOKEN || '';

// ── Correct endpoint per official docs ──
// GET https://opencellid.org/cell/getInArea
//   ?key=<apiKey>                             ← auth param is "key", NOT "token"
//   &BBOX=<latmin>,<lonmin>,<latmax>,<lonmax> ← lat-first, NOT lon-first
//   &format=json                              ← default is kml, must specify json
//   &limit=50                                 ← hard max is 50 per call
//   &offset=0                                 ← for pagination
// Response: { count: N, cells: [ { lat, lon, mcc, mnc, lac, cellid, radio, ... } ] }
//   NOTE: field is "cellid" (not "cid"), and "lon" (not "lng")
const OCID_BASE_URL = 'https://opencellid.org/cell/getInArea';
const OCID_PAGE_LIMIT = 50; // hard max per official docs
const OCID_MAX_PAGES  = 4;  // fetch up to 200 towers per region (4 × 50)

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Module-level server cache ──
interface Tower {
  id: string; radio: string; mcc: number; mnc: number; lac: number; cid: number;
  lat: number; lng: number; range: number; samples: number; updated: string;
  operator: string; country: string; city: string;
}
interface CacheEntry { towers: Tower[]; fetchedAt: number; source: string; }

let serverCache: CacheEntry | null = null;
let fetchInProgress = false;

// ── Curated global sample — used when no API token is set ──
const SAMPLE_TOWERS: Tower[] = [
  { id: 'ct-us-nyc-1',           radio: 'LTE',  mcc: 310, mnc: 260, lac: 1234, cid: 98765, lat:  40.7128, lng:  -74.0060, range: 1200, samples: 342, updated: '2024-01-15', operator: 'T-Mobile US',  country: 'US', city: 'New York' },
  { id: 'ct-us-nyc-2',           radio: 'NR',   mcc: 311, mnc: 480, lac: 1234, cid: 11223, lat:  40.7589, lng:  -73.9851, range:  800, samples:  89, updated: '2024-02-01', operator: 'Verizon',       country: 'US', city: 'New York' },
  { id: 'ct-us-la-1',            radio: 'LTE',  mcc: 310, mnc: 410, lac: 5678, cid: 44556, lat:  34.0522, lng: -118.2437, range: 1500, samples: 215, updated: '2024-01-20', operator: 'AT&T',           country: 'US', city: 'Los Angeles' },
  { id: 'ct-us-chi-1',           radio: 'LTE',  mcc: 310, mnc: 260, lac: 9012, cid: 77889, lat:  41.8781, lng:  -87.6298, range: 1100, samples: 178, updated: '2024-01-18', operator: 'T-Mobile US',  country: 'US', city: 'Chicago' },
  { id: 'ct-ca-toronto-1',       radio: 'LTE',  mcc: 302, mnc: 720, lac: 3456, cid: 22334, lat:  43.6532, lng:  -79.3832, range:  900, samples: 156, updated: '2024-01-25', operator: 'Rogers',         country: 'CA', city: 'Toronto' },
  { id: 'ct-uk-london-1',        radio: 'NR',   mcc: 234, mnc:  30, lac: 7890, cid: 55667, lat:  51.5074, lng:   -0.1278, range:  600, samples: 412, updated: '2024-02-05', operator: 'EE',             country: 'GB', city: 'London' },
  { id: 'ct-uk-london-2',        radio: 'LTE',  mcc: 234, mnc:  20, lac: 7891, cid: 88990, lat:  51.5155, lng:   -0.0922, range:  950, samples: 289, updated: '2024-01-30', operator: 'O2',             country: 'GB', city: 'London' },
  { id: 'ct-de-berlin-1',        radio: 'NR',   mcc: 262, mnc:   1, lac: 1122, cid: 33445, lat:  52.5200, lng:   13.4050, range:  700, samples: 334, updated: '2024-02-03', operator: 'Telekom DE',     country: 'DE', city: 'Berlin' },
  { id: 'ct-fr-paris-1',         radio: 'LTE',  mcc: 208, mnc:   1, lac: 3344, cid: 66778, lat:  48.8566, lng:    2.3522, range:  800, samples: 267, updated: '2024-01-22', operator: 'Orange FR',      country: 'FR', city: 'Paris' },
  { id: 'ct-ru-moscow-1',        radio: 'LTE',  mcc: 250, mnc:   1, lac: 5566, cid: 99001, lat:  55.7558, lng:   37.6173, range: 1300, samples: 198, updated: '2024-01-12', operator: 'MTS',            country: 'RU', city: 'Moscow' },
  { id: 'ct-ua-kyiv-1',          radio: 'LTE',  mcc: 255, mnc:   6, lac: 7788, cid: 11234, lat:  50.4501, lng:   30.5234, range: 1100, samples: 123, updated: '2024-01-08', operator: 'Kyivstar',       country: 'UA', city: 'Kyiv' },
  { id: 'ct-pl-warsaw-1',        radio: 'LTE',  mcc: 260, mnc:   1, lac: 9900, cid: 55122, lat:  52.2297, lng:   21.0122, range:  950, samples: 145, updated: '2024-01-19', operator: 'Plus PL',        country: 'PL', city: 'Warsaw' },
  { id: 'ct-tr-istanbul-1',      radio: 'LTE',  mcc: 286, mnc:   1, lac: 2233, cid: 87654, lat:  41.0082, lng:   28.9784, range: 1200, samples: 289, updated: '2024-01-17', operator: 'Turkcell',       country: 'TR', city: 'Istanbul' },
  { id: 'ct-sa-riyadh-1',        radio: 'LTE',  mcc: 420, mnc:   1, lac: 4455, cid: 32145, lat:  24.6877, lng:   46.7219, range: 2000, samples: 134, updated: '2024-01-11', operator: 'STC',            country: 'SA', city: 'Riyadh' },
  { id: 'ct-il-telaviv-1',       radio: 'NR',   mcc: 425, mnc:   1, lac: 6677, cid: 76543, lat:  32.0853, lng:   34.7818, range:  700, samples:  98, updated: '2024-02-02', operator: 'Cellcom',        country: 'IL', city: 'Tel Aviv' },
  { id: 'ct-cn-beijing-1',       radio: 'NR',   mcc: 460, mnc:   0, lac: 8899, cid: 21098, lat:  39.9042, lng:  116.4074, range:  600, samples: 567, updated: '2024-02-08', operator: 'China Mobile',   country: 'CN', city: 'Beijing' },
  { id: 'ct-cn-shanghai-1',      radio: 'NR',   mcc: 460, mnc:   1, lac: 1011, cid: 65432, lat:  31.2304, lng:  121.4737, range:  650, samples: 489, updated: '2024-02-07', operator: 'China Unicom',   country: 'CN', city: 'Shanghai' },
  { id: 'ct-jp-tokyo-1',         radio: 'NR',   mcc: 440, mnc:  10, lac: 1213, cid: 43210, lat:  35.6762, lng:  139.6503, range:  550, samples: 678, updated: '2024-02-09', operator: 'NTT Docomo',     country: 'JP', city: 'Tokyo' },
  { id: 'ct-kr-seoul-1',         radio: 'NR',   mcc: 450, mnc:   5, lac: 1415, cid: 87321, lat:  37.5665, lng:  126.9780, range:  600, samples: 445, updated: '2024-02-06', operator: 'SK Telecom',     country: 'KR', city: 'Seoul' },
  { id: 'ct-in-mumbai-1',        radio: 'LTE',  mcc: 404, mnc:  20, lac: 1617, cid: 54123, lat:  19.0760, lng:   72.8777, range: 1800, samples: 312, updated: '2024-01-14', operator: 'Airtel IN',      country: 'IN', city: 'Mumbai' },
  { id: 'ct-au-sydney-1',        radio: 'LTE',  mcc: 505, mnc:   1, lac: 1819, cid: 21987, lat: -33.8688, lng:  151.2093, range: 1100, samples: 234, updated: '2024-01-23', operator: 'Telstra',        country: 'AU', city: 'Sydney' },
  { id: 'ct-sg-1',               radio: 'NR',   mcc: 525, mnc:   1, lac: 2021, cid: 89765, lat:   1.3521, lng:  103.8198, range:  500, samples: 387, updated: '2024-02-04', operator: 'Singtel',        country: 'SG', city: 'Singapore' },
  { id: 'ct-my-kl-1',            radio: 'LTE',  mcc: 502, mnc:  12, lac: 2223, cid: 43876, lat:   3.1390, lng:  101.6869, range: 1400, samples: 198, updated: '2024-01-21', operator: 'Maxis',          country: 'MY', city: 'Kuala Lumpur' },
  { id: 'ct-za-johannesburg-1',  radio: 'LTE',  mcc: 655, mnc:   1, lac: 2425, cid: 67543, lat: -26.2041, lng:   28.0473, range: 1600, samples: 156, updated: '2024-01-16', operator: 'Vodacom ZA',     country: 'ZA', city: 'Johannesburg' },
  { id: 'ct-ng-lagos-1',         radio: 'LTE',  mcc: 621, mnc:  20, lac: 2627, cid: 34521, lat:   6.5244, lng:    3.3792, range: 2200, samples:  89, updated: '2024-01-09', operator: 'MTN NG',         country: 'NG', city: 'Lagos' },
  { id: 'ct-ke-nairobi-1',       radio: 'LTE',  mcc: 639, mnc:   7, lac: 2829, cid: 12345, lat:  -1.2921, lng:   36.8219, range: 1900, samples: 112, updated: '2024-01-13', operator: 'Safaricom',      country: 'KE', city: 'Nairobi' },
  { id: 'ct-br-saopaulo-1',      radio: 'LTE',  mcc: 724, mnc:   6, lac: 3031, cid: 78901, lat: -23.5505, lng:  -46.6333, range: 1300, samples: 267, updated: '2024-01-24', operator: 'Vivo BR',        country: 'BR', city: 'São Paulo' },
  { id: 'ct-mx-cdmx-1',          radio: 'LTE',  mcc: 334, mnc:  20, lac: 3233, cid: 56789, lat:  19.4326, lng:  -99.1332, range: 1400, samples: 189, updated: '2024-01-26', operator: 'Telcel',         country: 'MX', city: 'Mexico City' },
  { id: 'ct-ar-bsas-1',          radio: 'LTE',  mcc: 722, mnc:  10, lac: 3435, cid: 34567, lat: -34.6037, lng:  -58.3816, range: 1200, samples: 145, updated: '2024-01-27', operator: 'Claro AR',       country: 'AR', city: 'Buenos Aires' },
  { id: 'ct-ua-kharkiv-1',       radio: 'GSM',  mcc: 255, mnc:   3, lac: 3637, cid:  9876, lat:  49.9935, lng:   36.2304, range: 3500, samples:  34, updated: '2023-12-01', operator: 'Lifecell UA',    country: 'UA', city: 'Kharkiv' },
  { id: 'ct-ua-zaporizhzhia-1',  radio: 'GSM',  mcc: 255, mnc:   6, lac: 3839, cid:  8765, lat:  47.8388, lng:   35.1396, range: 4000, samples:  22, updated: '2023-11-15', operator: 'Kyivstar',       country: 'UA', city: 'Zaporizhzhia' },
  { id: 'ct-sy-damascus-1',      radio: 'UMTS', mcc: 417, mnc:   2, lac: 4041, cid:  7654, lat:  33.5138, lng:   36.2765, range: 2800, samples:  45, updated: '2023-10-20', operator: 'MTN SY',         country: 'SY', city: 'Damascus' },
  { id: 'ct-iq-baghdad-1',       radio: 'LTE',  mcc: 418, mnc:  20, lac: 4243, cid:  6543, lat:  33.3152, lng:   44.3661, range: 2100, samples:  78, updated: '2024-01-05', operator: 'Asiacell',       country: 'IQ', city: 'Baghdad' },
];

// ── Broad global bounding boxes fetched once per day ──
// BBOX format per docs: latmin,lonmin,latmax,lonmax
const GLOBAL_BBOXES = [
  { name: 'europe',        bbox: '35,-25,72,45'    },
  { name: 'north_america', bbox: '15,-170,75,-50'  },
  { name: 'asia_east',     bbox: '-10,100,55,145'  },
  { name: 'asia_west',     bbox: '5,25,55,100'     },
  { name: 'middle_east',   bbox: '10,25,42,65'     },
  { name: 'africa',        bbox: '-35,-20,38,55'   },
  { name: 'lat_america',   bbox: '-55,-85,12,-35'  },
  { name: 'oceania',       bbox: '-45,110,-10,180' },
];

/**
 * Fetch towers from one region with pagination.
 * Official docs: max limit=50 per call; paginate with offset.
 */
async function fetchRegion(bbox: string): Promise<Tower[]> {
  const all: Tower[] = [];

  for (let page = 0; page < OCID_MAX_PAGES; page++) {
    const offset = page * OCID_PAGE_LIMIT;
    // Per official docs:
    //   key=   (not "token=")
    //   BBOX=latmin,lonmin,latmax,lonmax  (lat-first)
    //   limit max = 50
    //   format=json  (default is kml — must specify)
    const url = `${OCID_BASE_URL}?key=${OPENCELLID_TOKEN}&BBOX=${bbox}&format=json&limit=${OCID_PAGE_LIMIT}&offset=${offset}`;

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[cell-towers] OpenCelliD HTTP ${res.status} for bbox=${bbox} offset=${offset}: ${body}`);
      break;
    }

    const data = await res.json();
    const cells: any[] = data.cells || [];

    const towers: Tower[] = cells.map((cell: any) => ({
      id:       `ct-${cell.radio}-${cell.mcc}-${cell.mnc}-${cell.lac}-${cell.cellid}`,
      radio:    cell.radio    || 'LTE',
      mcc:      cell.mcc      || 0,
      mnc:      cell.mnc      || 0,
      lac:      cell.lac      || 0,
      cid:      cell.cellid   || 0,   // ← API returns "cellid", not "cid"
      lat:      cell.lat,
      lng:      cell.lon,             // ← API returns "lon", not "lng"
      range:    cell.range    || 1000,
      samples:  cell.samples  || 0,
      updated:  'Unknown',            // getInArea does not return an updated timestamp
      operator: cell.averageSignalStrength != null ? `Avg signal: ${cell.averageSignalStrength} dBm` : '',
      country:  '',
      city:     '',
    }));

    all.push(...towers);

    // Stop paginating if fewer than a full page returned — no more data
    if (cells.length < OCID_PAGE_LIMIT) break;
  }

  return all;
}

/**
 * Fetch all global tower data from OpenCelliD.
 * Called at most once per CACHE_TTL_MS window (once per day).
 */
async function fetchFromOpenCelliD(): Promise<Tower[]> {
  const all: Tower[] = [];

  for (const region of GLOBAL_BBOXES) {
    try {
      const towers = await fetchRegion(region.bbox);
      all.push(...towers);
    } catch (err) {
      // Skip failed regions — partial data is still useful
      console.error(`[cell-towers] Failed to fetch region ${region.name}:`, err);
    }
  }

  return all;
}

/**
 * Return cached towers, refreshing from OpenCelliD at most once per day.
 * Mutex flag prevents concurrent cold-start requests all hitting OpenCelliD.
 */
async function getTowers(): Promise<{ towers: Tower[]; source: string; cachedAt: string }> {
  const now = Date.now();

  // ── Cache hit ──
  if (serverCache && now - serverCache.fetchedAt < CACHE_TTL_MS) {
    return {
      towers:   serverCache.towers,
      source:   serverCache.source,
      cachedAt: new Date(serverCache.fetchedAt).toISOString(),
    };
  }

  // ── No token: serve sample data permanently ──
  if (!OPENCELLID_TOKEN) {
    serverCache = { towers: SAMPLE_TOWERS, fetchedAt: now, source: 'sample_data' };
    return { towers: SAMPLE_TOWERS, source: 'sample_data', cachedAt: new Date(now).toISOString() };
  }

  // ── Mutex: another request is already fetching ──
  if (fetchInProgress) {
    const stale = serverCache?.towers ?? SAMPLE_TOWERS;
    return {
      towers:   stale,
      source:   serverCache ? 'opencellid_stale_cache' : 'sample_data_mutex_wait',
      cachedAt: serverCache ? new Date(serverCache.fetchedAt).toISOString() : new Date(now).toISOString(),
    };
  }

  // ── Primary fetch (runs at most once per CACHE_TTL_MS) ──
  fetchInProgress = true;
  try {
    const towers = await fetchFromOpenCelliD();

    if (towers.length > 0) {
      serverCache = { towers, fetchedAt: now, source: 'opencellid_live' };
      return { towers, source: 'opencellid_live', cachedAt: new Date(now).toISOString() };
    }

    // OpenCelliD returned empty — retry in 1h
    serverCache = { towers: SAMPLE_TOWERS, fetchedAt: now - CACHE_TTL_MS + 3_600_000, source: 'opencellid_empty_fallback' };
    return { towers: SAMPLE_TOWERS, source: 'opencellid_empty_fallback', cachedAt: new Date(now).toISOString() };

  } catch (err) {
    console.error('[cell-towers] fetchFromOpenCelliD failed:', err);
    // Network error — retry in 1h
    serverCache = { towers: SAMPLE_TOWERS, fetchedAt: now - CACHE_TTL_MS + 3_600_000, source: 'opencellid_error_fallback' };
    return { towers: SAMPLE_TOWERS, source: 'opencellid_error_fallback', cachedAt: new Date(now).toISOString() };
  } finally {
    fetchInProgress = false;
  }
}

export async function GET(_req: NextRequest) {
  const { towers, source, cachedAt } = await getTowers();

  const cacheAge = Math.floor((Date.now() - new Date(cachedAt).getTime()) / 1000);
  const maxAge   = Math.max(0, CACHE_TTL_MS / 1000 - cacheAge);

  return NextResponse.json(
    {
      towers,
      total:                   towers.length,
      source,
      cached_at:               cachedAt,
      next_refresh_in_seconds: Math.round(maxAge),
    },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${Math.max(60, maxAge)}, stale-while-revalidate=3600`,
      },
    },
  );
}
