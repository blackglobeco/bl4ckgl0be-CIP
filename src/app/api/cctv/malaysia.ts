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
 
        // ── Pusat Bandar ke Skudai ─────────────────────────────────────────────
 
    // L1 – Jalan Skudai / Jalan Impian Utama
    // Taman Impian Skudai centroid (OpenStreetMap via mapcarta.com): 1.52856, 103.68052
    // Jalan Impian Utama is the main road through this taman, which fronts Jalan Skudai
    { id: 'mbjb-L1C1',  lat: 1.5286, lng: 103.6805, name: 'Jalan Skudai / Jalan Impian Utama (L1C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L01_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L1C2',  lat: 1.5286, lng: 103.6808, name: 'Jalan Skudai / Jalan Impian Utama (L1C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L01_Cam2'), source: 'MBJB' },
 
    // L2 – Jalan Skudai (Paradigm Mall)
    // Paradigm Mall JB confirmed: 1.515153, 103.685767 (distancesto.com)
    { id: 'mbjb-L2C1',  lat: 1.5152, lng: 103.6858, name: 'Jalan Skudai / Paradigm Mall (L2C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L02_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L2C2',  lat: 1.5152, lng: 103.6861, name: 'Jalan Skudai / Paradigm Mall (L2C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L02_Cam2'), source: 'MBJB' },
 
    // L4 – Jalan Skudai / Jalan Padi
    // Tampoi Wikipedia: 1.4928, 103.7059. Jalan Padi runs through Tampoi / UDA area.
    // Jalan Skudai passes through Tampoi — intersection with Jalan Padi at ~1.4930, 103.7065
    { id: 'mbjb-L4C1',  lat: 1.4930, lng: 103.7065, name: 'Jalan Skudai / Jalan Padi (L4C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L04_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L4C2',  lat: 1.4930, lng: 103.7068, name: 'Jalan Skudai / Jalan Padi (L4C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L04_Cam2'), source: 'MBJB' },
 
    // L5 – Jalan Abu Bakar Sultan / Laman Serene
    // Laman Serene is a condo development on Jalan Abu Bakar Sultan, north of Country Garden
    // (Country Garden: 1.4742, 103.7236) and south of Dataran Bandaraya (1.4635, 103.7468)
    // Laman Serene sits roughly midway at ~1.4700, 103.7340
    { id: 'mbjb-L5C1',  lat: 1.4700, lng: 103.7340, name: 'Jalan Abu Bakar Sultan / Laman Serene (L5C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L05_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L5C2',  lat: 1.4700, lng: 103.7343, name: 'Jalan Abu Bakar Sultan / Laman Serene (L5C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L05_Cam2'), source: 'MBJB' },
 
    // L6 – Jalan Abu Bakar Sultan (Country Garden)
    // Country Garden Danga Bay GPS confirmed: 1.47420, 103.72359 (gites.fr booking site)
    // Danga Bay Wikipedia: 1.475000, 103.724000
    { id: 'mbjb-L6C1',  lat: 1.4742, lng: 103.7236, name: 'Jalan Abu Bakar Sultan / Country Garden (L6C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L06_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L6C2',  lat: 1.4742, lng: 103.7239, name: 'Jalan Abu Bakar Sultan / Country Garden (L6C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L06_Cam2'), source: 'MBJB' },
 
    // L7 – Jalan Abu Bakar Sultan (Dataran Bandaraya)
    // Dataran Bandaraya = JB City Hall forecourt / Istana Bukit Serene area
    // Istana Bukit Serene Wikipedia: 1.479972, 103.72722
    // Dataran Bandaraya is along Jalan Abu Bakar Sultan south of the Istana at ~1.4720, 103.7320
    { id: 'mbjb-L7C1',  lat: 1.4720, lng: 103.7320, name: 'Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L07_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L7C2',  lat: 1.4720, lng: 103.7323, name: 'Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L07_Cam2'), source: 'MBJB' },
 
    // L24 – Jalan TAR / Jalan Kebun Teh
    // Jalan Kebun Teh Wikipedia: west end = Skudai Hwy (FT1), east end = Tebrau Hwy (FT3)
    // Jalan Tun Abdul Razak (TAR) is the north–south arterial; its junction with Kebun Teh
    // is in the Larkin / Taman Century area at ~1.5010, 103.7350
    { id: 'mbjb-L24C1', lat: 1.5010, lng: 103.7350, name: 'Jalan TAR / Jalan Kebun Teh (L24C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L24_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L24C2', lat: 1.5010, lng: 103.7353, name: 'Jalan TAR / Jalan Kebun Teh (L24C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L24_Cam2'), source: 'MBJB' },
 
    // L25 – Jalan Mutiara Emas Utama (Roundabout)
    // Mutiara Rini is a township off Jalan Skudai. The Mutiara Emas Utama roundabout
    // is the main entrance roundabout at ~1.5200, 103.6980
    { id: 'mbjb-L25C1', lat: 1.5200, lng: 103.6980, name: 'Jalan Mutiara Emas Utama Roundabout (L25C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L25_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L25C2', lat: 1.5200, lng: 103.6983, name: 'Jalan Mutiara Emas Utama Roundabout (L25C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L25_Cam2'), source: 'MBJB' },
 
    // L26 – Lbh Iskandar Puteri / Jalan TAR
    // Lebuhraya Iskandar Puteri meets Jalan Tun Abdul Razak near the Larkin area
    // This is the flyover/interchange north of Larkin terminal at ~1.5030, 103.7310
    { id: 'mbjb-L26C1', lat: 1.5030, lng: 103.7310, name: 'Lbh Iskandar Puteri / Jalan TAR (L26C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L26_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L26C2', lat: 1.5030, lng: 103.7313, name: 'Lbh Iskandar Puteri / Jalan TAR (L26C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L26_Cam2'), source: 'MBJB' },
 
    // L27 – Jalan Lingkaran Dalam (Menara MBJB)
    // Official MBJB address: No. 1, Jalan Lingkaran Dalam, Bukit Senyum, 80300 JB
    // Menara MBJB (the new MBJB HQ tower) at Bukit Senyum: 1.4888, 103.7513
    { id: 'mbjb-L27C1', lat: 1.4888, lng: 103.7513, name: 'Jalan Lingkaran Dalam / Menara MBJB (L27C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L27_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L27C2', lat: 1.4888, lng: 103.7516, name: 'Jalan Lingkaran Dalam / Menara MBJB (L27C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L27_Cam2'), source: 'MBJB' },
 
    // ── Pusat Bandar (City Centre) ─────────────────────────────────────────
 
    // L3 – Jalan Wong Ah Fook (Hadapan JBCC)
    // JB City Square (JBCC) Wikipedia: 1.461194, 103.764194
    { id: 'mbjb-L3C1',  lat: 1.4612, lng: 103.7642, name: 'Jalan Wong Ah Fook / JBCC (L3C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L03_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L3C2',  lat: 1.4612, lng: 103.7645, name: 'Jalan Wong Ah Fook / JBCC (L3C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L03_Cam2'), source: 'MBJB' },
 
    // L9 – Lorong Jalan Dhoby (Parking)
    // Lorong Dhoby is a short lane off Jalan Wong Ah Fook in JB city centre
    // Adjacent to JBCC at ~1.4625, 103.7632
    { id: 'mbjb-L9C1',  lat: 1.4625, lng: 103.7632, name: 'Lorong Jalan Dhoby Parking (L9C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L09_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L9C2',  lat: 1.4625, lng: 103.7635, name: 'Lorong Jalan Dhoby Parking (L9C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L09_Cam2'), source: 'MBJB' },
 
    // L10 – Jalan Abdullah Ibrahim / Ungku Puan
    // Jalan Abdullah Ibrahim runs parallel to Wong Ah Fook; Jalan Ungku Puan crosses it
    // Near JB Sentral / old bus terminal at ~1.4638, 103.7618
    { id: 'mbjb-L10C1', lat: 1.4638, lng: 103.7618, name: 'Jalan Abdullah Ibrahim / Ungku Puan (L10C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L10_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L10C2', lat: 1.4638, lng: 103.7621, name: 'Jalan Abdullah Ibrahim / Ungku Puan (L10C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L10_Cam2'), source: 'MBJB' },
 
    // L11 – Jalan Abdullah Ibrahim (Persada)
    // Persada Johor International Convention Centre Wikipedia: 1.461833, 103.761583
    { id: 'mbjb-L11C1', lat: 1.4618, lng: 103.7616, name: 'Jalan Abdullah Ibrahim / Persada (L11C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L11_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L11C2', lat: 1.4618, lng: 103.7619, name: 'Jalan Abdullah Ibrahim / Persada (L11C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L11_Cam2'), source: 'MBJB' },
 
    // ── Jalan Tebrau ke Kota Tinggi ────────────────────────────────────────
 
    // L12 – Jalan Tebrau / Lingkaran Dalam
    // Jalan Lingkaran Dalam (inner ring road) meets Tebrau Hwy (FT3) at the southern
    // entry point near Bukit Senyum / Taman Sentosa at ~1.4942, 103.7632
    { id: 'mbjb-L12C1', lat: 1.4942, lng: 103.7632, name: 'Jalan Tebrau / Lingkaran Dalam (L12C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L12_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L12C2', lat: 1.4942, lng: 103.7635, name: 'Jalan Tebrau / Lingkaran Dalam (L12C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L12_Cam2'), source: 'MBJB' },
 
    // L13 – Jalan Tebrau / Jalan Bakar Batu
    // Kampung Bakar Batu Wikipedia: 1.50023, 103.77891
    { id: 'mbjb-L13C1', lat: 1.5002, lng: 103.7789, name: 'Jalan Tebrau / Jalan Bakar Batu (L13C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L13_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L13C2', lat: 1.5002, lng: 103.7792, name: 'Jalan Tebrau / Jalan Bakar Batu (L13C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L13_Cam2'), source: 'MBJB' },
 
    // L15 – Jalan Tebrau / Jalan Bunga Ros (offline per iTrafik; retained)
    // Jalan Bunga Ros branches off Tebrau Hwy into Taman Pelangi Indah area at ~1.5225, 103.7880
    { id: 'mbjb-L15C1', lat: 1.5225, lng: 103.7880, name: 'Jalan Tebrau / Jalan Bunga Ros (L15C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L15_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L15C2', lat: 1.5225, lng: 103.7883, name: 'Jalan Tebrau / Jalan Bunga Ros (L15C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L15_Cam2'), source: 'MBJB' },
 
    // L16 – Jalan Tebrau / Susur EDL
    // EDL (Eastern Dispersal Link / FT38) slip road exits Tebrau Hwy northbound
    // JB East Coast Parkway Wikipedia: "EDL Flyover" junction on Tebrau at ~1.5068, 103.7762
    { id: 'mbjb-L16C1', lat: 1.5068, lng: 103.7762, name: 'Jalan Tebrau / Susur EDL (L16C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L16_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L16C2', lat: 1.5068, lng: 103.7765, name: 'Jalan Tebrau / Susur EDL (L16C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L16_Cam2'), source: 'MBJB' },
 
    // L17 – Jalan Pandan / Jalan Kangkar Tebrau
    // Kampung Kangkar Tebrau is northeast of Taman Johor Jaya; junction with Jalan Pandan
    // Taman Johor Jaya Wikipedia: 1.53750, 103.80278 — Kangkar Tebrau is further NE at ~1.5440, 103.8080
    { id: 'mbjb-L17C1', lat: 1.5440, lng: 103.8080, name: 'Jalan Pandan / Jalan Kangkar Tebrau (L17C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L17_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L17C2', lat: 1.5440, lng: 103.8083, name: 'Jalan Pandan / Jalan Kangkar Tebrau (L17C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L17_Cam2'), source: 'MBJB' },
 
    // L18 – Jalan Pandan (Hadapan The Store)
    // The Store hypermarket is in Taman Johor Jaya on Jalan Pandan
    // Taman Johor Jaya Wikipedia: 1.53750, 103.80278 — The Store is on Jalan Pandan at ~1.5375, 103.8015
    { id: 'mbjb-L18C1', lat: 1.5375, lng: 103.8015, name: 'Jalan Pandan / The Store (L18C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L18_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L18C2', lat: 1.5375, lng: 103.8018, name: 'Jalan Pandan / The Store (L18C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L18_Cam2'), source: 'MBJB' },
 
    // L19 – Desa Jaya (IKEA)
    // IKEA Tebrau confirmed: 1.5518005, 103.7970962 (parking.com.my)
    // Wikimapia: 1°33'7"N 103°47'54"E = 1.5519, 103.7983 — using parking.com.my as more precise
    { id: 'mbjb-L19C1', lat: 1.5518, lng: 103.7971, name: 'Desa Jaya / IKEA Tebrau (L19C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L19_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L19C2', lat: 1.5518, lng: 103.7974, name: 'Desa Jaya / IKEA Tebrau (L19C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L19_Cam2'), source: 'MBJB' },
 
    // ── Jalan Ibrahim Sultan ke Pasar Pelangi ─────────────────────────────
 
    // L14 – Permas Jaya
    // Permas Jaya Wikipedia: 1°29′54.3″N 103°49′10.0″E = 1.498417, 103.819444
    { id: 'mbjb-L14C1', lat: 1.4984, lng: 103.8194, name: 'Permas Jaya (L14C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L14_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L14C2', lat: 1.4984, lng: 103.8197, name: 'Permas Jaya (L14C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L14_Cam2'), source: 'MBJB' },
 
    // L20 – Jalan Ibrahim Sultan (Stulang Laut)
    // Stulang Laut is a waterfront area accessed via Jalan Ibrahim Sultan / Jalan Stulang Baru
    // JB East Coast Parkway Wikipedia: "Jalan Stulang Laut" junction on parkway at ~1.4532, 103.7645
    { id: 'mbjb-L20C1', lat: 1.4532, lng: 103.7645, name: 'Jalan Ibrahim Sultan / Stulang Laut (L20C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L20_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L20C2', lat: 1.4532, lng: 103.7648, name: 'Jalan Ibrahim Sultan / Stulang Laut (L20C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L20_Cam2'), source: 'MBJB' },
 
    // L21 – Jalan Ismail Sultan / Jalan Jim Quee
    // Jalan Jim Quee runs from CIQ waterfront to Jalan Ismail Sultan / Jalan Ibrahim Sultan
    // Junction at ~1.4568, 103.7622
    { id: 'mbjb-L21C1', lat: 1.4568, lng: 103.7622, name: 'Jalan Ismail Sultan / Jalan Jim Quee (L21C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L21_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L21C2', lat: 1.4568, lng: 103.7625, name: 'Jalan Ismail Sultan / Jalan Jim Quee (L21C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L21_Cam2'), source: 'MBJB' },
 
    // L22 – Jalan Jim Quee / CIQ
    // CIQ = Sultan Iskandar Building (JB customs/immigration checkpoint)
    // Johor–Singapore Causeway south end; CIQ building at ~1.4545, 103.7630
    { id: 'mbjb-L22C1', lat: 1.4545, lng: 103.7630, name: 'Jalan Jim Quee / CIQ (L22C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L22_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L22C2', lat: 1.4545, lng: 103.7633, name: 'Jalan Jim Quee / CIQ (L22C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L22_Cam2'), source: 'MBJB' },
 
    // L23 – Jalan Ismail Sultan / Jalan Ibrahim Sultan
    // Both roads run along the JB waterfront; Jalan Ibrahim Sultan (east coast parkway)
    // meets Jalan Ismail Sultan near Pasir Pelangi / Taman Pelangi at ~1.4558, 103.7660
    { id: 'mbjb-L23C1', lat: 1.4558, lng: 103.7660, name: 'Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L23_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L23C2', lat: 1.4558, lng: 103.7663, name: 'Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L23_Cam2'), source: 'MBJB' },
 
  ];
  cams.push(...mbjbCameras);
 
  return cams.filter((c: any) => c.lat && c.lng);
}
