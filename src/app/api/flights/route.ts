
import { NextResponse } from 'next/server';

/**
 * OSIRIS / BLACK GLOBE — Flight Data API
 *
 * Architecture (ported from the osiris-master reference build):
 *   Phase 1+2 (parallel): OpenSky /states/all (global, primary)
 *                          + adsb.fi /mil (military overlay, always live)
 *   Phase 3 (fallback only, if OpenSky returned nothing): adsb.fi regional
 *   sweep, paced at ~1 req/s, each request capped at the provider's real
 *   250nm radius limit.
 *
 * api.adsb.lol was the previous single source for this route. It now answers
 * 200 with an always-empty {"ac":[],"total":0}, and the old REGIONS array
 * queried it at 2000-2500nm — 8-10x over its actual 250nm cap — so every
 * region failed regardless. Both issues are fixed here by moving OpenSky to
 * the primary role and adsb.fi (not adsb.lol) to the fallback role, with the
 * fallback's radius corrected to the provider's real limit.
 */

export const maxDuration = 60;

// 30 regions covering every major aviation corridor, only used as a last
// resort if OpenSky returns nothing. Each request is capped at 250nm — the
// hard limit adsb.fi (and every ADSBExchange-v2-shaped provider) enforces.
const REGIONS = [
  // North America
  { lat: 39.8,  lon: -98.5 }, // Central US
  { lat: 41.0,  lon: -74.0 }, // Northeast (NYC/Boston/DC)
  { lat: 33.0,  lon: -84.0 }, // Southeast (Atlanta)
  { lat: 42.0,  lon: -88.0 }, // Midwest (Chicago)
  { lat: 30.0,  lon: -97.0 }, // Texas (Dallas/Houston)
  { lat: 47.0,  lon:-122.0 }, // Pacific Northwest (Seattle)
  { lat: 34.0,  lon:-118.0 }, // SoCal (LA)
  { lat: 45.0,  lon: -73.0 }, // Canada East (Montreal/Toronto)
  { lat: 49.0,  lon: -97.0 }, // Canada Prairies
  // Europe
  { lat: 50.0,  lon:  15.0 }, // Central Europe
  { lat: 51.5,  lon:  -1.0 }, // UK / Ireland
  { lat: 47.0,  lon:   2.0 }, // France / Alps
  { lat: 40.0,  lon:  -4.0 }, // Iberia
  { lat: 42.0,  lon:  13.0 }, // Italy / Adriatic
  { lat: 60.0,  lon:  15.0 }, // Scandinavia
  { lat: 52.0,  lon:  22.0 }, // Eastern Europe / Baltics
  { lat: 39.0,  lon:  35.0 }, // Turkey / Aegean
  // Middle East & South Asia
  { lat: 25.0,  lon:  45.0 }, // Arabian Gulf (Dubai/Riyadh)
  { lat: 22.0,  lon:  78.0 }, // India
  // East Asia & Pacific
  { lat: 35.0,  lon: 105.0 }, // China
  { lat: 35.0,  lon: 136.0 }, // Japan
  { lat: 37.0,  lon: 127.0 }, // Korea
  { lat: 13.0,  lon: 100.0 }, // SE Asia (Bangkok)
  { lat:  1.0,  lon: 104.0 }, // Singapore / Malacca Strait
  // Australia
  { lat:-25.0,  lon: 133.0 }, // Central Australia
  { lat:-33.0,  lon: 151.0 }, // Eastern Australia (Sydney)
  // Africa
  { lat:  0.0,  lon:  20.0 }, // Central Africa
  { lat:-26.0,  lon:  28.0 }, // South Africa
  // South America
  { lat:-15.0,  lon: -60.0 }, // Brazil Central
  { lat:-23.0,  lon: -46.0 }, // São Paulo / Rio
];

// Helicopter type codes (adsb.fi feeds supply an aircraft type; OpenSky does not)
const HELI_TYPES = new Set([
  'R22','R44','R66','B06','B06T','B204','B205','B206','B212','B222','B230',
  'B407','B412','B427','B429','B430','B505','B525',
  'AS32','AS35','AS50','AS55','AS65',
  'EC20','EC25','EC30','EC35','EC45','EC55','EC75',
  'H125','H130','H135','H145','H155','H160','H175','H215','H225',
  'S55','S58','S61','S64','S70','S76','S92',
  'A109','A119','A139','A169','A189','AW09',
  'MD52','MD60','MDHI','MD90','NOTR',
  'B47G','HUEY','GAMA','CABR','EXE',
]);

