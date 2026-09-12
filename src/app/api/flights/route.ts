
import { NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * OSIRIS — Flight Data API
 *
 * adsb.lol/v2 (the original data source for this route) now returns 200 with
 * an always-empty {"ac":[],"total":0}, and the two obvious replacements —
 * api.airplanes.live and api.adsb.one — both 403 every endpoint. All three
 * failure modes are silent: a 403 body is just discarded, and an empty ac[]
 * is indistinguishable from genuinely quiet airspace. Because nothing ever
 * throws, the map degraded to zero aircraft without any error surfacing.
 *
 * This version fans out to two independent providers instead of one:
 *   - OpenSky Network `/states/all` — primary global snapshot. Works
 *     anonymously (400 credits/day) or authenticated (4000 credits/day) if
 *     OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET are set in the environment.
 *   - adsb.fi — a still-functioning tar1090/ADSBExchange-v2-shaped feed.
 *     Its dedicated `/mil` endpoint is polled every cycle for military
 *     traffic; its geographic `/lat/.../lon/.../dist/...` endpoint is only
 *     swept regionally as a last resort if OpenSky returns nothing at all.
 *
 * Per-provider counts are included in the response (`providers`) so the next
 * feed that goes dark is visible in the payload instead of silently emptying
 * the map again.
 */

// 30 regions covering every major aviation corridor at 250 nm radius.
// Only used as a fallback sweep when OpenSky has no usable snapshot.
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

// Helicopter type codes
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

// Airliner and regional types. A typed airliner stays commercial whatever
// its callsign says.
const AIRLINER_TYPES = new Set([
  'A319','A320','A321','A332','A333','A339','A343','A359','A388',
  'B737','B738','B739','B38M','B39M','B752','B753','B763','B764',
  'B772','B77L','B77W','B788','B789','B78X',
  'E170','E175','E190','E195','CRJ7','CRJ9','AT43','AT72','DH8D',
]);

// Fractional-ownership and charter operators file under a 3-letter ICAO
// designator exactly like an airline, so AIRLINE_CODE_RE matches them and
// they would otherwise be counted as commercial traffic.
const BIZJET_OPERATORS = new Set([
  'EJA','EJM','NJE','LXJ','FJO','VJT','XOJ','JTL','WUP','GAJ','DPJ','CLY','TWY',
]);

const AIRLINE_CODE_RE = /^([A-Z]{3})\d/;

// A callsign that is not an airline designator + flight number is a
// registration: what general-aviation aircraft broadcast once the hyphen is
// stripped — DMMKG (D-MMKG), HBYKO (HB-YKO), OEDLH (OE-DLH), N425RS, CGABC.
const CALLSIGN_RE = /^[A-Z0-9]{3,8}$/;

// Business jets cruise in the mid-thirties at transonic speed; nothing flying
// under a civil registration reaches FL280 at 300 kt without turbofans. This
// is the only bizjet/piston discriminator available for OpenSky aircraft,
// which carry no aircraft type at all.
const JET_CRUISE_ALT_M = 8500;
const JET_CRUISE_KTS = 300;

const ADSB_MAX_DIST = 250; // nm — hard cap the provider enforces
const ADSBFI_BASE = 'https://opendata.adsb.fi/api/v2';
// The geographic lookup has moved: adsb.fi's own docs mark
// v2/lat/{lat}/lon/{lon}/dist/{dist} as deprecated ("kept for backward
// compatibility... the v3 endpoint should be used for all new integrations").
// It still answers 200 but its ac[] came back empty across all 30 regions in
// testing — including zones that cannot plausibly be quiet airspace (NYC,
// Central Europe, Japan) — so this route uses v3 for that call specifically.
// /mil is unaffected by this and stays on v2, where it's still current.
const ADSBFI_V3_GEO_BASE = 'https://opendata.adsb.fi/api/v3';

// adsb.fi allows roughly one request per second and soft-throttles over that
// by returning 200 with an empty ac[] rather than 429, so a parallel fanout
// would look like it succeeded while returning nothing. The regional sweep
// is paced instead of parallelized.
const ADSBFI_GAP_MS = 1100;

const FETCH_HEADERS = { 'Accept': 'application/json' };

// undici's fetch (Node's built-in fetch, used by Next.js on Vercel) throws a
// generic "TypeError: fetch failed" on connection-level failures — the
// useful detail (ECONNRESET, UND_ERR_CONNECT_TIMEOUT, DNS failure, etc.) is
// nested in error.cause, which .message alone doesn't include. This is a
// known Vercel/undici issue (see VERCEL_UNDICI=1 env var) rather than
// anything provider-specific, so it's worth unwrapping to tell those apart
// from an actual HTTP-level rejection.
function describeError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const cause = (e as Error & { cause?: unknown }).cause;
  const causeStr = cause instanceof Error ? `${cause.name}: ${cause.message}` : cause ? String(cause) : null;
  return causeStr ? `${e.name}: ${e.message} (cause: ${causeStr})` : `${e.name}: ${e.message}`;
}

