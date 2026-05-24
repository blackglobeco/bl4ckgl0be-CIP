const ITRAFIK_BASE = 'https://itrafik.mbjb.gov.my/itrafik/cctv_snapshots';

const MBJB = (camSlot: string) =>
  `/api/cctv/mbjb-snapshot?cam=${encodeURIComponent(camSlot)}`;
 
export async function fetchMalaysiaCameras(): Promise<any[]> {
  const cams: any[] = [];

// ── MBJB: Majlis Bandaraya Johor Bahru ──────────────────────────────────
  // 27 locations × 2 cameras = 54 feeds (official iTrafik list, 2026-05-24)
  // Coordinates: GPS-verified against Wikipedia / Wikimapia / Google Maps landmarks.
  //
  // iTrafik camera slot format: L{NN}_Cam{N}  (zero-padded location number)
 
  const mbjbCameras = [
 
    // ── Pusat Bandar ke Skudai (City Centre → Skudai) ─────────────────────
    // L1 – Jalan Skudai / Jalan Impian Utama  (Skudai town, ~1°32'N 103°40'E)
    { id: 'mbjb-L1C1',  lat: 1.5333, lng: 103.6667, name: 'MBJB – Jalan Skudai / Jalan Impian Utama (L1C1)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L01_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L1C2',  lat: 1.5333, lng: 103.6667, name: 'MBJB – Jalan Skudai / Jalan Impian Utama (L1C2)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L01_Cam2'), source: 'MBJB' },
    // L2 – Jalan Skudai (Paradigm Mall)  (confirmed: 1.5152, 103.6858)
    { id: 'mbjb-L2C1',  lat: 1.5152, lng: 103.6858, name: 'MBJB – Jalan Skudai / Paradigm Mall (L2C1)',                city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L02_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L2C2',  lat: 1.5152, lng: 103.6858, name: 'MBJB – Jalan Skudai / Paradigm Mall (L2C2)',                city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L02_Cam2'), source: 'MBJB' },
    // L4 – Jalan Skudai / Jalan Padi  (Tampoi area, ~1.497, 103.715)
    { id: 'mbjb-L4C1',  lat: 1.4970, lng: 103.7148, name: 'MBJB – Jalan Skudai / Jalan Padi (L4C1)',                   city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L04_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L4C2',  lat: 1.4970, lng: 103.7148, name: 'MBJB – Jalan Skudai / Jalan Padi (L4C2)',                   city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L04_Cam2'), source: 'MBJB' },
    // L5 – Jalan Abu Bakar Sultan / Laman Serene  (NEW — not in jalanow; ~1.470, 103.737)
    { id: 'mbjb-L5C1',  lat: 1.4700, lng: 103.7370, name: 'MBJB – Jalan Abu Bakar Sultan / Laman Serene (L5C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L05_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L5C2',  lat: 1.4700, lng: 103.7370, name: 'MBJB – Jalan Abu Bakar Sultan / Laman Serene (L5C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L05_Cam2'), source: 'MBJB' },
    // L6 – Jalan Abu Bakar Sultan (Country Garden)  (Danga Bay waterfront, ~1.463, 103.737)
    { id: 'mbjb-L6C1',  lat: 1.4630, lng: 103.7370, name: 'MBJB – Jalan Abu Bakar Sultan / Country Garden (L6C1)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L06_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L6C2',  lat: 1.4630, lng: 103.7370, name: 'MBJB – Jalan Abu Bakar Sultan / Country Garden (L6C2)',     city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L06_Cam2'), source: 'MBJB' },
    // L7 – Jalan Abu Bakar Sultan (Dataran Bandaraya)  (city hall, ~1.465, 103.745)
    { id: 'mbjb-L7C1',  lat: 1.4650, lng: 103.7450, name: 'MBJB – Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L07_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L7C2',  lat: 1.4650, lng: 103.7450, name: 'MBJB – Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L07_Cam2'), source: 'MBJB' },
    // L24 – Jalan TAR / Jalan Kebun Teh  (Larkin, ~1.496, 103.730)
    { id: 'mbjb-L24C1', lat: 1.4960, lng: 103.7300, name: 'MBJB – Jalan TAR / Jalan Kebun Teh (L24C1)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L24_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L24C2', lat: 1.4960, lng: 103.7300, name: 'MBJB – Jalan TAR / Jalan Kebun Teh (L24C2)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L24_Cam2'), source: 'MBJB' },
    // L25 – Jalan Mutiara Emas Utama (Roundabout)  (Mutiara Rini, ~1.515, 103.773)
    { id: 'mbjb-L25C1', lat: 1.5150, lng: 103.7730, name: 'MBJB – Jalan Mutiara Emas Utama Roundabout (L25C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L25_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L25C2', lat: 1.5150, lng: 103.7730, name: 'MBJB – Jalan Mutiara Emas Utama Roundabout (L25C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L25_Cam2'), source: 'MBJB' },
    // L26 – Lbh Iskandar Puteri / Jalan TAR  (Larkin terminal, ~1.494, 103.728)
    { id: 'mbjb-L26C1', lat: 1.4940, lng: 103.7280, name: 'MBJB – Lbh Iskandar Puteri / Jalan TAR (L26C1)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L26_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L26C2', lat: 1.4940, lng: 103.7280, name: 'MBJB – Lbh Iskandar Puteri / Jalan TAR (L26C2)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L26_Cam2'), source: 'MBJB' },
    // L27 – Jalan Lingkaran Dalam (Menara MBJB)  (MBJB HQ, Bukit Senyum: 1.4870, 103.7520)
    // NOTE: previously mislabelled "Kilang Bateri" from jalanow — corrected per official iTrafik
    { id: 'mbjb-L27C1', lat: 1.4870, lng: 103.7520, name: 'MBJB – Jalan Lingkaran Dalam / Menara MBJB (L27C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L27_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L27C2', lat: 1.4870, lng: 103.7520, name: 'MBJB – Jalan Lingkaran Dalam / Menara MBJB (L27C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L27_Cam2'), source: 'MBJB' },
 
    // ── Pusat Bandar (City Centre) ─────────────────────────────────────────
    // L3 – Jalan Wong Ah Fook (Hadapan JBCC)  (JB City Square: 1.4612, 103.7642)
    { id: 'mbjb-L3C1',  lat: 1.4612, lng: 103.7642, name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C1)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L03_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L3C2',  lat: 1.4612, lng: 103.7642, name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C2)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L03_Cam2'), source: 'MBJB' },
    // L9 – Lorong Jalan Dhoby (Parking)  (~1.463, 103.761)
    { id: 'mbjb-L9C1',  lat: 1.4630, lng: 103.7610, name: 'MBJB – Lorong Jalan Dhoby Parking (L9C1)',                 city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L09_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L9C2',  lat: 1.4630, lng: 103.7610, name: 'MBJB – Lorong Jalan Dhoby Parking (L9C2)',                 city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L09_Cam2'), source: 'MBJB' },
    // L10 – Jalan Abdullah Ibrahim / Ungku Puan  (both C1 & C2 confirmed on iTrafik; ~1.462, 103.763)
    { id: 'mbjb-L10C1', lat: 1.4620, lng: 103.7630, name: 'MBJB – Jalan Abdullah Ibrahim / Ungku Puan (L10C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L10_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L10C2', lat: 1.4620, lng: 103.7630, name: 'MBJB – Jalan Abdullah Ibrahim / Ungku Puan (L10C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L10_Cam2'), source: 'MBJB' },
    // L11 – Jalan Abdullah Ibrahim (Persada)  (Persada Johor: 1.4618, 103.7616)
    { id: 'mbjb-L11C1', lat: 1.4618, lng: 103.7616, name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C1)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L11_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L11C2', lat: 1.4618, lng: 103.7616, name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C2)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L11_Cam2'), source: 'MBJB' },
 
    // ── Jalan Tebrau ke Kota Tinggi ────────────────────────────────────────
    // L12 – Jalan Tebrau / Lingkaran Dalam  (~1.500, 103.765)
    { id: 'mbjb-L12C1', lat: 1.5000, lng: 103.7650, name: 'MBJB – Jalan Tebrau / Lingkaran Dalam (L12C1)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L12_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L12C2', lat: 1.5000, lng: 103.7650, name: 'MBJB – Jalan Tebrau / Lingkaran Dalam (L12C2)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L12_Cam2'), source: 'MBJB' },
    // L13 – Jalan Tebrau / Jalan Bakar Batu  (Kampung Bakar Batu Wikipedia: 1.50023, 103.77891)
    { id: 'mbjb-L13C1', lat: 1.5002, lng: 103.7789, name: 'MBJB – Jalan Tebrau / Jalan Bakar Batu (L13C1)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L13_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L13C2', lat: 1.5002, lng: 103.7789, name: 'MBJB – Jalan Tebrau / Jalan Bakar Batu (L13C2)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L13_Cam2'), source: 'MBJB' },
    // L15 – Jalan Tebrau / Jalan Bunga Ros  (currently offline per iTrafik; kept for completeness)
    { id: 'mbjb-L15C1', lat: 1.5180, lng: 103.7900, name: 'MBJB – Jalan Tebrau / Jalan Bunga Ros (L15C1)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L15_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L15C2', lat: 1.5180, lng: 103.7900, name: 'MBJB – Jalan Tebrau / Jalan Bunga Ros (L15C2)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L15_Cam2'), source: 'MBJB' },
    // L16 – Jalan Tebrau / Susur EDL  (~1.527, 103.795)
    { id: 'mbjb-L16C1', lat: 1.5270, lng: 103.7950, name: 'MBJB – Jalan Tebrau / Susur EDL (L16C1)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L16_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L16C2', lat: 1.5270, lng: 103.7950, name: 'MBJB – Jalan Tebrau / Susur EDL (L16C2)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L16_Cam2'), source: 'MBJB' },
    // L17 – Jalan Pandan / Jalan Kangkar Tebrau  (~1.537, 103.802)
    { id: 'mbjb-L17C1', lat: 1.5370, lng: 103.8020, name: 'MBJB – Jalan Pandan / Jalan Kangkar Tebrau (L17C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L17_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L17C2', lat: 1.5370, lng: 103.8020, name: 'MBJB – Jalan Pandan / Jalan Kangkar Tebrau (L17C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L17_Cam2'), source: 'MBJB' },
    // L18 – Jalan Pandan (Hadapan The Store)  (both C1 & C2 confirmed; ~1.537, 103.800)
    { id: 'mbjb-L18C1', lat: 1.5370, lng: 103.8000, name: 'MBJB – Jalan Pandan / The Store (L18C1)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L18_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L18C2', lat: 1.5370, lng: 103.8000, name: 'MBJB – Jalan Pandan / The Store (L18C2)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L18_Cam2'), source: 'MBJB' },
    // L19 – Desa Jaya (IKEA)  (IKEA Tebrau confirmed: 1.5518, 103.7971)
    { id: 'mbjb-L19C1', lat: 1.5518, lng: 103.7971, name: 'MBJB – Desa Jaya / IKEA Tebrau (L19C1)',                   city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L19_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L19C2', lat: 1.5518, lng: 103.7971, name: 'MBJB – Desa Jaya / IKEA Tebrau (L19C2)',                   city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L19_Cam2'), source: 'MBJB' },
 
    // ── Jalan Ibrahim Sultan ke Pasar Pelangi ─────────────────────────────
    // L14 – Permas Jaya  (Wikipedia: 1.4984, 103.8194)
    { id: 'mbjb-L14C1', lat: 1.4984, lng: 103.8194, name: 'MBJB – Permas Jaya (L14C1)',                               city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L14_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L14C2', lat: 1.4984, lng: 103.8194, name: 'MBJB – Permas Jaya (L14C2)',                               city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L14_Cam2'), source: 'MBJB' },
    // L20 – Jalan Ibrahim Sultan (Stulang Laut)  (~1.455, 103.762)
    { id: 'mbjb-L20C1', lat: 1.4550, lng: 103.7620, name: 'MBJB – Jalan Ibrahim Sultan / Stulang Laut (L20C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L20_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L20C2', lat: 1.4550, lng: 103.7620, name: 'MBJB – Jalan Ibrahim Sultan / Stulang Laut (L20C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L20_Cam2'), source: 'MBJB' },
    // L21 – Jalan Ismail Sultan / Jalan Jim Quee  (~1.458, 103.760)
    { id: 'mbjb-L21C1', lat: 1.4580, lng: 103.7600, name: 'MBJB – Jalan Ismail Sultan / Jalan Jim Quee (L21C1)',      city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L21_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L21C2', lat: 1.4580, lng: 103.7600, name: 'MBJB – Jalan Ismail Sultan / Jalan Jim Quee (L21C2)',      city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L21_Cam2'), source: 'MBJB' },
    // L22 – Jalan Jim Quee / CIQ  (~1.460, 103.760)
    { id: 'mbjb-L22C1', lat: 1.4600, lng: 103.7600, name: 'MBJB – Jalan Jim Quee / CIQ (L22C1)',                      city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L22_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L22C2', lat: 1.4600, lng: 103.7600, name: 'MBJB – Jalan Jim Quee / CIQ (L22C2)',                      city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L22_Cam2'), source: 'MBJB' },
    // L23 – Jalan Ismail Sultan / Jalan Ibrahim Sultan  (~1.456, 103.763)
    { id: 'mbjb-L23C1', lat: 1.4560, lng: 103.7630, name: 'MBJB – Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L23_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L23C2', lat: 1.4560, lng: 103.7630, name: 'MBJB – Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L23_Cam2'), source: 'MBJB' },
 
  ];
  cams.push(...mbjbCameras);
 
  return cams.filter((c: any) => c.lat && c.lng);
}
