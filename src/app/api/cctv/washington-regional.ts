// ── Washington State – Regional Webcams & Seattle City Cameras ───────────────
// Proxy hosts (all on _CCTV_PROXY_ALLOWED_HOSTS):
//   olypen.com              → Olympic Peninsula community webcam
//   flyykm.com              → Yakima / regional WA cam
//   cam.pangbornairport.com → Pangborn Airport, Wenatchee
//   www.lakecountypassage.com → Lake County Pass (Okanogan Highlands)
//   webcam.forkswa.com      → Forks, WA (Hoh Rainforest gateway)
//   webcam.sunmountainlodge.com → Sun Mountain Lodge, Winthrop
//   home.lewiscounty.com    → Lewis County (Mt Rainier region)
//   www.seattle.gov         → Seattle city traffic cameras
//   www.nps.gov             → National Park Service webcams (shared host)

export async function fetchWashingtonRegionalCameras(): Promise<any[]> {
  const cams: any[] = [];

  // Seattle city open data – traffic signal cameras
  try {
    const res = await fetch(
      'https://data.seattle.gov/resource/65fc-btcc.json?$limit=500',
      { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const cam of (data || [])) {
        const lat = parseFloat(cam.latitude || cam.lat || '');
        const lng = parseFloat(cam.longitude || cam.lng || '');
        if (!lat || !lng) continue;
        const camId = cam.cameraid || cam.id || '';
        cams.push({
          id: `sea-${camId || cams.length}`,
          lat, lng,
          name: cam.intersectionname || cam.name || 'Seattle Camera',
          city: 'Seattle',
          country: 'US',
          // www.seattle.gov image endpoint
          feed_url: camId
            ? `https://www.seattle.gov/trafficcams/${camId}.jpg`
            : cam.imageurl || '',
          source: 'Seattle DOT',
        });
      }
    }
  } catch { /* silent */ }

  // Static curated regional cameras — each on its own allowlisted host
  const curated = [
    // Olympic Peninsula
    {
      id: 'wa-olypen-sequim',
      lat: 48.0794, lng: -123.1011,
      name: 'Sequim – US-101 (Olympic Peninsula)',
      city: 'Sequim',
      feed_url: 'https://olypen.com/webcam/sequim-live.jpg',
      source: 'OlyPen Webcam',
    },
    {
      id: 'wa-forks-1',
      lat: 47.9476, lng: -124.3950,
      name: 'Forks, WA – Downtown Webcam',
      city: 'Forks',
      feed_url: 'https://webcam.forkswa.com/latest.jpg',
      source: 'Forks WA Webcam',
    },
    // Cascades / mountain passes
    {
      id: 'wa-sunmtn-winthrop',
      lat: 48.4752, lng: -120.1958,
      name: 'Sun Mountain Lodge – Methow Valley',
      city: 'Winthrop',
      feed_url: 'https://webcam.sunmountainlodge.com/webcam.jpg',
      source: 'Sun Mountain Lodge',
    },
    {
      id: 'wa-lakecounty-oroville',
      lat: 48.9337, lng: -119.4340,
      name: 'Lake Oroville – Okanogan Highlands',
      city: 'Oroville',
      feed_url: 'https://www.lakecountypassage.com/webcam/current.jpg',
      source: 'Lake County Passage',
    },
    // Wenatchee / East Cascades
    {
      id: 'wa-pangborn-airport',
      lat: 47.3979, lng: -120.2066,
      name: 'Pangborn Airport – Wenatchee',
      city: 'East Wenatchee',
      feed_url: 'https://cam.pangbornairport.com/latest.jpg',
      source: 'Pangborn Airport',
    },
    {
      id: 'wa-flyykm-yakima',
      lat: 46.6021, lng: -120.5059,
      name: 'Yakima – US-12 at I-82',
      city: 'Yakima',
      feed_url: 'https://flyykm.com/webcam/current.jpg',
      source: 'FlyYKM',
    },
    // Lewis County / Mt Rainier region
    {
      id: 'wa-lewiscounty-chehalis',
      lat: 46.6617, lng: -122.9635,
      name: 'Chehalis – Lewis County (I-5)',
      city: 'Chehalis',
      feed_url: 'https://home.lewiscounty.com/webcam/current.jpg',
      source: 'Lewis County',
    },
    // NPS webcams (www.nps.gov on allowlist)
    {
      id: 'wa-nps-rainier-paradise',
      lat: 46.7867, lng: -121.7353,
      name: 'Mt Rainier – Paradise (NPS)',
      city: 'Pierce County',
      feed_url: 'https://www.nps.gov/webcams/mora/paradise.jpg',
      source: 'NPS Rainier',
    },
    {
      id: 'wa-nps-olympic-hur',
      lat: 47.9657, lng: -123.4982,
      name: 'Olympic NP – Hurricane Ridge (NPS)',
      city: 'Clallam County',
      feed_url: 'https://www.nps.gov/webcams/olym/hurricane.jpg',
      source: 'NPS Olympic',
    },
    // Seattle city (www.seattle.gov)
    {
      id: 'wa-seattle-aurora-bridge',
      lat: 47.6442, lng: -122.3469,
      name: 'Seattle – Aurora Ave Bridge (SR-99)',
      city: 'Seattle',
      feed_url: 'https://www.seattle.gov/trafficcams/aurora_bridge.jpg',
      source: 'Seattle DOT',
    },
    {
      id: 'wa-seattle-i5-mercer',
      lat: 47.6250, lng: -122.3321,
      name: 'Seattle – I-5 at Mercer St',
      city: 'Seattle',
      feed_url: 'https://www.seattle.gov/trafficcams/i5_mercer.jpg',
      source: 'Seattle DOT',
    },
  ];

  for (const c of curated) {
    cams.push({ ...c, country: 'US' });
  }

  return cams.filter((c: any) => c.lat && c.lng);
}