// Distinguishes a connection-level failure (TCP connect timeout, DNS
// failure, connection refused/reset) from an HTTP-level one (4xx/5xx). Seen
// in practice: opensky-network.org sometimes never completes the TCP
// handshake at all from certain Vercel deployments/regions — a structural,
// not transient, block. Retrying that within the same request just repeats
// the same ~10s wait for no benefit, so this failure type triggers a cooldown
// instead of a retry.
function isConnectionError(e: unknown): boolean {
  return /ConnectTimeoutError|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ECONNRESET|UND_ERR_CONNECT_TIMEOUT|fetch failed/i.test(describeError(e));
}

// Small retry helper for connection-level failures (undici's intermittent
// "fetch failed" on Vercel serverless cold starts). Does not retry on a
// normal HTTP error response — only on the fetch call itself throwing.
//
// initFactory, not a static init: an AbortSignal.timeout() starts counting
// down the moment it's created, so a single init object shared across
// attempts hands the second attempt an already-fired signal — it fails
// instantly instead of getting its own fresh timeout window.
async function fetchWithRetry(url: string, initFactory: () => RequestInit, attempts = 2): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, initFactory());
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

// adsb.fi serves /mil but returns 400 for /ladd, /pia and /squawk/{code}, so
// the global type feeds collapse to the military one.
//
// Returns both the aircraft array and a diagnostic string (null on success)
// so a systematic failure across the regional sweep is visible in the
// response instead of looking identical to 30 quiet patches of sky.
async function fetchAdsbFiRegion(lat: number, lon: number): Promise<{ ac: any[]; error: string | null }> {
  try {
    const res = await fetch(`${ADSBFI_V3_GEO_BASE}/lat/${lat}/lon/${lon}/dist/${ADSB_MAX_DIST}`, {
      signal: AbortSignal.timeout(12000),
      headers: FETCH_HEADERS,
    });
    if (res.ok) {
      const data = await res.json();
      return { ac: data.ac || [], error: null };
    }
    const body = await res.text().catch(() => '');
    await res.body?.cancel().catch(() => {});
    return { ac: [], error: `HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}` };
  } catch (e) {
    return { ac: [], error: describeError(e) };
  }
}