// Private jet types
const PRIVATE_JET_TYPES = new Set([
  'G150','G200','G280','GLEX','G500','G550','G600','G650','G700',
  'GLF2','GLF3','GLF4','GLF5','GLF6','GL5T','GL7T','GV','GIV',
  'CL30','CL35','CL60','BD70','BD10',
  'C25A','C25B','C25C','C500','C510','C525','C550','C560','C56X','C680','C700','C750',
  'E35L','E50P','E55P','E545','E550',
  'FA50','FA7X','FA8X','F900','F2TH',
  'LJ35','LJ40','LJ45','LJ60','LJ70','LJ75',
  'PC12','PC24','TBM7','TBM8','TBM9',
  'PRM1','SF50','EA50','VLJ',
]);

// Military type indicators
const MILITARY_INDICATORS = new Set([
  'C17','C5M','C130','C30J','KC10','KC46','KC35','E3CF','E3TF','E8A',
  'B1B','B2','B52','F16','F15','F18','F22','F35','A10','F117',
  'RC135','E6B','P8A','P3','MQ9','RQ4','U2','EP3','RC12',
  'V22','CH47','UH60','AH64','AH1Z','MV22',
  'EUFI','RFAL','TORD','TYP','GR4',
]);

// Airliner/regional types — a typed airliner stays commercial regardless of callsign
const AIRLINER_TYPES = new Set([
  'A319','A320','A321','A332','A333','A339','A343','A359','A388',
  'B737','B738','B739','B38M','B39M','B752','B753','B763','B764',
  'B772','B77L','B77W','B788','B789','B78X',
  'E170','E175','E190','E195','CRJ7','CRJ9','AT43','AT72','DH8D',
]);

// Fractional-ownership / charter operators file under a 3-letter ICAO code
// exactly like an airline, so AIRLINE_CODE_RE matches them and they'd
// otherwise be counted as commercial traffic.
const BIZJET_OPERATORS = new Set([
  'EJA','EJM','NJE','LXJ','FJO','VJT','XOJ','JTL','WUP','GAJ','DPJ','CLY','TWY',
]);

const AIRLINE_CODE_RE = /^([A-Z]{3})\d/;

// A callsign that isn't an airline designator + flight number is a
// registration — what GA aircraft broadcast once the hyphen is stripped
// (DMMKG, HBYKO, OEDLH, N425RS, CGABC).
const CALLSIGN_RE = /^[A-Z0-9]{3,8}$/;

// OpenSky state vectors carry no aircraft type at all, so business jets vs.
// piston GA has to be guessed from performance: nothing under a civil
// registration reaches FL280 at 300kt without turbofans.
const JET_CRUISE_ALT_M = 8500;
const JET_CRUISE_KTS = 300;

// adsb.fi is the free tar1090/ADSBExchange-v2-shaped feed used as the
// fallback here. It hard-caps radius queries at 250nm — the old REGIONS
// array in this route requested 2000-2500nm against adsb.lol, which is why
// every region silently returned nothing.
const ADSB_MAX_DIST = 250;
const ADSBFI_BASE = 'https://opendata.adsb.fi/api/v2';

// adsb.fi allows roughly 1 request/second and soft-throttles over that by
// returning 200 with an empty ac[] rather than 429 — so pacing the sweep
// matters; a parallel fan-out looks like it succeeded while returning nothing.
const ADSBFI_GAP_MS = 1100;

async function fetchAdsbFi(path: string, timeoutMs = 12000): Promise<any[]> {
  try {
    const res = await fetch(`${ADSBFI_BASE}${path}`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.ac || [];
    }
    await res.body?.cancel();
  } catch (e) {
    console.warn(`[flights] adsb.fi fetch failed for ${path}:`, e);
  }
  return [];
}