// ── National Park Service webcams (shared across multiple parks) ──────────────
// Host: www.nps.gov — on _CCTV_PROXY_ALLOWED_HOSTS
export async function fetchNPSCameras(): Promise<any[]> {
  // NPS doesn't have a structured open camera API, so we use a curated list
  // of known live webcam image endpoints across popular parks.
  const nps = [
    // Yellowstone
    { id: 'nps-ynp-old-faithful', lat: 44.4605, lng: -110.8282, name: 'Yellowstone – Old Faithful Geyser', city: 'Yellowstone NP', feed_url: 'https://www.nps.gov/webcams/yell/oldFaithfulStaticNW.jpg' },
    { id: 'nps-ynp-mammoth', lat: 44.9769, lng: -110.7080, name: 'Yellowstone – Mammoth Hot Springs', city: 'Yellowstone NP', feed_url: 'https://www.nps.gov/webcams/yell/mammothStatic.jpg' },
    // Grand Canyon
    { id: 'nps-grca-south-rim', lat: 36.0544, lng: -112.1401, name: 'Grand Canyon – South Rim Visitor Center', city: 'Grand Canyon NP', feed_url: 'https://www.nps.gov/webcams/grca/grca_southrim.jpg' },
    // Glacier
    { id: 'nps-glac-going-to-sun', lat: 48.6962, lng: -113.7180, name: 'Glacier NP – Going-to-the-Sun Road', city: 'Glacier NP', feed_url: 'https://www.nps.gov/webcams/glac/gtts_static.jpg' },
    // Yosemite
    { id: 'nps-yose-valley', lat: 37.7459, lng: -119.5332, name: 'Yosemite Valley – El Capitan Meadow', city: 'Yosemite NP', feed_url: 'https://www.nps.gov/webcams/yose/valleyfloor.jpg' },
    // Denali
    { id: 'nps-dena-wonder-lake', lat: 63.4622, lng: -150.8917, name: 'Denali NP – Wonder Lake', city: 'Denali NP', feed_url: 'https://www.nps.gov/webcams/dena/wonderlake.jpg' },
    // Mt St Helens (managed by NPS/USFS)
    { id: 'nps-msh-crater', lat: 46.1912, lng: -122.1944, name: 'Mt St Helens – Crater Webcam', city: 'Skamania County', feed_url: 'https://www.nps.gov/webcams/msh/crater.jpg' },
    // Great Smoky Mountains
    { id: 'nps-grsm-clingmans', lat: 35.5629, lng: -83.4986, name: 'Great Smoky Mtns – Clingmans Dome', city: 'Blount County TN', feed_url: 'https://www.nps.gov/webcams/grsm/clingmansdome.jpg' },
  ];

  return nps.map(c => ({ ...c, country: 'US', source: 'NPS Webcam' }));
}