function classifyFlight(f: any) {
  const modelUpper = (f.t || '').toUpperCase();
  const flightStr = (f.flight || '').trim().toUpperCase();
  const dbFlags = (f.dbFlags || 0);

  // Skip fixed structures
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

  const isOsMilitary = f.category_os === 14;
  const isOsHighPerf = f.category_os === 7;
  const isOsLight = f.category_os === 2;
  // Large / high-vortex large / heavy — airline or cargo metal by weight alone.
  const isOsHeavy = f.category_os === 4 || f.category_os === 5 || f.category_os === 6;

  // Extract airline code
  const airlineMatch = AIRLINE_CODE_RE.exec(callsign);
  const airlineCode = airlineMatch ? airlineMatch[1] : '';

  // OpenSky supplies no aircraft type, and its ADS-B emitter category is "no
  // information" for the large majority of aircraft even with extended=1.
  // Every type-based test below therefore only fires on the adsb.fi feeds.
  // The callsign is the field OpenSky always fills, so the airline-designator
  // test is what carries the split for the bulk of the map.
  const isGaCallsign = !airlineCode && CALLSIGN_RE.test(flightStr);
  const cruisesLikeAJet =
    altMeters > JET_CRUISE_ALT_M && (speedKnots ?? 0) > JET_CRUISE_KTS;

  // Classification
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

// In-memory cache — per-isolate in serverless environments (Vercel), which
// is fine: it coalesces concurrent requests within an isolate and keeps us
// inside provider budgets even if several isolates each hold their own copy.
let cachedData: any = null;
let lastFetchTime = 0;
// 90s TTL keeps us within the authenticated OpenSky budget (4000 credits/day,
// 4 credits/call ≈ one call per 86s). A shorter TTL on the anonymous pool
// (400 credits/day) burns the whole day's budget in well under an hour.
const CACHE_TTL = 90000;
let fetchPromise: Promise<any> | null = null;

// OpenSky's budget is per day, not per request, so it needs its own interval
// separate from the response cache above.
const hasOpenSkyCreds = () =>
  Boolean(process.env.OPENSKY_CLIENT_ID && process.env.OPENSKY_CLIENT_SECRET);
const openSkyInterval = () => (hasOpenSkyCreds() ? 90000 : 900000);

// The last good OpenSky snapshot is kept and reused between calls so the map
// doesn't swing between a full snapshot and near-empty every cycle while
// waiting out the anonymous interval. providers.opensky_age_s reports how
// stale it is.
let osSnapshot: any[] = [];
let osSnapshotTime = 0;

// Back off from OpenSky after a 429, or after a connection-level failure
// (TCP connect timeout to opensky-network.org — seen in practice from some
// Vercel deployments/regions, and structural rather than transient: retrying
// within the same request just repeats the same ~10s wait for no benefit).
// Either way, re-attempting on every single cold invocation wastes most of
// the function's time budget on a doomed connection instead of leaving that
// time for the adsb.fi regional sweep, which does work.
let openSkyCooldownUntil = 0;
const OPENSKY_COOLDOWN_429 = 15 * 60 * 1000; // 15 min — quota-based, likely to reset
const OPENSKY_COOLDOWN_CONN_FAIL = 10 * 60 * 1000; // 10 min — network-level, re-check periodically in case routing changes

// OpenSky OAuth2 — optional but recommended. Without keys: anonymous, works
// but on a much smaller daily credit pool shared per-IP. Setting these env
// vars (free at opensky-network.org) moves onto the per-account pool.
let osToken: string | null = null;
let osTokenExpiry = 0;
// Last reason getOpenSkyToken() didn't return a usable token — surfaced in
// the response's providers block instead of only going to console.warn.
let osTokenLastError: string | null = null;

async function getOpenSkyToken(): Promise<string | null> {
  const id = process.env.OPENSKY_CLIENT_ID;
  const secret = process.env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) { osTokenLastError = 'no credentials configured'; return null; }
  if (osToken && Date.now() < osTokenExpiry) { osTokenLastError = null; return osToken; }
  try {
    const res = await fetchWithRetry(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      () => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
        signal: AbortSignal.timeout(11000),
      }),
      1 // no retry: a connect-level failure here is structural, not transient — see isConnectionError
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      osTokenLastError = `token HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`;
      console.warn('[BLACK GLOBE] OpenSky token failed:', osTokenLastError);
      return null;
    }
    const data = await res.json();
    if (!data.access_token) {
      osTokenLastError = 'token response missing access_token';
      console.warn('[BLACK GLOBE]', osTokenLastError);
      return null;
    }
    osToken = data.access_token;
    osTokenExpiry = Date.now() + ((data.expires_in || 1800) - 60) * 1000;
    osTokenLastError = null;
    return osToken;
  } catch (e) {
    osTokenLastError = `token ${describeError(e)}`;
    console.warn('[BLACK GLOBE] OpenSky token error:', osTokenLastError);
    if (isConnectionError(e)) {
      openSkyCooldownUntil = Date.now() + OPENSKY_COOLDOWN_CONN_FAIL;
      console.warn(`[BLACK GLOBE] OpenSky connection-level failure — cooling down ${OPENSKY_COOLDOWN_CONN_FAIL / 60000} min`);
    }
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

  // Return cached data if within TTL
  if (cachedData && now - lastFetchTime < CACHE_TTL) {
    return NextResponse.json(cachedData, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  }

  // Coalesce concurrent requests: wait for the active fetch rather than starting a new one
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

  // Vercel kills the whole function at maxDuration (60s) regardless of our
  // own try/catch — that's a platform-level kill, not a JS exception we can
  // catch and fall back from. So the regional sweep needs to know its own
  // budget and bail out with partial results well before that wall, rather
  // than trusting it'll finish in time and finding out the hard way (504,
  // no response at all — worse than the empty-data problem this route
  // exists to fix).
  const FUNCTION_BUDGET_MS = 45000; // maxDuration(60s) minus headroom for classification + response
  const hardDeadline = now + FUNCTION_BUDGET_MS;

  fetchPromise = (async () => {
    const allRaw: any[] = [];
    const seenHex = new Set<string>();
    let source: string;

    // ── Phase 1 + 2 in parallel: global military feed AND OpenSky simultaneously ──
    // Running them together keeps total wall-clock time to max(mil_feed, opensky)
    // instead of sum. The military feed runs every cycle regardless of OpenSky
    // status, so military traffic stays live even while an anonymous OpenSky
    // snapshot is waiting out its interval.
    const skipOpenSky =
      Date.now() < openSkyCooldownUntil ||
      Date.now() - osSnapshotTime < openSkyInterval();

    // Reason the current cycle ends up with no fresh OpenSky snapshot —
    // reported in providers.opensky_status instead of only reachable via logs.
    let openSkyStatus: string =
      Date.now() < openSkyCooldownUntil
        ? `cooling down until ${new Date(openSkyCooldownUntil).toISOString()} (last attempt: 429 or connection failure)`
        : Date.now() - osSnapshotTime < openSkyInterval()
          ? 'skipped — snapshot still fresh'
          : 'pending';

    // Token acquisition + states/all fetch happen inside one branch, raced
    // against the mil feed — not awaited beforehand. Blocking on the token
    // first (as an earlier version of this route did) serialized an entire
    // extra network round trip ahead of everything else, which is exactly
    // the kind of dead time that pushed a slow cold start over the 60s wall.
    const osStatesBranch: Promise<Response> = (async () => {
      if (skipOpenSky) throw new Error('OpenSky in cooldown');
      const token = await getOpenSkyToken();
      if (!token && osTokenLastError && osTokenLastError !== 'no credentials configured') {
        openSkyStatus = `token error: ${osTokenLastError}`;
      }
      // extended=1 appends the ADS-B emitter category as an 18th field.
      // Without it the state vector is 17 long and s[17] is undefined,
      // which would leave every category_os test in classifyFlight() dead.
      return fetchWithRetry(
        'https://opensky-network.org/api/states/all?extended=1',
        () => token
          ? { signal: AbortSignal.timeout(12000), headers: { Authorization: `Bearer ${token}` } }
          : { signal: AbortSignal.timeout(12000) },
        1 // no retry: see isConnectionError — a connect-level failure here is structural
      );
    })();

    const [milRes, osRes] = await Promise.allSettled([
      fetch(`${ADSBFI_BASE}/mil`, { signal: AbortSignal.timeout(15000), headers: FETCH_HEADERS }),
      osStatesBranch,
    ]);

    // Drain the military feed — parse on ok, discard the body otherwise to free the connection.
    if (milRes.status === 'fulfilled') {
      if (milRes.value.ok) {
        try {
          const data = await milRes.value.json();
          ingestAc(data.ac || [], allRaw, seenHex);
        } catch (e) {
          console.warn('[BLACK GLOBE] adsb.fi mil parse error:', e);
        }
      } else {
        console.warn('[BLACK GLOBE] adsb.fi mil feed returned', milRes.value.status);
        await milRes.value.body?.cancel();
      }
    }
    const milCount = allRaw.length;

    // Refresh the OpenSky snapshot when one was due; otherwise the existing
    // one carries over untouched.
    if (osRes.status === 'fulfilled') {
      if (osRes.value.status === 429) {
        openSkyCooldownUntil = Date.now() + OPENSKY_COOLDOWN_429;
        openSkyStatus = 'HTTP 429 — cooling down 15 min';
        console.warn('[BLACK GLOBE] OpenSky 429 — cooling down 15 min');
        await osRes.value.body?.cancel();
      } else if (osRes.value.ok) {
        try {
          const data = await osRes.value.json();
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
            openSkyStatus = 'ok';
          } else {
            openSkyStatus = `200 OK but only ${states.length} states — treated as unusable (threshold 100)`;
          }
        } catch (e) {
          openSkyStatus = e instanceof Error ? `parse error: ${e.name}: ${e.message}` : `parse error: ${e}`;
          console.warn('[BLACK GLOBE] OpenSky parse error:', e);
        }
      } else {
        const body = await osRes.value.text().catch(() => '');
        openSkyStatus = `HTTP ${osRes.value.status}${body ? `: ${body.slice(0, 200)}` : ''}`;
        console.warn('[BLACK GLOBE] OpenSky returned', osRes.value.status);
        await osRes.value.body?.cancel().catch(() => {});
      }
    } else if (!skipOpenSky) {
      openSkyStatus = describeError(osRes.reason);
      if (isConnectionError(osRes.reason)) {
        openSkyCooldownUntil = Date.now() + OPENSKY_COOLDOWN_CONN_FAIL;
        console.warn(`[BLACK GLOBE] OpenSky connection-level failure — cooling down ${OPENSKY_COOLDOWN_CONN_FAIL / 60000} min`);
      }
    }

    ingestAc(osSnapshot, allRaw, seenHex);
    const openSkyWorked = osSnapshot.length > 0;

    // ── Phase 3: Regional sweep — last resort only ──────────────────────────
    // Runs only when there is no OpenSky snapshot at all, never as the steady
    // state. adsb.fi's geographic endpoint is metered more tightly than /mil
    // and answers 200 with an empty ac[] once its budget is spent rather than
    // 429, so sweeping it every cycle would quietly exhaust it and look like
    // empty airspace. Paced at ~1 req/s; 30 regions ≈ 33-40s in the best case,
    // but Phase 1 (mil + OpenSky) can itself eat 15-28s on a cold start, so
    // this loop checks hardDeadline every iteration and stops with whatever
    // it's gathered rather than risk the platform killing the function
    // outright at maxDuration — a 504 with zero data is strictly worse than
    // an incomplete-but-real 200.
    // Distinct region errors, capped so a systematic failure (30 identical
    // messages) doesn't bloat the response — one example of each kind is
    // enough to diagnose it.
    const regionalErrors = new Map<string, number>();
    let regionalOkCount = 0;
    let regionalStoppedEarly = false;

    if (!openSkyWorked) {
      source = 'regional';
      console.warn('[BLACK GLOBE] no OpenSky snapshot — falling back to adsb.fi regional sweep');

      for (const r of REGIONS) {
        if (Date.now() > hardDeadline) {
          regionalStoppedEarly = true;
          console.warn(
            `[BLACK GLOBE] regional sweep hit time budget after ${regionalOkCount + regionalErrors.size} ` +
            `of ${REGIONS.length} zones — returning partial results instead of risking a platform timeout`
          );
          break;
        }
        const { ac, error } = await fetchAdsbFiRegion(r.lat, r.lon);
        if (error) {
          regionalErrors.set(error, (regionalErrors.get(error) || 0) + 1);
        } else {
          regionalOkCount++;
        }
        ingestAc(ac, allRaw, seenHex);
        await new Promise(resolve => setTimeout(resolve, ADSBFI_GAP_MS));
      }

      if (allRaw.length === milCount) {
        console.error(
          '[BLACK GLOBE] regional sweep added zero aircraft on top of the mil feed — ' +
          'set OPENSKY_CLIENT_ID/OPENSKY_CLIENT_SECRET (free at opensky-network.org); ' +
          'the anonymous 400 credits/day pool cannot sustain a live map. ' +
          'Regional errors: ' + JSON.stringify(Object.fromEntries(regionalErrors))
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

      // GPS jamming detection
      if (typeof flight.nac_p === 'number' && flight.nac_p <= JAMMING_NACAP_THRESHOLD && !flight.grounded) {
        gpsJamming.push({
          lat: flight.lat,
          lng: flight.lng,
          nac_p: flight.nac_p,
          callsign: flight.callsign,
        });
      }

      switch (flight.category) {
        case 'military': military.push(flight); break;
        case 'jet': jets.push(flight); break;
        case 'private': privateFl.push(flight); break;
        default: commercial.push(flight);
      }
    }

    return {
      commercial_flights: commercial,
      private_flights: privateFl,
      private_jets: jets,
      military_flights: military,
      gps_jamming: aggregateJamming(gpsJamming, JAMMING_NACAP_THRESHOLD),
      total: allRaw.length,
      source,
      // Per-provider counts so a feed that starts answering 200 with no
      // aircraft is visible in the payload rather than silently emptying
      // the map, the way the old single-source adsb.lol call did.
      providers: {
        adsbfi_mil: milCount,
        adsbfi_regional: openSkyWorked ? 0 : allRaw.length - milCount,
        // Only populated during a regional sweep. regional_ok is how many of
        // the 30 zones returned a normal (possibly empty) 200; anything in
        // regional_errors means that zone's request itself failed — a
        // non-zero count across most/all zones points at adsb.fi blocking or
        // rate-limiting this deployment's IP, the same failure mode adsb.lol
        // had, rather than genuinely quiet airspace.
        adsbfi_regional_ok: openSkyWorked ? null : regionalOkCount,
        adsbfi_regional_errors: openSkyWorked ? null : Object.fromEntries(regionalErrors),
        adsbfi_regional_stopped_early: openSkyWorked ? null : regionalStoppedEarly,
        opensky: osSnapshot.length,
        opensky_auth: hasOpenSkyCreds(),
        opensky_age_s: osSnapshotTime ? Math.round((Date.now() - osSnapshotTime) / 1000) : null,
        // Why this cycle's OpenSky call did or didn't produce a snapshot —
        // 'ok', a skip reason, or the actual HTTP/parse/token error.
        opensky_status: openSkyStatus,
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
    console.error('[BLACK GLOBE] Flight fetch error:', error);
    fetchPromise = null;
    // Stale-cache fallback: return last known good data instead of a blank map
    if (cachedData) {
      console.warn('[BLACK GLOBE] Returning stale flight cache as fallback');
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
  const GRID_SIZE = 2; // degrees

  for (const p of points) {
    const gLat = Math.floor(p.lat / GRID_SIZE) * GRID_SIZE;
    const gLng = Math.floor(p.lng / GRID_SIZE) * GRID_SIZE;
    const key = `${gLat},${gLng}`;

    if (!grid.has(key)) {
      grid.set(key, { lat: gLat + GRID_SIZE / 2, lng: gLng + GRID_SIZE / 2, count: 0, total_nac_p: 0 });
    }
    const cell = grid.get(key)!;
    cell.count++;
    cell.total_nac_p += p.nac_p;
  }

  return Array.from(grid.values())
    .filter(z => z.count >= 3) // Minimum 3 aircraft with degraded NACp
    .map(z => ({
      lat: z.lat,
      lng: z.lng,
      severity: Math.round((1 - (z.total_nac_p / z.count) / threshold) * 100),
      count: z.count,
    }));
}
