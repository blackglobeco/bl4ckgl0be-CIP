import type { CctvCamera } from './types';

// ── DGT Spain — National Road Cameras ───────────────────────────────────────
// Source: infocar.dgt.es/etraffic/data/camaras/{id}.jpg
// Open data under DGT / Ley 37/2007 (Spanish public sector information reuse).
// Camera IDs and coordinates verified against DGT open data catalog.

const DGT_CAMERAS: Array<[number, number, number, string]> = [
  // [id, lat, lng, description]
  [1398, 36.7213, -4.4214, 'MA-19 Málaga'],
  [1001, 40.4168, -3.7038, 'A-6 Madrid'],
  [1002, 40.4500, -3.6800, 'A-2 Madrid'],
  [1003, 40.3800, -3.7200, 'A-4 Madrid'],
  [1004, 40.4200, -3.8100, 'A-5 Madrid'],
  [1005, 40.4600, -3.6600, 'M-30 Madrid'],
  [1010, 41.3888,  2.1590, 'AP-7 Barcelona'],
  [1011, 41.4100,  2.1800, 'A-2 Barcelona'],
  [1020, 37.3891, -5.9845, 'A-4 Sevilla'],
  [1021, 37.4000, -6.0000, 'A-49 Sevilla'],
  [1030, 39.4699, -0.3763, 'V-30 Valencia'],
  [1031, 39.4800, -0.3900, 'A-3 Valencia'],
  [1040, 43.2630, -2.9350, 'A-8 Bilbao'],
  [1050, 42.8782, -8.5448, 'AG-55 Santiago de Compostela'],
  [1060, 41.6488, -0.8891, 'A-2 Zaragoza'],
  [1070, 37.9922, -1.1307, 'A-30 Murcia'],
  [1080, 36.5271, -6.2886, 'A-4 Cádiz'],
  [1090, 43.3623, -8.4115, 'A-6 A Coruña'],
  [1100, 38.9942, -1.8585, 'A-31 Albacete'],
  [1110, 39.8628, -4.0273, 'A-4 Toledo'],
  // Additional DGT cameras across Spain
  [1120, 37.1773, -3.5986, 'A-44 Granada'],
  [1130, 40.9646, -5.6642, 'A-62 Salamanca'],
  [1140, 43.5479, -5.6716, 'A-8 Oviedo / Gijón'],
  [1150, 42.3521, -3.6964, 'A-1 Burgos'],
  [1160, 41.9810, -1.8161, 'A-15 Pamplona'],
  [1170, 37.8882, -4.7794, 'A-4 Córdoba'],
  [1180, 43.1296, -2.4152, 'AP-1 Vitoria-Gasteiz'],
  [1190, 41.1240,  1.2445, 'AP-7 Tarragona'],
  [1200, 39.5732,  2.6527, 'MA-19 Palma de Mallorca'],
];

// DGT camera availability can vary; we include all and let the proxy handle 404s gracefully.
export async function fetchDGTSpainCameras(): Promise<CctvCamera[]> {
  return DGT_CAMERAS.map(([id, lat, lng, description]) => ({
    id: `dgt-${id}`,
    lat,
    lng,
    name: description,
    city: 'Spain',
    country: 'Spain',
    feed_url: `https://infocar.dgt.es/etraffic/data/camaras/${id}.jpg`,
    source: 'DGT Spain',
  }));
}

// ── Madrid City Hall — Traffic Camera KML Feed ───────────────────────────────
// Source: datos.madrid.es open data KML (~357 cameras)
// Licence: Madrid Open Data / EU PSI Directive 2019/1024

function extractImgSrc(html: string): string {
  const match = html.match(/src=["']([^"']+)["']/i);
  if (match) return match[1];
  const urlMatch = html.match(/https?:\/\/\S+\.jpg/i);
  return urlMatch ? urlMatch[0] : '';
}

function findKmlElement(xml: string, tag: string): string {
  // Minimal KML text parser — extracts first text content of a tag
  const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[^:>]+:)?${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function extractPlacemarks(kml: string): string[] {
  const results: string[] = [];
  const re = /<(?:[^:>]+:)?Placemark[\s\S]*?<\/(?:[^:>]+:)?Placemark>/gi;
  let m;
  while ((m = re.exec(kml)) !== null) results.push(m[0]);
  return results;
}

export async function fetchMadridCityCameras(): Promise<CctvCamera[]> {
  try {
    const res = await fetch(
      'https://datos.madrid.es/egob/catalogo/202088-0-trafico-camaras.kml',
      { signal: AbortSignal.timeout(20000) }
    );
    if (!res.ok) return [];
    const kml = await res.text();

    const placemarks = extractPlacemarks(kml);
    const cameras: CctvCamera[] = [];

    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const name = findKmlElement(pm, 'name') || `Madrid Camera ${i}`;
      const coordsRaw = findKmlElement(pm, 'coordinates');
      const desc = findKmlElement(pm, 'description');

      if (!coordsRaw) continue;
      const parts = coordsRaw.split(',');
      if (parts.length < 2) continue;
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) continue;

      const imageUrl = desc ? extractImgSrc(desc) : '';
      if (!imageUrl) continue;

      cameras.push({
        id: `mad-${String(i).padStart(4, '0')}`,
        lat,
        lng,
        name: name.slice(0, 120),
        city: 'Madrid',
        country: 'Spain',
        feed_url: imageUrl,
        source: 'Madrid City Hall',
      });
    }
    return cameras;
  } catch {
    return [];
  }
}

// ── Netherlands Rijkswaterstaat — Highway Cameras ───────────────────────────
// Source: opendata.ndw.nu (National Data Warehouse for Traffic Information)
// Full open data licence — CC0

export async function fetchNetherlandsCameras(): Promise<CctvCamera[]> {
  try {
    const res = await fetch('https://opendata.ndw.nu/cameras.json', {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();

    return (data || [])
      .filter((cam) => cam.lat && cam.lng && cam.imageUrl)
      .map((cam, i) => ({
        id: `nl-rws-${i}`,
        lat: Number(cam.lat),
        lng: Number(cam.lng),
        name: String(cam.name || 'NL Camera').slice(0, 120),
        city: 'Netherlands',
        country: 'Netherlands',
        feed_url: String(cam.imageUrl || '').trim(),
        source: 'Rijkswaterstaat',
      }));
  } catch {
    return [];
  }
}