function classifyFlight(f: any) {
  const modelUpper = (f.t || '').toUpperCase();
  const flightStr = (f.flight || '').trim().toUpperCase();
  const dbFlags = (f.dbFlags || 0);

  if (modelUpper === 'TWR') return null;

  const lat = f.lat;
  const lon = f.lon;
  if (lat == null || lon == null) return null;

  const callsign = flightStr || f.hex || 'UNKNOWN';
  const altRaw = f.alt_baro;
  const altMeters = typeof altRaw === 'number' ? altRaw * 0.3048 : 0;
  const speedKnots = typeof f.gs === 'number' ? Math.round(f.gs * 10) / 10 : null;
  const heading = f.track || 0;
  const isHeli = HELI_TYPES.has(modelUpper) || f.category_os === 8;
  const isGrounded = typeof altRaw === 'number' && altRaw < 100;

  // OpenSky ADS-B emitter category (only present with extended=1):
  // 2 = light, 4/5/6 = large/high-vortex-large/heavy, 7 = high performance, 14 = military
  const isOsMilitary = f.category_os === 14;
  const isOsHighPerf = f.category_os === 7;
  const isOsLight = f.category_os === 2;
  const isOsHeavy = f.category_os === 4 || f.category_os === 5 || f.category_os === 6;

  const airlineMatch = AIRLINE_CODE_RE.exec(callsign);
  const airlineCode = airlineMatch ? airlineMatch[1] : '';

  // OpenSky supplies no aircraft type, so type-based tests below only fire on
  // adsb.fi data. The callsign format is the field OpenSky always fills, so
  // it carries the commercial/private split for OpenSky-sourced traffic.
  const isGaCallsign = !airlineCode && CALLSIGN_RE.test(flightStr);
  const cruisesLikeAJet = altMeters > JET_CRUISE_ALT_M && (speedKnots ?? 0) > JET_CRUISE_KTS;

  let category: 'commercial' | 'private' | 'jet' | 'military' = 'commercial';
  if (isOsMilitary || dbFlags & 1 || MILITARY_INDICATORS.has(modelUpper) || (f.flight || '').match(/^(RCH|KING|DUKE|EVAC|JAKE|REACH|CONVOY)\d/i)) {
    category = 'military';
  } else if (AIRLINER_TYPES.has(modelUpper) || isOsHeavy) {
    category = 'commercial';
  } else if (
    BIZJET_OPERATORS.has(airlineCode) ||
    PRIVATE_JET_TYPES.has(modelUpper) ||
    isOsHighPerf ||
    (isGaCallsign && cruisesLikeAJet)
  ) {
    category = 'jet';
  } else if (isGaCallsign || isOsLight) {
    category = 'private';
  } else if (!airlineCode && modelUpper && !AIRLINER_TYPES.has(modelUpper)) {
    category = 'private';
  }

  return {
    callsign,
    lat: Math.round(lat * 100000) / 100000,
    lng: Math.round(lon * 100000) / 100000,
    alt: Math.round(altMeters),
    heading: Math.round(heading),
    speed_knots: speedKnots,
    model: f.t || 'Unknown',
    icao24: f.hex || '',
    registration: f.r || 'N/A',
    squawk: f.squawk || '',
    airline_code: airlineCode,
    aircraft_category: isHeli ? 'heli' : 'plane',
    category,
    grounded: isGrounded,
    nac_p: f.nac_p,
    type: 'flight',
  };
}

let cachedData: any = null;
let lastFetchTime = 0;
// 90s keeps requests well within the authenticated OpenSky budget
// (4000 credits/day, 4 credits/call for /states/all ≈ 1 call/86s).
const CACHE_TTL = 90000;

const hasOpenSkyCreds = () =>
  Boolean(process.env.OPENSKY_CLIENT_ID && process.env.OPENSKY_CLIENT_SECRET);

// OpenSky's budget is per day, not per request, so its refresh interval is
// tracked separately from the response cache above. Anonymous access is only
// 400 credits/day (~100 calls, one per ~864s) — polling that on the 90s TTL
// burns the day's quota in about half an hour, after which every call 429s.
const openSkyInterval = () => (hasOpenSkyCreds() ? 90000 : 900000);

// Last-good OpenSky snapshot, reused between refresh intervals so the map
// doesn't swing between a full snapshot and near-empty every cache miss.
let osSnapshot: any[] = [];
let osSnapshotTime = 0;
let fetchPromise: Promise<any> | null = null;

// Back off from OpenSky after a 429 so the daily quota can reset, rather than
// re-poking a limited endpoint on every cache miss and staying throttled.
let openSkyCooldownUntil = 0;
const OPENSKY_COOLDOWN = 15 * 60 * 1000;

