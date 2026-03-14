import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const CACHE_TTL_MS = 60 * 1000;
const MAX_AIRCRAFT = 500;

let cachedData: { json: any; timestamp: number } | null = null;

// India bounding box for post-fetch filtering
const INDIA_BOUNDS = { lamin: 6, lamax: 36, lomin: 68, lomax: 98 };

// adsb.lol category string → OpenSky numeric category
const CAT_MAP: Record<string, number> = {
  A1: 1, A2: 2, A3: 3, A4: 4, A5: 5, A6: 6, A7: 7,
  B1: 8, B2: 9, B3: 10, B4: 11, B6: 12, B7: 13,
  C1: 14, C2: 15,
};

export async function GET(_request: NextRequest) {
  try {
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedData.json, {
        headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=10' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    // Center of India bounding box, 1400nm radius covers all of it
    const response = await fetch('https://api.adsb.lol/v2/lat/21/lon/83/dist/1400', {
      headers: { 'User-Agent': 'Meridian-Actual-Tracker' },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) throw new Error(`adsb.lol returned ${response.status}`);

    const data = await response.json();
    const raw: any[] = data.ac || [];

    const aircraft = raw
      .filter((ac) => {
        if (ac.alt_baro == null || ac.lat == null || ac.lon == null) return false;
        if (ac.alt_baro === 'ground') return false;
        // Filter to India bounding box
        if (ac.lat < INDIA_BOUNDS.lamin || ac.lat > INDIA_BOUNDS.lamax) return false;
        if (ac.lon < INDIA_BOUNDS.lomin || ac.lon > INDIA_BOUNDS.lomax) return false;
        return true;
      })
      .slice(0, MAX_AIRCRAFT)
      .map((ac) => ({
        icao24: ac.hex,
        callsign: (ac.flight || '').trim(),
        originCountry: ac.r ? ac.r.split('-')[0] : '',
        lat: ac.lat,
        lng: ac.lon,
        // Convert feet → meters to keep frontend interface compatible
        altitude: typeof ac.alt_baro === 'number' ? ac.alt_baro / 3.281 : null,
        // Convert knots → m/s
        velocity: ac.gs != null ? ac.gs / 1.944 : null,
        heading: ac.track ?? ac.true_heading ?? null,
        // Convert ft/min → m/s
        verticalRate: ac.baro_rate != null ? ac.baro_rate / 196.85 : null,
        onGround: false,
        geoAltitude: null,
        squawk: ac.squawk || null,
        category: CAT_MAP[ac.category] ?? 0,
        // Bonus fields from adsb.lol
        registration: ac.r || null,
        aircraftType: ac.t || null,
      }));

    const result = { aircraft, time: Math.floor(Date.now() / 1000) };
    cachedData = { json: result, timestamp: Date.now() };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=10' },
    });
  } catch (error) {
    console.error('adsb.lol fetch error:', error);

    if (cachedData) {
      return NextResponse.json(cachedData.json, {
        headers: { 'Cache-Control': 'public, s-maxage=10' },
      });
    }

    return NextResponse.json({ error: 'Failed to fetch aircraft data', aircraft: [] }, { status: 502 });
  }
}
