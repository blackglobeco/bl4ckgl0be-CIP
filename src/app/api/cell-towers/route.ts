import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

/**
 * OSIRIS — Cell Tower Intelligence API
 * Source: Turso (libSQL) database — populated from OpenCelliD community CSV
 *
 * DB schema:
 *   cell_towers(id, radio, mcc, mnc, lac, cell, lon, lat, range, samples,
 *               created, updated, avg_signal)
 *   Indexes: idx_lat_lon, idx_mcc, idx_radio
 *
 * Fetches the top towers globally by sample count — no BBOX, no position needed.
 */

// ── Turso client (module-level singleton) ────────────────────────────────────
const db = createClient({
  url:       process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// ── Types ────────────────────────────────────────────────────────────────────
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
  signal: string;
  operator: string;
  country: string;
  city: string;
}

// MCC → country code map
const MCC_COUNTRY: Record<number, string> = {
  202: 'GR', 204: 'NL', 206: 'BE', 208: 'FR', 212: 'MC', 213: 'AD',
  214: 'ES', 216: 'HU', 218: 'BA', 219: 'HR', 220: 'RS', 222: 'IT',
  226: 'RO', 228: 'CH', 230: 'CZ', 231: 'SK', 232: 'AT', 234: 'GB',
  238: 'DK', 240: 'SE', 242: 'NO', 244: 'FI', 246: 'LT', 247: 'LV',
  248: 'EE', 250: 'RU', 255: 'UA', 257: 'BY', 259: 'MD', 260: 'PL',
  262: 'DE', 266: 'GI', 268: 'PT', 270: 'LU', 272: 'IE', 274: 'IS',
  276: 'AL', 278: 'MT', 280: 'CY', 282: 'GE', 283: 'AM', 284: 'BG',
  286: 'TR', 288: 'FO', 290: 'GL', 293: 'SI', 294: 'MK', 295: 'LI',
  302: 'CA', 308: 'PM', 310: 'US', 311: 'US', 312: 'US', 313: 'US',
  314: 'US', 315: 'US', 316: 'US', 330: 'PR', 334: 'MX', 338: 'JM',
  340: 'GP', 342: 'BB', 344: 'AG', 346: 'KY', 348: 'VG', 350: 'BM',
  352: 'GD', 354: 'MS', 356: 'KN', 358: 'LC', 360: 'VC', 362: 'CW',
  363: 'AW', 364: 'BS', 365: 'AI', 366: 'DM', 368: 'CU', 370: 'DO',
  372: 'HT', 374: 'TT', 376: 'TC', 400: 'AZ', 401: 'KZ', 402: 'BT',
  404: 'IN', 405: 'IN', 406: 'IN', 410: 'PK', 412: 'AF', 413: 'LK',
  414: 'MM', 415: 'LB', 416: 'JO', 417: 'SY', 418: 'IQ', 419: 'KW',
  420: 'SA', 421: 'YE', 422: 'OM', 424: 'AE', 425: 'IL', 426: 'BH',
  427: 'QA', 428: 'MN', 429: 'NP', 430: 'AE', 431: 'AE', 432: 'IR',
  434: 'UZ', 436: 'TJ', 437: 'KG', 438: 'TM', 440: 'JP', 441: 'JP',
  450: 'KR', 452: 'VN', 454: 'HK', 455: 'MO', 456: 'KH', 457: 'LA',
  460: 'CN', 461: 'CN', 466: 'TW', 467: 'KP', 470: 'BD', 472: 'MV',
  502: 'MY', 505: 'AU', 510: 'ID', 514: 'TL', 515: 'PH', 520: 'TH',
  525: 'SG', 528: 'BN', 530: 'NZ', 536: 'NR', 537: 'PG', 539: 'TO',
  540: 'SB', 541: 'VU', 542: 'FJ', 544: 'AS', 545: 'KI', 546: 'NC',
  547: 'PF', 548: 'CK', 549: 'WS', 550: 'FM', 551: 'MH', 552: 'PW',
  602: 'EG', 603: 'DZ', 604: 'MA', 605: 'TN', 606: 'LY', 607: 'GM',
  608: 'SN', 609: 'MR', 610: 'ML', 611: 'GN', 612: 'CI', 613: 'BF',
  614: 'NE', 615: 'TG', 616: 'BJ', 617: 'MU', 618: 'LR', 619: 'SL',
  620: 'GH', 621: 'NG', 622: 'TD', 623: 'CF', 624: 'CM', 625: 'CV',
  626: 'ST', 627: 'GQ', 628: 'GA', 629: 'CG', 630: 'CD', 631: 'AO',
  632: 'GW', 633: 'SC', 634: 'SD', 635: 'RW', 636: 'ET', 637: 'SO',
  638: 'DJ', 639: 'KE', 640: 'TZ', 641: 'UG', 642: 'BI', 643: 'MZ',
  645: 'ZM', 646: 'MG', 647: 'RE', 648: 'ZW', 649: 'NA', 650: 'MW',
  651: 'LS', 652: 'BW', 653: 'SZ', 654: 'KM', 655: 'ZA', 657: 'ER',
  702: 'BZ', 704: 'GT', 706: 'SV', 708: 'HN', 710: 'NI', 712: 'CR',
  714: 'PA', 716: 'PE', 722: 'AR', 724: 'BR', 730: 'CL', 732: 'CO',
  734: 'VE', 736: 'BO', 738: 'GY', 740: 'EC', 742: 'GF', 744: 'PY',
  746: 'SR', 748: 'UY', 750: 'FK',
};

// ── Query Turso — global fetch, no BBOX ──────────────────────────────────────
async function queryAllTowers(radioFilter?: string): Promise<Tower[]> {
  const radioClause = radioFilter ? `WHERE radio = ?` : '';
  const args: string[] = radioFilter ? [radioFilter] : [];

  const result = await db.execute({
    sql: `SELECT radio, mcc, mnc, lac, cell, lon, lat, range, samples, updated, avg_signal
          FROM   cell_towers
          ${radioClause}
          ORDER  BY samples DESC
          LIMIT  5000`,
    args,
  });

  return result.rows.map((row, i) => {
    const mcc       = Number(row.mcc);
    const updated   = row.updated
      ? new Date(Number(row.updated) * 1000).toISOString().split('T')[0]
      : 'Unknown';
    const rawSignal = Number(row.avg_signal);

    return {
      id:       `ct-db-${i}-${row.cell}`,
      radio:    String(row.radio),
      mcc,
      mnc:      Number(row.mnc),
      lac:      Number(row.lac),
      cid:      Number(row.cell),
      lat:      Number(row.lat),
      lng:      Number(row.lon),
      range:    Number(row.range)   || 1000,
      samples:  Number(row.samples) || 0,
      updated,
      signal:   rawSignal ? `${rawSignal} dBm` : '',
      operator: '',
      country:  MCC_COUNTRY[mcc] ?? '',
      city:     '',
    };
  });
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const radio = searchParams.get('radio') || undefined;

  // ── DB not configured ─────────────────────────────────────────────────────
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.warn('[cell-towers] TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set');
    return NextResponse.json(
      { towers: [], total: 0, source: 'no_db_config', timestamp: new Date().toISOString() },
      { status: 200 },
    );
  }

  // ── Query DB ──────────────────────────────────────────────────────────────
  try {
    const towers = await queryAllTowers(radio);

    return NextResponse.json(
      { towers, total: towers.length, source: 'turso_db', timestamp: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch (err) {
    console.error('[cell-towers] Turso query failed:', err);
    return NextResponse.json(
      {
        towers:    [],
        total:     0,
        source:    'db_error',
        error:     err instanceof Error ? err.message : 'Unknown DB error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