// OpenSky OAuth2 client-credentials — optional but strongly recommended.
// Anonymous access works but is throttled hard on shared/VPS IPs (which is
// what Vercel's outbound IPs are). Setting these env vars (already present
// in this project's .env) moves requests onto the account credit pool
// instead of the anonymous per-IP pool.
let osToken: string | null = null;
let osTokenExpiry = 0;

async function getOpenSkyToken(): Promise<string | null> {
  const id = process.env.OPENSKY_CLIENT_ID;
  const secret = process.env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (osToken && Date.now() < osTokenExpiry) return osToken;
  try {
    const res = await fetch(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) { console.warn('[flights] OpenSky token request failed:', res.status); return null; }
    const data = await res.json();
    if (!data.access_token) {
      console.warn('[flights] OpenSky token response missing access_token');
      return null;
    }
    osToken = data.access_token;
    osTokenExpiry = Date.now() + ((data.expires_in || 1800) - 60) * 1000;
    return osToken;
  } catch (e) {
    console.warn('[flights] OpenSky token error:', e);
    return null;
  }
}

function ingestAc(raw: any[], into: any[], seen: Set<string>) {
  for (const ac of raw) {
    const hex = (ac.hex || '').toLowerCase().trim();
    if (hex && !seen.has(hex)) { seen.add(hex); into.push(ac); }
  }
}

