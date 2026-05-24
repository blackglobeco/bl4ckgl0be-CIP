const PROXY = (url: string) =>
  `/api/cctv/proxy?url=${encodeURIComponent(url)}`;
 
export async function fetchMalaysiaCameras(): Promise<any[]> {
  const cams: any[] = [];

// ── MBJB: Majlis Bandaraya Johor Bahru – City Centre cameras ─────────────
  // Images at c10.fgies.com require Referer: jalanow.com — proxied via /api/cctv/proxy
  const mbjbCameras = [
 
    // ── City Center to Skudai ──────────────────────────────────────────────
    { id: 'mbjb-L1C1',  lat: 1.5317,  lng: 103.6741, name: 'MBJB – Jalan Skudai / Jalan Impian Utama (L1C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/01W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L1C2',  lat: 1.5320,  lng: 103.6744, name: 'MBJB – Jalan Skudai / Jalan Impian Utama (L1C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/02W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L2C1',  lat: 1.5195,  lng: 103.6828, name: 'MBJB – Jalan Skudai / Paradigm Mall (L2C1)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/03W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L2C2',  lat: 1.5198,  lng: 103.6831, name: 'MBJB – Jalan Skudai / Paradigm Mall (L2C2)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/04W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L4C1',  lat: 1.5050,  lng: 103.6960, name: 'MBJB – Jalan Skudai / Jalan Padi (L4C1)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/07W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L4C2',  lat: 1.5053,  lng: 103.6963, name: 'MBJB – Jalan Skudai / Jalan Padi (L4C2)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/08W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L6C1',  lat: 1.4820,  lng: 103.7180, name: 'MBJB – Jalan Abu Bakar Sultan / Country Garden (L6C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/09W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L6C2',  lat: 1.4823,  lng: 103.7183, name: 'MBJB – Jalan Abu Bakar Sultan / Country Garden (L6C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/10W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L7C1',  lat: 1.4770,  lng: 103.7250, name: 'MBJB – Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/11W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L7C2',  lat: 1.4773,  lng: 103.7253, name: 'MBJB – Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/12W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L24C1', lat: 1.4960,  lng: 103.7055, name: 'MBJB – Jalan TAR / Jalan Kebun Teh (L24C1)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/45W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L24C2', lat: 1.4963,  lng: 103.7058, name: 'MBJB – Jalan TAR / Jalan Kebun Teh (L24C2)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/46W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L26C1', lat: 1.4910,  lng: 103.7080, name: 'MBJB – Lbh Iskandar Puteri / Jalan TAR (L26C1)',        city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/49W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L26C2', lat: 1.4913,  lng: 103.7083, name: 'MBJB – Lbh Iskandar Puteri / Jalan TAR (L26C2)',        city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/50W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L27C2', lat: 1.5010,  lng: 103.7120, name: 'MBJB – Jalan Tampoi / Kilang Bateri (L27C2)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/52W.jpg'), source: 'MBJB' },
 
    // ── City Center ────────────────────────────────────────────────────────
    { id: 'mbjb-L3C1',  lat: 1.4606,  lng: 103.7574, name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C1)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/05W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L3C2',  lat: 1.4610,  lng: 103.7578, name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C2)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/06W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L8C1',  lat: 1.4654,  lng: 103.7615, name: 'MBJB – Jalan Ibrahim / Jalan Pahang (L8C1)',             city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/13W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L8C2',  lat: 1.4658,  lng: 103.7619, name: 'MBJB – Jalan Ibrahim / Jalan Pahang (L8C2)',             city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/14W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L9C1',  lat: 1.4635,  lng: 103.7590, name: 'MBJB – Lorong Jalan Dhoby Parking (L9C1)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/15W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L9C2',  lat: 1.4638,  lng: 103.7593, name: 'MBJB – Lorong Jalan Dhoby Parking (L9C2)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/16W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L10C2', lat: 1.4621,  lng: 103.7601, name: 'MBJB – Jalan Abdullah Ibrahim / Ungku Puan (L10C2)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/18W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L11C1', lat: 1.4614,  lng: 103.7610, name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C1)',        city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/19W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L11C2', lat: 1.4617,  lng: 103.7613, name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C2)',        city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/20W.jpg'), source: 'MBJB' },
 
    // ── Jalan Tebrau to Kota Tinggi ────────────────────────────────────────
    { id: 'mbjb-L12C1', lat: 1.5120,  lng: 103.7650, name: 'MBJB – Jalan Tebrau / Lingkaran Dalam (L12C1)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/21W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L12C2', lat: 1.5123,  lng: 103.7653, name: 'MBJB – Jalan Tebrau / Lingkaran Dalam (L12C2)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/22W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L13C1', lat: 1.5280,  lng: 103.7720, name: 'MBJB – Jalan Tebrau / Jalan Bakar Batu (L13C1)',         city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/23W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L13C2', lat: 1.5283,  lng: 103.7723, name: 'MBJB – Jalan Tebrau / Jalan Bakar Batu (L13C2)',         city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/24W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L15C1', lat: 1.5450,  lng: 103.7810, name: 'MBJB – Jalan Tebrau / Jalan Bunga Ros (L15C1)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/27W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L15C2', lat: 1.5453,  lng: 103.7813, name: 'MBJB – Jalan Tebrau / Jalan Bunga Ros (L15C2)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/28W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L16C1', lat: 1.5580,  lng: 103.7900, name: 'MBJB – Jalan Tebrau / Susur EDL (L16C1)',                city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/29W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L16C2', lat: 1.5583,  lng: 103.7903, name: 'MBJB – Jalan Tebrau / Susur EDL (L16C2)',                city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/30W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L17C1', lat: 1.5650,  lng: 103.8020, name: 'MBJB – Jalan Pandan / Jalan Kangkar Tebrau (L17C1)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/31W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L17C2', lat: 1.5653,  lng: 103.8023, name: 'MBJB – Jalan Pandan / Jalan Kangkar Tebrau (L17C2)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/32W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L18C1', lat: 1.5700,  lng: 103.8080, name: 'MBJB – Jalan Pandan / The Store (L18C1)',                city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/33W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L19C1', lat: 1.5340,  lng: 103.7480, name: 'MBJB – Desa Jaya / IKEA (L19C1)',                        city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/35W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L19C2', lat: 1.5343,  lng: 103.7483, name: 'MBJB – Desa Jaya / IKEA (L19C2)',                        city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/36W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L25C1', lat: 1.5490,  lng: 103.7760, name: 'MBJB – Jalan Mutiara Emas Utama Roundabout (L25C1)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/47W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L25C2', lat: 1.5493,  lng: 103.7763, name: 'MBJB – Jalan Mutiara Emas Utama Roundabout (L25C2)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/48W.jpg'), source: 'MBJB' },
 
    // ── Jalan Ibrahim Sultan to Pasar Pelangi ──────────────────────────────
    { id: 'mbjb-L14C1', lat: 1.4780,  lng: 103.8010, name: 'MBJB – Permas Jaya (L14C1)',                             city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/25W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L14C2', lat: 1.4783,  lng: 103.8013, name: 'MBJB – Permas Jaya (L14C2)',                             city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/26W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L20C1', lat: 1.4540,  lng: 103.7660, name: 'MBJB – Jalan Ibrahim Sultan / Stulang Laut (L20C1)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/37W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L20C2', lat: 1.4543,  lng: 103.7663, name: 'MBJB – Jalan Ibrahim Sultan / Stulang Laut (L20C2)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/38W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L21C1', lat: 1.4572,  lng: 103.7630, name: 'MBJB – Jalan Ismail Sultan / Jalan Jim Quee (L21C1)',    city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/39W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L21C2', lat: 1.4575,  lng: 103.7633, name: 'MBJB – Jalan Ismail Sultan / Jalan Jim Quee (L21C2)',    city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/40W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L22C1', lat: 1.4590,  lng: 103.7595, name: 'MBJB – Jalan Jim Quee / CIQ (L22C1)',                    city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/41W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L22C2', lat: 1.4593,  lng: 103.7598, name: 'MBJB – Jalan Jim Quee / CIQ (L22C2)',                    city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/42W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L23C1', lat: 1.4561,  lng: 103.7645, name: 'MBJB – Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/43W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L23C2', lat: 1.4564,  lng: 103.7648, name: 'MBJB – Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/44W.jpg'), source: 'MBJB' },
 
  ];
  cams.push(...mbjbCameras);
 
  return cams.filter((c: any) => c.lat && c.lng);
}
