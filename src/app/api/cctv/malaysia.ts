// ── Malaysia CCTV Cameras ──────────────────────────────────────────────────
// Sources:
//   • KLCCC  – Kuala Lumpur Command & Control Centre (DBKL)
//     https://klccc.dbkl.gov.my/cctv-images/
//   • MBJB   – Majlis Bandaraya Johor Bahru (via jalanow.com)
//     https://www.jalanow.com/MBJB-live-traffic-city-center.htm

export async function fetchMalaysiaCameras(): Promise<any[]> {
  const cams: any[] = [];

  // ── KLCCC: Kuala Lumpur Command & Control Centre ──────────────────────────
  // The KLCCC site streams live HLS video. Camera IDs (CN030F, CN033F, CN407F)
  // don't have public static-image endpoints, so we expose them via external_url.
  const klcccCameras = [
    {
      id: 'klccc-CN030F',
      lat: 3.1319,
      lng: 101.6841,
      name: 'KLCCC – CN030F (Bukit Jalil)',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
      external_url: 'https://klccc.dbkl.gov.my/cctv-images/',
      source: 'KLCCC',
    },
    {
      id: 'klccc-CN033F',
      lat: 3.1350,
      lng: 101.6870,
      name: 'KLCCC – CN033F (Bukit Jalil)',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
      external_url: 'https://klccc.dbkl.gov.my/cctv-images/',
      source: 'KLCCC',
    },
    {
      id: 'klccc-CN407F',
      lat: 3.1480,
      lng: 101.6950,
      name: 'KLCCC – CN407F (Lebuhraya Bukit Jalil)',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
      external_url: 'https://klccc.dbkl.gov.my/cctv-images/',
      source: 'KLCCC',
    },
  ];
  cams.push(...klcccCameras);

  // ── MBJB: Majlis Bandaraya Johor Bahru – City Centre cameras ─────────────
  // Images are served as refreshing JPGs from c10.fgies.com/mbjb2/
  const mbjbCameras = [
    // Jalan Wong Ah Fook (Hadapan JBCC)
    {
      id: 'mbjb-L3C1',
      lat: 1.4606,
      lng: 103.7574,
      name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C1)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/05W.jpg',
      source: 'MBJB',
    },
    {
      id: 'mbjb-L3C2',
      lat: 1.4610,
      lng: 103.7578,
      name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/06W.jpg',
      source: 'MBJB',
    },
    // Jalan Ibrahim / Jalan Pahang
    {
      id: 'mbjb-L8C1',
      lat: 1.4654,
      lng: 103.7615,
      name: 'MBJB – Jalan Ibrahim / Jalan Pahang (L8C1)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/13W.jpg',
      source: 'MBJB',
    },
    {
      id: 'mbjb-L8C2',
      lat: 1.4658,
      lng: 103.7619,
      name: 'MBJB – Jalan Ibrahim / Jalan Pahang (L8C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/14W.jpg',
      source: 'MBJB',
    },
    // Lorong Jalan Dhoby (Parking)
    {
      id: 'mbjb-L9C1',
      lat: 1.4635,
      lng: 103.7590,
      name: 'MBJB – Lorong Jalan Dhoby Parking (L9C1)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/15W.jpg',
      source: 'MBJB',
    },
    {
      id: 'mbjb-L9C2',
      lat: 1.4638,
      lng: 103.7593,
      name: 'MBJB – Lorong Jalan Dhoby Parking (L9C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/16W.jpg',
      source: 'MBJB',
    },
    // Jalan Abdullah Ibrahim / Ungku Puan
    {
      id: 'mbjb-L10C2',
      lat: 1.4621,
      lng: 103.7601,
      name: 'MBJB – Jalan Abdullah Ibrahim / Ungku Puan (L10C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/18W.jpg',
      source: 'MBJB',
    },
    // Jalan Abdullah Ibrahim (Persada)
    {
      id: 'mbjb-L11C1',
      lat: 1.4614,
      lng: 103.7610,
      name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C1)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/19W.jpg',
      source: 'MBJB',
    },
    {
      id: 'mbjb-L11C2',
      lat: 1.4617,
      lng: 103.7613,
      name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: 'https://c10.fgies.com/mbjb2/20W.jpg',
      source: 'MBJB',
    },
  ];
  cams.push(...mbjbCameras);

  return cams.filter((c: any) => c.lat && c.lng);
}
