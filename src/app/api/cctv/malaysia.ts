const PROXY = (url: string) =>
  `/api/cctv/proxy?url=${encodeURIComponent(url)}`;
 
export async function fetchMalaysiaCameras(): Promise<any[]> {
  const cams: any[] = [];

// ── MBJB: Majlis Bandaraya Johor Bahru ───────────────────────────────────
  // All images at c10.fgies.com require Referer: jalanow.com — proxied via /api/cctv/proxy
  // Coordinates verified against Wikipedia, Wikimapia, and distancesto.com references.
  const mbjbCameras = [
 
    // ── City Center to Skudai ──────────────────────────────────────────────
    // Jalan Skudai / Jalan Impian Utama — Skudai town centre area (1°32'N 103°40'E per Wikipedia Skudai)
    { id: 'mbjb-L1C1',  lat: 1.5333,  lng: 103.6667, name: 'MBJB – Jalan Skudai / Jalan Impian Utama (L1C1)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/01W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L1C2',  lat: 1.5333,  lng: 103.6667, name: 'MBJB – Jalan Skudai / Jalan Impian Utama (L1C2)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/02W.jpg'), source: 'MBJB' },
    // Paradigm Mall JB — confirmed 1.5152, 103.6858 (distancesto.com + poskod.com)
    { id: 'mbjb-L2C1',  lat: 1.5152,  lng: 103.6858, name: 'MBJB – Jalan Skudai / Paradigm Mall (L2C1)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/03W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L2C2',  lat: 1.5152,  lng: 103.6858, name: 'MBJB – Jalan Skudai / Paradigm Mall (L2C2)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/04W.jpg'), source: 'MBJB' },
    // Jalan Skudai / Jalan Padi — Tampoi/Jalan Padi area (~1.497, 103.715 per Bandar Baru UDA ref)
    { id: 'mbjb-L4C1',  lat: 1.4970,  lng: 103.7148, name: 'MBJB – Jalan Skudai / Jalan Padi (L4C1)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/07W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L4C2',  lat: 1.4970,  lng: 103.7148, name: 'MBJB – Jalan Skudai / Jalan Padi (L4C2)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/08W.jpg'), source: 'MBJB' },
    // Jalan Abu Bakar Sultan / Country Garden — Danga Bay waterfront area (~1.463, 103.737)
    { id: 'mbjb-L6C1',  lat: 1.4630,  lng: 103.7370, name: 'MBJB – Jalan Abu Bakar Sultan / Country Garden (L6C1)',    city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/09W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L6C2',  lat: 1.4630,  lng: 103.7370, name: 'MBJB – Jalan Abu Bakar Sultan / Country Garden (L6C2)',    city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/10W.jpg'), source: 'MBJB' },
    // Jalan Abu Bakar Sultan / Dataran Bandaraya — city hall area (~1.465, 103.745)
    { id: 'mbjb-L7C1',  lat: 1.4650,  lng: 103.7450, name: 'MBJB – Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/11W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L7C2',  lat: 1.4650,  lng: 103.7450, name: 'MBJB – Jalan Abu Bakar Sultan / Dataran Bandaraya (L7C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/12W.jpg'), source: 'MBJB' },
    // Jalan TAR / Jalan Kebun Teh — Larkin area (~1.496, 103.730)
    { id: 'mbjb-L24C1', lat: 1.4960,  lng: 103.7300, name: 'MBJB – Jalan TAR / Jalan Kebun Teh (L24C1)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/45W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L24C2', lat: 1.4960,  lng: 103.7300, name: 'MBJB – Jalan TAR / Jalan Kebun Teh (L24C2)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/46W.jpg'), source: 'MBJB' },
    // Lbh Iskandar Puteri / Jalan TAR — near Larkin terminal (~1.494, 103.728)
    { id: 'mbjb-L26C1', lat: 1.4940,  lng: 103.7280, name: 'MBJB – Lbh Iskandar Puteri / Jalan TAR (L26C1)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/49W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L26C2', lat: 1.4940,  lng: 103.7280, name: 'MBJB – Lbh Iskandar Puteri / Jalan TAR (L26C2)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/50W.jpg'), source: 'MBJB' },
    // Jalan Tampoi / Kilang Bateri — Tampoi industrial area (~1.497, 103.715 per Bandar Baru UDA ref)
    { id: 'mbjb-L27C2', lat: 1.4970,  lng: 103.7200, name: 'MBJB – Jalan Tampoi / Kilang Bateri (L27C2)',              city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/52W.jpg'), source: 'MBJB' },
 
    // ── City Center ────────────────────────────────────────────────────────
    // Jalan Wong Ah Fook / JBCC — confirmed 1.4612, 103.7642 (JB City Square Wikipedia: 1.461194, 103.764194)
    { id: 'mbjb-L3C1',  lat: 1.4612,  lng: 103.7642, name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C1)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/05W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L3C2',  lat: 1.4612,  lng: 103.7642, name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C2)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/06W.jpg'), source: 'MBJB' },
    // Jalan Ibrahim / Jalan Pahang — north of city centre (~1.469, 103.762)
    { id: 'mbjb-L8C1',  lat: 1.4690,  lng: 103.7620, name: 'MBJB – Jalan Ibrahim / Jalan Pahang (L8C1)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/13W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L8C2',  lat: 1.4690,  lng: 103.7620, name: 'MBJB – Jalan Ibrahim / Jalan Pahang (L8C2)',               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/14W.jpg'), source: 'MBJB' },
    // Lorong Jalan Dhoby (Parking) — city centre near JB Sentral (~1.463, 103.761)
    { id: 'mbjb-L9C1',  lat: 1.4630,  lng: 103.7610, name: 'MBJB – Lorong Jalan Dhoby Parking (L9C1)',                 city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/15W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L9C2',  lat: 1.4630,  lng: 103.7610, name: 'MBJB – Lorong Jalan Dhoby Parking (L9C2)',                 city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/16W.jpg'), source: 'MBJB' },
    // Jalan Abdullah Ibrahim / Ungku Puan — city centre (~1.462, 103.763)
    { id: 'mbjb-L10C2', lat: 1.4620,  lng: 103.7630, name: 'MBJB – Jalan Abdullah Ibrahim / Ungku Puan (L10C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/18W.jpg'), source: 'MBJB' },
    // Jalan Abdullah Ibrahim / Persada — confirmed 1.461833, 103.761583 (Persada Johor Wikipedia)
    { id: 'mbjb-L11C1', lat: 1.4618,  lng: 103.7616, name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C1)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/19W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L11C2', lat: 1.4618,  lng: 103.7616, name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C2)',          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/20W.jpg'), source: 'MBJB' },
 
    // ── Jalan Tebrau to Kota Tinggi ────────────────────────────────────────
    // Jalan Tebrau / Lingkaran Dalam — inner ring road junction (~1.500, 103.765)
    { id: 'mbjb-L12C1', lat: 1.5000,  lng: 103.7650, name: 'MBJB – Jalan Tebrau / Lingkaran Dalam (L12C1)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/21W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L12C2', lat: 1.5000,  lng: 103.7650, name: 'MBJB – Jalan Tebrau / Lingkaran Dalam (L12C2)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/22W.jpg'), source: 'MBJB' },
    // Jalan Tebrau / Jalan Bakar Batu — confirmed ~1.500, 103.779 (Kampung Bakar Batu Wikipedia: 1.50023, 103.77891)
    { id: 'mbjb-L13C1', lat: 1.5002,  lng: 103.7789, name: 'MBJB – Jalan Tebrau / Jalan Bakar Batu (L13C1)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/23W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L13C2', lat: 1.5002,  lng: 103.7789, name: 'MBJB – Jalan Tebrau / Jalan Bakar Batu (L13C2)',           city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/24W.jpg'), source: 'MBJB' },
    // Jalan Tebrau / Jalan Bunga Ros — further northeast on Tebrau (~1.518, 103.790)
    { id: 'mbjb-L15C1', lat: 1.5180,  lng: 103.7900, name: 'MBJB – Jalan Tebrau / Jalan Bunga Ros (L15C1)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/27W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L15C2', lat: 1.5180,  lng: 103.7900, name: 'MBJB – Jalan Tebrau / Jalan Bunga Ros (L15C2)',            city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/28W.jpg'), source: 'MBJB' },
    // Jalan Tebrau / Susur EDL — EDL slip road junction (~1.527, 103.795)
    { id: 'mbjb-L16C1', lat: 1.5270,  lng: 103.7950, name: 'MBJB – Jalan Tebrau / Susur EDL (L16C1)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/29W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L16C2', lat: 1.5270,  lng: 103.7950, name: 'MBJB – Jalan Tebrau / Susur EDL (L16C2)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/30W.jpg'), source: 'MBJB' },
    // Jalan Pandan / Jalan Kangkar Tebrau — Pandan/Kangkar Tebrau area (~1.537, 103.802)
    { id: 'mbjb-L17C1', lat: 1.5370,  lng: 103.8020, name: 'MBJB – Jalan Pandan / Jalan Kangkar Tebrau (L17C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/31W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L17C2', lat: 1.5370,  lng: 103.8020, name: 'MBJB – Jalan Pandan / Jalan Kangkar Tebrau (L17C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/32W.jpg'), source: 'MBJB' },
    // Jalan Pandan / The Store — near Taman Johor Jaya (~1.537, 103.800)
    { id: 'mbjb-L18C1', lat: 1.5370,  lng: 103.8000, name: 'MBJB – Jalan Pandan / The Store (L18C1)',                  city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/33W.jpg'), source: 'MBJB' },
    // IKEA Tebrau — confirmed 1.5518, 103.7971 (parking.com.my + Wikimapia: 1°33'7"N 103°47'54"E)
    { id: 'mbjb-L19C1', lat: 1.5518,  lng: 103.7971, name: 'MBJB – Desa Jaya / IKEA (L19C1)',                          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/35W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L19C2', lat: 1.5518,  lng: 103.7971, name: 'MBJB – Desa Jaya / IKEA (L19C2)',                          city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/36W.jpg'), source: 'MBJB' },
    // Jalan Mutiara Emas Utama Roundabout — Mutiara Rini township (~1.515, 103.773)
    { id: 'mbjb-L25C1', lat: 1.5150,  lng: 103.7730, name: 'MBJB – Jalan Mutiara Emas Utama Roundabout (L25C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/47W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L25C2', lat: 1.5150,  lng: 103.7730, name: 'MBJB – Jalan Mutiara Emas Utama Roundabout (L25C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/48W.jpg'), source: 'MBJB' },
 
    // ── Jalan Ibrahim Sultan to Pasar Pelangi ──────────────────────────────
    // Permas Jaya — confirmed 1.4984, 103.8194 (Wikipedia: 1°29′54.3″N 103°49′10.0″E)
    { id: 'mbjb-L14C1', lat: 1.4984,  lng: 103.8194, name: 'MBJB – Permas Jaya (L14C1)',                               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/25W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L14C2', lat: 1.4984,  lng: 103.8194, name: 'MBJB – Permas Jaya (L14C2)',                               city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/26W.jpg'), source: 'MBJB' },
    // Jalan Ibrahim Sultan / Stulang Laut — coastal road near Stulang (~1.455, 103.762)
    { id: 'mbjb-L20C1', lat: 1.4550,  lng: 103.7620, name: 'MBJB – Jalan Ibrahim Sultan / Stulang Laut (L20C1)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/37W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L20C2', lat: 1.4550,  lng: 103.7620, name: 'MBJB – Jalan Ibrahim Sultan / Stulang Laut (L20C2)',       city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/38W.jpg'), source: 'MBJB' },
    // Jalan Ismail Sultan / Jalan Jim Quee — near CIQ/causeway area (~1.458, 103.760)
    { id: 'mbjb-L21C1', lat: 1.4580,  lng: 103.7600, name: 'MBJB – Jalan Ismail Sultan / Jalan Jim Quee (L21C1)',      city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/39W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L21C2', lat: 1.4580,  lng: 103.7600, name: 'MBJB – Jalan Ismail Sultan / Jalan Jim Quee (L21C2)',      city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/40W.jpg'), source: 'MBJB' },
    // Jalan Jim Quee / CIQ — CIQ checkpoint area (~1.460, 103.760)
    { id: 'mbjb-L22C1', lat: 1.4600,  lng: 103.7600, name: 'MBJB – Jalan Jim Quee / CIQ (L22C1)',                      city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/41W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L22C2', lat: 1.4600,  lng: 103.7600, name: 'MBJB – Jalan Jim Quee / CIQ (L22C2)',                      city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/42W.jpg'), source: 'MBJB' },
    // Jalan Ismail Sultan / Jalan Ibrahim Sultan — junction near waterfront (~1.456, 103.763)
    { id: 'mbjb-L23C1', lat: 1.4560,  lng: 103.7630, name: 'MBJB – Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C1)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/43W.jpg'), source: 'MBJB' },
    { id: 'mbjb-L23C2', lat: 1.4560,  lng: 103.7630, name: 'MBJB – Jalan Ismail Sultan / Jalan Ibrahim Sultan (L23C2)', city: 'Johor Bahru', country: 'Malaysia', feed_url: PROXY('https://c10.fgies.com/mbjb2/44W.jpg'), source: 'MBJB' },
 
  ];
  cams.push(...mbjbCameras);
 
  return cams.filter((c: any) => c.lat && c.lng);
}
