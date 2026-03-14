import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const CACHE_TTL_MS = 60 * 1000;
const MAX_AIRCRAFT = 500;

let cachedData: { json: any; timestamp: number; cacheKey: string } | null = null;

// OAuth2 token cache
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Reuse cached token if still valid (with 30s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 30000) {
    return tokenCache.token;
  }

  try {
    const res = await fetch(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return tokenCache.token;
  } catch {
    return null;
  }
}

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

    let url = 'https://opensky-network.org/api/states/all';
    if (lamin && lamax && lomin && lomax) {
      url += `?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
    }

    const headers: Record<string, string> = { 'User-Agent': 'Meridian-Actual-Tracker' };
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`OpenSky returned ${response.status}`);

    const data = await response.json();
    const states: any[][] = data.states || [];

    const aircraft = states
      .filter((s: any[]) => s[8] !== true && s[5] != null && s[6] != null)
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
    console.error('OpenSky fetch error:', error);

    if (cachedData) {
      return NextResponse.json(cachedData.json, {
        headers: { 'Cache-Control': 'public, s-maxage=10' },
      });
    }

    return NextResponse.json({ error: 'Failed to fetch aircraft data', aircraft: [] }, { status: 502 });
  }
}
