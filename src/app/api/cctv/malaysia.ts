const PROXY = (url: string) =>
  `/api/cctv/proxy?url=${encodeURIComponent(url)}`;
 
export async function fetchMalaysiaCameras(): Promise<any[]> {
  const cams: any[] = [];

// ── MBJB: Majlis Bandaraya Johor Bahru – City Centre cameras ─────────────
  // Images at c10.fgies.com require Referer: jalanow.com — proxied via /api/cctv/proxy
  const mbjbCameras = [
    // Jalan Wong Ah Fook (Hadapan JBCC)
    {
      id: 'mbjb-L3C1',
      lat: 1.4606,
      lng: 103.7574,
      name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C1)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: PROXY('https://c10.fgies.com/mbjb2/05W.jpg'),
      source: 'MBJB',
    },
    {
      id: 'mbjb-L3C2',
      lat: 1.4610,
      lng: 103.7578,
      name: 'MBJB – Jalan Wong Ah Fook / JBCC (L3C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: PROXY('https://c10.fgies.com/mbjb2/06W.jpg'),
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
      feed_url: PROXY('https://c10.fgies.com/mbjb2/13W.jpg'),
      source: 'MBJB',
    },
    {
      id: 'mbjb-L8C2',
      lat: 1.4658,
      lng: 103.7619,
      name: 'MBJB – Jalan Ibrahim / Jalan Pahang (L8C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: PROXY('https://c10.fgies.com/mbjb2/14W.jpg'),
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
      feed_url: PROXY('https://c10.fgies.com/mbjb2/15W.jpg'),
      source: 'MBJB',
    },
    {
      id: 'mbjb-L9C2',
      lat: 1.4638,
      lng: 103.7593,
      name: 'MBJB – Lorong Jalan Dhoby Parking (L9C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: PROXY('https://c10.fgies.com/mbjb2/16W.jpg'),
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
      feed_url: PROXY('https://c10.fgies.com/mbjb2/18W.jpg'),
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
      feed_url: PROXY('https://c10.fgies.com/mbjb2/19W.jpg'),
      source: 'MBJB',
    },
    {
      id: 'mbjb-L11C2',
      lat: 1.4617,
      lng: 103.7613,
      name: 'MBJB – Jalan Abdullah Ibrahim / Persada (L11C2)',
      city: 'Johor Bahru',
      country: 'Malaysia',
      feed_url: PROXY('https://c10.fgies.com/mbjb2/20W.jpg'),
      source: 'MBJB',
    },
  ];
  cams.push(...mbjbCameras);
 
  return cams.filter((c: any) => c.lat && c.lng);
}
