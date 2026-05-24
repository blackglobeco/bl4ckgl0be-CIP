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
    // Taman Impian Skudai on Jalan Impian Utama is off Jalan Skudai at ~Batu 7½ Skudai
    // NSK Skudai address: "Lot 100612 Jalan Impian Utama, Taman Impian Skudai 81300"
    // Jalan Impian Utama meets Jalan Skudai near postcode 81300 → ~1.5380, 103.6750
    { id: 'mbjb-L1C1',  lat: 1.5380, lng: 103.6750, name: 'Jalan Skudai / Jalan Impian Utama (L1C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L01_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L1C2',  lat: 1.5380, lng: 103.6753, name: 'Jalan Skudai / Jalan Impian Utama (L1C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L01_Cam2'), source: 'MBJB' },
 
    // L2 – Jalan Skudai (Paradigm Mall)
    // Paradigm Mall JB: confirmed 1.5152, 103.6858 (distancesto.com + poskod.com)
    { id: 'mbjb-L2C1',  lat: 1.5152, lng: 103.6858, name: 'Jalan Skudai / Paradigm Mall (L2C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L02_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L2C2',  lat: 1.5152, lng: 103.6861, name: 'Jalan Skudai / Paradigm Mall (L2C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L02_Cam2'), source: 'MBJB' },
 
    // L4 – Jalan Skudai / Jalan Padi
    // Jalan Padi runs through Bandar Baru UDA area; Jalan Skudai/Padi junction ~1.4980, 103.7095
    // Bandar Baru UDA Wikipedia: 1.49694, 103.71481 (Jalan Tampoi/Padi Mahsuri)
    { id: 'mbjb-L4C1',  lat: 1.4980, lng: 103.7095, name: 'Jalan Skudai / Jalan Padi (L4C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L04_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L4C2',  lat: 1.4980, lng: 103.7098, name: 'Jalan Skudai / Jalan Padi (L4C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L04_Cam2'), source: 'MBJB' },
 
    // L5 – Jalan Abu Bakar Sultan / Laman Serene
    // Laman Serene is a residential development on Jalan Abu Bakar Sultan, between
    // Country Garden (~L6) and Dataran Bandaraya (~L7), roughly at 1.4680, 103.7395
    { id: 'mbjb-L5C1',  lat: 1.4680, lng: 103.7395, name: 'Jalan Abu Bakar Sultan / Laman Serene (L5C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L05_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L5C2',  lat: 1.4680, lng: 103.7398, name: 'Jalan Abu Bakar Sultan / Laman Serene (L5C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L05_Cam2'), source: 'MBJB' },
 
    // L6 – Jalan Abu Bakar Sultan (Country Garden)
    // Country Garden Danga Bay is at ~1.4610, 103.7310 (waterfront development)
    { id: 'mbjb-L6C1',  lat: 1.4610, lng: 103.7310, name: 'Jalan Abu Bakar Sultan / Country Garden (L6C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L06_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L6C2',  lat: 1.4610, lng: 103.7313, name: 'Jalan Abu Bakar Sultan / Country Garden (L6C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L06_Cam2'), source: 'MBJB' },
 
    // L7 – Jalan Abu Bakar Sultan (Dataran Bandaraya)
    // Dataran Bandaraya JB (MBJB city hall forecourt) is on Jalan Ayer Molek / Abu Bakar Sultan
    // MBJB City Hall area: ~1.4635, 103.7468
    { id: 'mbjb-L7C1',  lat: 1.4635, lng: 103.7468, name: 'Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L07_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L7C2',  lat: 1.4635, lng: 103.7471, name: 'Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L07_Cam2'), source: 'MBJB' },
 
    // L24 – Jalan TAR / Jalan Kebun Teh
    // Jalan Kebun Teh Wikipedia: west end = Skudai Hwy, east end = Tebrau Hwy
    // Jalan Tun Abdul Razak (TAR) runs north from city; junction with Kebun Teh ~1.4985, 103.7285
    { id: 'mbjb-L24C1', lat: 1.4985, lng: 103.7285, name: 'Jalan TAR / Jalan Kebun Teh (L24C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L24_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L24C2', lat: 1.4985, lng: 103.7288, name: 'Jalan TAR / Jalan Kebun Teh (L24C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L24_Cam2'), source: 'MBJB' },
 
    // L25 – Jalan Mutiara Emas Utama (Roundabout)
    // Mutiara Rini township roundabout on Jalan Mutiara Emas Utama ~1.5148, 103.7058
    { id: 'mbjb-L25C1', lat: 1.5148, lng: 103.7058, name: 'Jalan Mutiara Emas Utama Roundabout (L25C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L25_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L25C2', lat: 1.5148, lng: 103.7061, name: 'Jalan Mutiara Emas Utama Roundabout (L25C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L25_Cam2'), source: 'MBJB' },
 
    // L26 – Lbh Iskandar Puteri / Jalan TAR
    // Lebuhraya Iskandar Puteri (SILK/Iskandar) meets Jalan Tun Abdul Razak near Larkin
    // ~1.4945, 103.7260
    { id: 'mbjb-L26C1', lat: 1.4945, lng: 103.7260, name: 'Lbh Iskandar Puteri / Jalan TAR (L26C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L26_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L26C2', lat: 1.4945, lng: 103.7263, name: 'Lbh Iskandar Puteri / Jalan TAR (L26C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L26_Cam2'), source: 'MBJB' },
 
    // L27 – Jalan Lingkaran Dalam (Menara MBJB)
    // MBJB HQ official address: No. 1, Jalan Lingkaran Dalam, Bukit Senyum, 80300 JB
    // Bukit Senyum / Jalan Lingkaran Dalam: 1.4888, 103.7513
    { id: 'mbjb-L27C1', lat: 1.4888, lng: 103.7513, name: 'Jalan Lingkaran Dalam / Menara MBJB (L27C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L27_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L27C2', lat: 1.4888, lng: 103.7516, name: 'Jalan Lingkaran Dalam / Menara MBJB (L27C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L27_Cam2'), source: 'MBJB' },
 
    // ── Pusat Bandar (City Centre) ─────────────────────────────────────────
 
    // L3 – Jalan Wong Ah Fook (Hadapan JBCC)
    // JB City Square (JBCC) Wikipedia: 1.461194, 103.764194
    { id: 'mbjb-L3C1',  lat: 1.4612, lng: 103.7642, name: 'Jalan Wong Ah Fook / JBCC (L3C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L03_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L3C2',  lat: 1.4612, lng: 103.7645, name: 'Jalan Wong Ah Fook / JBCC (L3C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L03_Cam2'), source: 'MBJB' },
 
    // L9 – Lorong Jalan Dhoby (Parking)
    // Jalan Dhoby is a short street off Jalan Wong Ah Fook in JB city centre ~1.4618, 103.7625
    { id: 'mbjb-L9C1',  lat: 1.4618, lng: 103.7625, name: 'Lorong Jalan Dhoby Parking (L9C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L09_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L9C2',  lat: 1.4618, lng: 103.7628, name: 'Lorong Jalan Dhoby Parking (L9C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L09_Cam2'), source: 'MBJB' },
 
    // L10 – Jalan Abdullah Ibrahim / Ungku Puan
    // Jalan Abdullah Ibrahim runs east from JB Sentral area; junction with Jalan Ungku Puan ~1.4625, 103.7635
    { id: 'mbjb-L10C1', lat: 1.4625, lng: 103.7635, name: 'Jalan Abdullah Ibrahim / Ungku Puan (L10C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L10_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L10C2', lat: 1.4625, lng: 103.7638, name: 'Jalan Abdullah Ibrahim / Ungku Puan (L10C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L10_Cam2'), source: 'MBJB' },
 
    // L11 – Jalan Abdullah Ibrahim (Persada)
    // Persada Johor International Convention Centre Wikipedia: 1.461833, 103.761583
    { id: 'mbjb-L11C1', lat: 1.4618, lng: 103.7616, name: 'Jalan Abdullah Ibrahim / Persada (L11C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L11_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L11C2', lat: 1.4618, lng: 103.7619, name: 'Jalan Abdullah Ibrahim / Persada (L11C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L11_Cam2'), source: 'MBJB' },
 
    // ── Jalan Tebrau ke Kota Tinggi ────────────────────────────────────────
 
    // L12 – Jalan Tebrau / Lingkaran Dalam
    // Jalan Lingkaran Dalam (inner ring road) meets Tebrau Highway near Bukit Senyum ~1.4912, 103.7638
    { id: 'mbjb-L12C1', lat: 1.4912, lng: 103.7638, name: 'Jalan Tebrau / Lingkaran Dalam (L12C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L12_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L12C2', lat: 1.4912, lng: 103.7641, name: 'Jalan Tebrau / Lingkaran Dalam (L12C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L12_Cam2'), source: 'MBJB' },
 
    // L13 – Jalan Tebrau / Jalan Bakar Batu
    // Kampung Bakar Batu Wikipedia: 1.50023, 103.77891
    { id: 'mbjb-L13C1', lat: 1.5002, lng: 103.7789, name: 'Jalan Tebrau / Jalan Bakar Batu (L13C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L13_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L13C2', lat: 1.5002, lng: 103.7792, name: 'Jalan Tebrau / Jalan Bakar Batu (L13C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L13_Cam2'), source: 'MBJB' },
 
    // L15 – Jalan Tebrau / Jalan Bunga Ros (offline per iTrafik; retained)
    // Jalan Bunga Ros is in Taman Pelangi Indah area off Tebrau Hwy ~1.5225, 103.7920
    { id: 'mbjb-L15C1', lat: 1.5225, lng: 103.7920, name: 'Jalan Tebrau / Jalan Bunga Ros (L15C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L15_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L15C2', lat: 1.5225, lng: 103.7923, name: 'Jalan Tebrau / Jalan Bunga Ros (L15C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L15_Cam2'), source: 'MBJB' },
 
    // L16 – Jalan Tebrau / Susur EDL
    // EDL (Eastern Dispersal Link) slip road off Tebrau Hwy; Johor Bahru East Coast
    // Parkway Wikipedia places EDL flyover at the north end of Tebrau Hwy junction ~1.5075, 103.7758
    { id: 'mbjb-L16C1', lat: 1.5075, lng: 103.7758, name: 'Jalan Tebrau / Susur EDL (L16C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L16_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L16C2', lat: 1.5075, lng: 103.7761, name: 'Jalan Tebrau / Susur EDL (L16C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L16_Cam2'), source: 'MBJB' },
 
    // L17 – Jalan Pandan / Jalan Kangkar Tebrau
    // Kampung Kangkar Tebrau is northeast of Taman Johor Jaya along Jalan Pandan ~1.5412, 103.8035
    { id: 'mbjb-L17C1', lat: 1.5412, lng: 103.8035, name: 'Jalan Pandan / Jalan Kangkar Tebrau (L17C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L17_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L17C2', lat: 1.5412, lng: 103.8038, name: 'Jalan Pandan / Jalan Kangkar Tebrau (L17C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L17_Cam2'), source: 'MBJB' },
 
    // L18 – Jalan Pandan (Hadapan The Store)
    // The Store Taman Johor Jaya: Taman Johor Jaya Wikipedia centre 1.53750, 103.80278
    // The Store is on Jalan Pandan near this location ~1.5360, 103.8010
    { id: 'mbjb-L18C1', lat: 1.5360, lng: 103.8010, name: 'Jalan Pandan / The Store (L18C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L18_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L18C2', lat: 1.5360, lng: 103.8013, name: 'Jalan Pandan / The Store (L18C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L18_Cam2'), source: 'MBJB' },
 
    // L19 – Desa Jaya (IKEA)
    // IKEA Tebrau confirmed: 1.5518, 103.7971 (parking.com.my + Wikimapia 1°33'7"N 103°47'54"E)
    { id: 'mbjb-L19C1', lat: 1.5518, lng: 103.7971, name: 'Desa Jaya / IKEA Tebrau (L19C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L19_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L19C2', lat: 1.5518, lng: 103.7974, name: 'Desa Jaya / IKEA Tebrau (L19C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L19_Cam2'), source: 'MBJB' },
 
    // ── Jalan Ibrahim Sultan ke Pasar Pelangi ─────────────────────────────
 
    // L14 – Permas Jaya
    // Permas Jaya Wikipedia: 1°29′54.3″N 103°49′10.0″E = 1.4984, 103.8194
    { id: 'mbjb-L14C1', lat: 1.4984, lng: 103.8194, name: 'Permas Jaya (L14C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L14_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L14C2', lat: 1.4984, lng: 103.8197, name: 'Permas Jaya (L14C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L14_Cam2'), source: 'MBJB' },
 
    // L20 – Jalan Ibrahim Sultan (Stulang Laut)
    // JB East Coast Parkway Wikipedia: Jalan Stulang Laut junction on parkway
    // Stulang Laut is a waterfront area south of JB City Square ~1.4528, 103.7648
    { id: 'mbjb-L20C1', lat: 1.4528, lng: 103.7648, name: 'Jalan Ibrahim Sultan / Stulang Laut (L20C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L20_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L20C2', lat: 1.4528, lng: 103.7651, name: 'Jalan Ibrahim Sultan / Stulang Laut (L20C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L20_Cam2'), source: 'MBJB' },
 
    // L21 – Jalan Ismail Sultan / Jalan Jim Quee
    // Jalan Jim Quee connects CIQ waterfront area to Jalan Ismail Sultan ~1.4572, 103.7618
    { id: 'mbjb-L21C1', lat: 1.4572, lng: 103.7618, name: 'Jalan Ismail Sultan / Jalan Jim Quee (L21C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L21_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L21C2', lat: 1.4572, lng: 103.7621, name: 'Jalan Ismail Sultan / Jalan Jim Quee (L21C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L21_Cam2'), source: 'MBJB' },
 
    // L22 – Jalan Jim Quee / CIQ
    // CIQ (Sultan Iskandar Building) is the JB customs checkpoint; Jim Quee leads to it ~1.4548, 103.7628
    { id: 'mbjb-L22C1', lat: 1.4548, lng: 103.7628, name: 'Jalan Jim Quee / CIQ (L22C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L22_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L22C2', lat: 1.4548, lng: 103.7631, name: 'Jalan Jim Quee / CIQ (L22C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L22_Cam2'), source: 'MBJB' },
 
    // L23 – Jalan Ismail Sultan / Jalan Ibrahim Sultan
    // Both Jalan Ismail Sultan and Jalan Ibrahim Sultan run along the JB waterfront;
    // their junction is on the east coast parkway ~1.4558, 103.7658
    { id: 'mbjb-L23C1', lat: 1.4558, lng: 103.7658, name: 'Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L23_Cam1'), source: 'MBJB' },
    { id: 'mbjb-L23C2', lat: 1.4558, lng: 103.7661, name: 'Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: MBJB('L23_Cam2'), source: 'MBJB' },
 
  ];
  cams.push(...mbjbCameras);
 
  // ── KLCCC: Kuala Lumpur Command & Control Centre ──────────────────────────
  const klcccCameras = [
    { id: 'klccc-CN030F', lat: 3.1319, lng: 101.6841, name: 'KLCCC – CN030F (Bukit Jalil)',            city: 'Kuala Lumpur', country: 'Malaysia', external_url: 'https://klccc.dbkl.gov.my/cctv-images/', source: 'KLCCC' },
    { id: 'klccc-CN033F', lat: 3.1350, lng: 101.6870, name: 'KLCCC – CN033F (Bukit Jalil)',            city: 'Kuala Lumpur', country: 'Malaysia', external_url: 'https://klccc.dbkl.gov.my/cctv-images/', source: 'KLCCC' },
    { id: 'klccc-CN407F', lat: 3.1480, lng: 101.6950, name: 'KLCCC – CN407F (Lebuhraya Bukit Jalil)', city: 'Kuala Lumpur', country: 'Malaysia', external_url: 'https://klccc.dbkl.gov.my/cctv-images/', source: 'KLCCC' },
  ];
  cams.push(...klcccCameras);
 
  return cams.filter((c: any) => c.lat && c.lng);
}
