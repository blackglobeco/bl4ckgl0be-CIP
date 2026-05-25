import { NextRequest, NextResponse } from 'next/server';

/**
 * OSIRIS — Cell Tower Intelligence API
 * Sources: OpenCelliD (community DB) via Mozilla Location Services fallback
 * Returns cell towers for a given bounding box (or a global sample if no bbox)
 * Radio types: GSM, UMTS (3G), LTE (4G), NR (5G)
 *
 * OpenCelliD API docs: https://opencellid.org/api
 * Free tier: unlimited reads, community CSV also available
 */

const OPENCELLID_TOKEN = process.env.OPENCELLID_TOKEN || '';

// Fallback: Mozilla Location Service (MLS) — no key needed, community data
// MLS geolocate returns nearest towers for a given lat/lng
const MLS_URL = 'https://location.services.mozilla.com/v1/geolocate?key=test';

// OpenCelliD bbox endpoint
const OCID_BBOX_URL = 'https://opencellid.org/api/getStationsInArea.php';

// Network type labels
const RADIO_LABELS: Record<string, string> = {
  GSM: 'GSM (2G)',
  UMTS: 'UMTS (3G)',
  LTE: 'LTE (4G)',
  NR: 'NR (5G)',
  CDMA: 'CDMA',
  default: 'Unknown',
};

const RADIO_COLORS: Record<string, string> = {
  GSM: '#FF9500',
  UMTS: '#00E5FF',
  LTE: '#39FF14',
  NR: '#FF69B4',
  CDMA: '#FFD700',
  default: '#AAAAAA',
};


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const radius = Math.min(parseInt(searchParams.get('radius') || '50000'), 100000); // max 100km

  // Try live OpenCelliD API if token is configured and lat/lng provided
  if (OPENCELLID_TOKEN && !isNaN(lat) && !isNaN(lng)) {
    try {
      const degOffset = (radius / 111320); // rough meters → degrees
      const bbox = `${lng - degOffset},${lat - degOffset},${lng + degOffset},${lat + degOffset}`;
      const url = `${OCID_BBOX_URL}?key=${OPENCELLID_TOKEN}&BBOX=${bbox}&format=json&limit=500`;

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const towers = (data.cells || []).map((cell: any) => ({
          id: `ct-live-${cell.radio}-${cell.mcc}-${cell.mnc}-${cell.lac}-${cell.cid}`,
          radio: cell.radio,
          mcc: cell.mcc,
          mnc: cell.mnc,
          lac: cell.lac,
          cid: cell.cid,
          lat: cell.lat,
          lng: cell.lon,
          range: cell.range || 1000,
          samples: cell.samples || 0,
          updated: cell.updated ? new Date(cell.updated * 1000).toISOString().split('T')[0] : 'Unknown',
          operator: cell.averageSignal ? `Signal: ${cell.averageSignal} dBm` : '',
          country: cell.country || '',
          city: '',
        }));

        return NextResponse.json(
          { towers, total: towers.length, source: 'opencellid_live', timestamp: new Date().toISOString() },
          { headers: { 'Cache-Control': 'public, s-maxage=900' } } // 15 min cache
        );
      }
    } catch (_) {
      // fall through to sample data
    }
  }

  // Filter sample data by bbox if lat/lng provided
  let towers = SAMPLE_TOWERS;
  if (!isNaN(lat) && !isNaN(lng)) {
    const degOffset = radius / 111320;
    towers = SAMPLE_TOWERS.filter(t =>
      t.lat >= lat - degOffset && t.lat <= lat + degOffset &&
      t.lng >= lng - degOffset && t.lng <= lng + degOffset
    );
    // If very few nearby, still return some global context
    if (towers.length < 3) towers = SAMPLE_TOWERS;
  }

  return NextResponse.json(
    {
      towers,
      total: towers.length,
      source: OPENCELLID_TOKEN ? 'opencellid_sample_fallback' : 'sample_data',
      note: OPENCELLID_TOKEN ? undefined : 'Set OPENCELLID_TOKEN env var for live data from opencellid.org',
      timestamp: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
  );
}