export async function GET() {
  const now = Date.now();

  if (cachedData && now - lastFetchTime < CACHE_TTL) {
    return NextResponse.json(cachedData, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  }

  if (fetchPromise) {
    try {
      const data = await fetchPromise;
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
      });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
    }
  }

  const JAMMING_NACAP_THRESHOLD = 4;

  fetchPromise = (async () => {
    const allRaw: any[] = [];
    const seenHex = new Set<string>();
    let source: string;

    // ── Phase 1+2 in parallel: adsb.fi military feed + OpenSky global feed ──
    // Running them together bounds wall-clock time to max(mil, opensky)
    // rather than the sum. The military feed runs every cycle regardless of
    // OpenSky's status, so military traffic stays live during any cooldown.
    const skipOpenSky =
      Date.now() < openSkyCooldownUntil ||
      Date.now() - osSnapshotTime < openSkyInterval();

    const token = skipOpenSky ? null : await getOpenSkyToken();
    const osInit: RequestInit = token
      ? { signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}` } }
      : { signal: AbortSignal.timeout(30000) };

    const [milRes, osRes] = await Promise.allSettled([
      fetchAdsbFi('/mil', 15000).then(ac => ({ ac })),
      skipOpenSky
        ? Promise.reject(new Error('OpenSky in cooldown'))
        // extended=1 appends the ADS-B emitter category as an 18th field;
        // without it classifyFlight's category_os checks are silently dead.
        : fetch('https://opensky-network.org/api/states/all?extended=1', osInit),
    ]);

    if (milRes.status === 'fulfilled') {
      ingestAc(milRes.value.ac || [], allRaw, seenHex);
    }
    const milCount = allRaw.length;

    if (osRes.status === 'fulfilled' && osRes.value instanceof Response) {
      const resp = osRes.value;
      if (resp.status === 429) {
        openSkyCooldownUntil = Date.now() + OPENSKY_COOLDOWN;
        console.warn('[flights] OpenSky 429 — cooling down 15 min');
        await resp.body?.cancel();
      } else if (resp.ok) {
        try {
          const data = await resp.json();
          const states = data.states || [];
          if (states.length > 100) {
            osSnapshot = states.map((s: any[]) => ({
              hex: s[0],
              flight: s[1]?.trim(),
              lon: s[5],
              lat: s[6],
              alt_baro: typeof s[7] === 'number' ? s[7] * 3.28084 : null,
              gs: typeof s[9] === 'number' ? s[9] * 1.94384 : null,
              track: s[10],
              squawk: s[14],
              category_os: s[17],
            }));
            osSnapshotTime = Date.now();
          }
        } catch (e) {
          console.warn('[flights] OpenSky parse error:', e);
        }
      } else {
        console.warn('[flights] OpenSky returned', resp.status);
        await resp.body?.cancel();
      }
    }

    ingestAc(osSnapshot, allRaw, seenHex);
    const openSkyWorked = osSnapshot.length > 0;

    // ── Phase 3: adsb.fi regional sweep — last resort only ──────────────────
    // Runs only when there's no OpenSky snapshot at all. Paced at ~1 req/s;
    // 30 regions ≈ 33s, inside the 60s maxDuration above. Every region is
    // capped at ADSB_MAX_DIST (250nm) — the provider's real, enforced limit.
    if (!openSkyWorked) {
      source = 'regional';
      console.warn('[flights] no OpenSky snapshot — falling back to adsb.fi regional sweep');

      for (const r of REGIONS) {
        ingestAc(await fetchAdsbFi(`/lat/${r.lat}/lon/${r.lon}/dist/${ADSB_MAX_DIST}`), allRaw, seenHex);
        await new Promise(resolve => setTimeout(resolve, ADSBFI_GAP_MS));
      }

      if (allRaw.length === 0) {
        console.error(
          '[flights] every provider returned zero aircraft — ' +
          'set OPENSKY_CLIENT_ID/OPENSKY_CLIENT_SECRET (free at opensky-network.org); ' +
          'the anonymous 400 credits/day pool cannot sustain a live map'
        );
      }
    } else {
      source = hasOpenSkyCreds() ? 'opensky-auth' : 'opensky-anon';
    }

    // ── Classify ──────────────────────────────────────────────────────────
    const commercial: any[] = [];
    const privateFl: any[] = [];
    const jets: any[] = [];
    const military: any[] = [];
    const gpsJamming: any[] = [];

    for (const raw of allRaw) {
      const flight = classifyFlight(raw);
      if (!flight) continue;

      if (typeof flight.nac_p === 'number' && flight.nac_p <= JAMMING_NACAP_THRESHOLD && !flight.grounded) {
        gpsJamming.push({ lat: flight.lat, lng: flight.lng, nac_p: flight.nac_p, callsign: flight.callsign });
      }

      switch (flight.category) {
        case 'military': military.push(flight); break;
        case 'jet':      jets.push(flight);     break;
        case 'private':  privateFl.push(flight); break;
        default:         commercial.push(flight);
      }
    }

    return {
      commercial_flights: commercial,
      private_flights:    privateFl,
      private_jets:       jets,
      military_flights:   military,
      gps_jamming:        aggregateJamming(gpsJamming, JAMMING_NACAP_THRESHOLD),
      total:              allRaw.length,
      source,
      // Per-feed counts so a provider that starts silently answering 200
      // with no aircraft is visible in the payload instead of emptying the
      // map without a trace.
      providers: {
        adsbfi_mil:      milCount,
        adsbfi_regional: openSkyWorked ? 0 : allRaw.length - milCount,
        opensky:         osSnapshot.length,
        opensky_auth:    hasOpenSkyCreds(),
        opensky_age_s:   osSnapshotTime ? Math.round((Date.now() - osSnapshotTime) / 1000) : null,
      },
      timestamp: new Date().toISOString(),
    };
  })();

  try {
    const data = await fetchPromise;
    cachedData = data;
    lastFetchTime = Date.now();
    fetchPromise = null;
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': data.total < 100 ? 'no-store, max-age=0' : 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[flights] Flight fetch error:', error);
    fetchPromise = null;
    // Stale-cache fallback: serve last-known-good data instead of a blank map
    if (cachedData) {
      console.warn('[flights] Returning stale flight cache as fallback');
      return NextResponse.json({ ...cachedData, source: (cachedData.source || 'unknown') + '+stale' }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
}

function aggregateJamming(points: any[], threshold: number) {
  if (points.length === 0) return [];
  const grid = new Map<string, { lat: number; lng: number; count: number; total_nac_p: number }>();
  const GRID_SIZE = 2;

  for (const p of points) {
    const gLat = Math.floor(p.lat / GRID_SIZE) * GRID_SIZE;
    const gLng = Math.floor(p.lng / GRID_SIZE) * GRID_SIZE;
    const key = `${gLat},${gLng}`;
    if (!grid.has(key)) grid.set(key, { lat: gLat + GRID_SIZE / 2, lng: gLng + GRID_SIZE / 2, count: 0, total_nac_p: 0 });
    const cell = grid.get(key)!;
    cell.count++;
    cell.total_nac_p += p.nac_p;
  }

  return Array.from(grid.values())
    .filter(z => z.count >= 3)
    .map(z => ({
      lat: z.lat,
      lng: z.lng,
      severity: Math.round((1 - (z.total_nac_p / z.count) / threshold) * 100),
      count: z.count,
    }));
}
