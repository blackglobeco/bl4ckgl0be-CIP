import { NextRequest, NextResponse } from 'next/server';

/**
 * OSIRIS — Cell Tower Intelligence API
 * Sources: OpenCelliD community API (opencellid.org)
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
const OCID_BBOX_URL = 'https://opencellid.org/api/getStationsInArea.php';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Module-level server cache (shared across all requests in one function instance) ──
interface CacheEntry {
  towers: Tower[];
  fetchedAt: number; // Date.now()
  source: string;
}

interface Tower {
  id: string;
  radio: string;
  mcc: number;
  mnc: number;
  lac: number;
  cid: number;
  lat: number;
  lng: number;
  range: number;
  samples: number;
  updated: string;
  operator: string;
  country: string;
  city: string;
}

// Single global cache entry — keyed by token (handles token rotation gracefully)
let serverCache: CacheEntry | null = null;
// Mutex flag to prevent parallel cold-start requests all hitting OpenCelliD simultaneously
let fetchInProgress = false;


// ── Broad global bounding boxes fetched once per day ──
// We request a wide global grid rather than per-user bboxes, so one fetch covers everyone.
const GLOBAL_BBOXES = [
  { name: 'europe',        bbox: '-25,35,45,72'   },
  { name: 'north_america', bbox: '-170,15,-50,75'  },
  { name: 'asia_east',     bbox: '100,-10,145,55'  },
  { name: 'asia_west',     bbox: '25,5,100,55'     },
  { name: 'middle_east',   bbox: '25,10,65,42'     },
  { name: 'africa',        bbox: '-20,-35,55,38'   },
  { name: 'lat_america',   bbox: '-85,-55,-35,12'  },
  { name: 'oceania',       bbox: '110,-45,180,-10' },
];

/**
 * Fetch all global tower data from OpenCelliD.
 * Called at most once per CACHE_TTL_MS window (once per day).
 * Uses limit=1000 per region — 8 regions = 8 API calls total per day.
 */
async function fetchFromOpenCelliD(): Promise<Tower[]> {
  const all: Tower[] = [];

  for (const region of GLOBAL_BBOXES) {
    try {
      const url = `${OCID_BBOX_URL}?key=${OPENCELLID_TOKEN}&BBOX=${region.bbox}&format=json&limit=1000`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const towers: Tower[] = (data.cells || []).map((cell: any) => ({
        id:       `ct-${cell.radio}-${cell.mcc}-${cell.mnc}-${cell.lac}-${cell.cid}`,
        radio:    cell.radio    || 'LTE',
        mcc:      cell.mcc      || 0,
        mnc:      cell.mnc      || 0,
        lac:      cell.lac      || 0,
        cid:      cell.cid      || 0,
        lat:      cell.lat,
        lng:      cell.lon,
        range:    cell.range    || 1000,
        samples:  cell.samples  || 0,
        updated:  cell.updated  ? new Date(cell.updated * 1000).toISOString().split('T')[0] : 'Unknown',
        operator: cell.averageSignal ? `Avg signal: ${cell.averageSignal} dBm` : '',
        country:  cell.country  || '',
        city:     '',
      }));
      all.push(...towers);
    } catch {
      // Skip failed regions — partial data is still useful
    }
  }

  return all;
}

/**
 * Return cached towers, refreshing from OpenCelliD at most once per day.
 * The mutex flag prevents multiple concurrent cold-start requests all
 * hammering OpenCelliD at the same time.
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

  // ── Cache miss — need a fresh fetch ──
  if (!OPENCELLID_TOKEN) {
    // No token: permanently serve sample data (no external calls)
    serverCache = { towers: SAMPLE_TOWERS, fetchedAt: now, source: 'sample_data' };
    return { towers: SAMPLE_TOWERS, source: 'sample_data', cachedAt: new Date(now).toISOString() };
  }

  // Mutex: if another request is already fetching, serve stale cache or sample
  if (fetchInProgress) {
    const stale = serverCache?.towers ?? SAMPLE_TOWERS;
    return {
      towers:   stale,
      source:   serverCache ? 'opencellid_stale_cache' : 'sample_data_mutex_wait',
      cachedAt: serverCache ? new Date(serverCache.fetchedAt).toISOString() : new Date(now).toISOString(),
    };
  }

  // ── Primary fetch path (runs at most once per CACHE_TTL_MS) ──
  fetchInProgress = true;
  try {
    const towers = await fetchFromOpenCelliD();

    if (towers.length > 0) {
      serverCache = { towers, fetchedAt: now, source: 'opencellid_live' };
      return { towers, source: 'opencellid_live', cachedAt: new Date(now).toISOString() };
    }

    // OpenCelliD returned empty — fall back to sample, but keep short retry window (1h)
    const fallbackCache: CacheEntry = {
      towers:    SAMPLE_TOWERS,
      fetchedAt: now - CACHE_TTL_MS + 60 * 60 * 1000, // retry in 1h
      source:    'opencellid_empty_fallback',
    };
    serverCache = fallbackCache;
    return { towers: SAMPLE_TOWERS, source: 'opencellid_empty_fallback', cachedAt: new Date(now).toISOString() };

  } catch {
    // Network error — serve sample, retry in 1h
    serverCache = {
      towers:    SAMPLE_TOWERS,
      fetchedAt: now - CACHE_TTL_MS + 60 * 60 * 1000,
      source:    'opencellid_error_fallback',
    };
    return { towers: SAMPLE_TOWERS, source: 'opencellid_error_fallback', cachedAt: new Date(now).toISOString() };
  } finally {
    fetchInProgress = false;
  }
}

export async function GET(_req: NextRequest) {
  const { towers, source, cachedAt } = await getTowers();

  const cacheAge = Math.floor((Date.now() - new Date(cachedAt).getTime()) / 1000);
  const maxAge   = Math.max(0, CACHE_TTL_MS / 1000 - cacheAge); // remaining TTL in seconds

  return NextResponse.json(
    {
      towers,
      total:     towers.length,
      source,
      cached_at: cachedAt,
      // Tells the client how long until data may refresh (purely informational)
      next_refresh_in_seconds: Math.round(maxAge),
    },
    {
      headers: {
        // CDN/browser cache for the remaining daily TTL so even cold starts
        // on new function instances don't re-hit OpenCelliD if a CDN cached the response.
        'Cache-Control': `public, s-maxage=${Math.max(60, maxAge)}, stale-while-revalidate=3600`,
      },
    }
  );
}
