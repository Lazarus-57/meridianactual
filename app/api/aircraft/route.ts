import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// In-memory cache (60s TTL — aircraft move fast but OpenSky updates every ~10s)
let cachedData: { json: any; timestamp: number; cacheKey: string } | null = null;
const CACHE_TTL_MS = 60 * 1000;
const MAX_AIRCRAFT = 500;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lamin = searchParams.get('lamin');
    const lamax = searchParams.get('lamax');
    const lomin = searchParams.get('lomin');
    const lomax = searchParams.get('lomax');

    const cacheKey = `${lamin}-${lamax}-${lomin}-${lomax}`;

    if (cachedData && cachedData.cacheKey === cacheKey && Date.now() - cachedData.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedData.json, {
        headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=10' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let url = 'https://opensky-network.org/api/states/all';
    if (lamin && lamax && lomin && lomax) {
      url += `?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Meridian-Actual-Tracker' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OpenSky API returned ${response.status}`);
    }

    const data = await response.json();
    const states: any[][] = data.states || [];

    const aircraft = states
      .filter((s: any[]) => {
        if (s[8] === true) return false;          // on_ground
        if (s[5] == null || s[6] == null) return false; // null lng/lat
        return true;
      })
      .slice(0, MAX_AIRCRAFT)
      .map((s: any[]) => ({
        icao24: s[0],
        callsign: (s[1] || '').trim(),
        originCountry: s[2],
        lat: s[6],
        lng: s[5],
        altitude: s[7],
        velocity: s[9],
        heading: s[10],
        verticalRate: s[11],
        onGround: s[8],
        geoAltitude: s[13],
        squawk: s[14],
        category: s[17] ?? 0,
      }));

    const result = { aircraft, time: data.time };

    cachedData = { json: result, timestamp: Date.now(), cacheKey };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=10' },
    });
  } catch (error) {
    console.error('Error fetching aircraft from OpenSky:', error);

    if (cachedData) {
      return NextResponse.json(cachedData.json, {
        headers: { 'Cache-Control': 'public, s-maxage=10' },
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch aircraft data', aircraft: [] },
      { status: 502 }
    );
  }
}
