import { NextResponse } from 'next/server';

// Allow up to 30s on Vercel
export const maxDuration = 30;

// All tracked NORAD IDs (must stay in sync with MapContainer TRACKED_SATELLITES)
const TRACKED_NORAD_IDS = [
  20580, 25544, 25994, 27386, 27424, 28376, 28654, 28874, 29107, 29108,
  32382, 33492, 33591, 35931, 36036, 36508, 37387, 37820, 37849, 38771,
  39084, 39086, 39634, 39766, 39953, 40115, 40128, 40129, 40376, 40390,
  40697, 40930, 41240, 41790, 41866, 41877, 42063, 42969, 43013, 43064,
  43226, 43286, 43437, 43477, 43613, 43689, 43719, 44078, 44233, 44323,
  44324, 44325, 44421, 44804, 44857, 44874, 46905, 46984, 47066, 48208,
  48274, 48859, 48907, 50465, 50809, 51071, 51656, 51807, 51850, 54234,
  54361, 54743, 55083, 56174, 56704, 56759, 58694, 58990, 60454, 62850,
];

interface TleEntry {
  satelliteId: number;
  line1: string;
  line2: string;
  name: string;
}

async function fetchTle(noradId: number, signal: AbortSignal): Promise<TleEntry | null> {
  try {
    const response = await fetch(
      `https://tle.ivanstanojevic.me/api/tle/${noradId}`,
      { signal }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.line1 || !data.line2) return null;
    return {
      satelliteId: data.satelliteId,
      line1: data.line1,
      line2: data.line2,
      name: data.name || `SAT-${noradId}`,
    };
  } catch {
    return null;
  }
}

// In-memory cache (10 min TTL)
let cache: { tle: string; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  try {
    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(
        { tle: cache.tle },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
          }
        }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    // Fetch all tracked satellites in parallel batches
    const BATCH_SIZE = 20;
    const entries: TleEntry[] = [];

    for (let i = 0; i < TRACKED_NORAD_IDS.length; i += BATCH_SIZE) {
      const batch = TRACKED_NORAD_IDS.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(id => fetchTle(id, controller.signal))
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          entries.push(result.value);
        }
      }
    }

    clearTimeout(timeout);

    console.log(`TLE fetch: ${entries.length}/${TRACKED_NORAD_IDS.length} satellites retrieved`);

    if (entries.length === 0) {
      throw new Error('All TLE fetches failed');
    }

    // Build traditional 3-line TLE format: name\nline1\nline2
    const tleText = entries
      .map(e => `${e.name}\n${e.line1}\n${e.line2}`)
      .join('\n');

    // Update cache
    cache = { tle: tleText, timestamp: Date.now() };

    return NextResponse.json(
      { tle: tleText },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching TLE data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TLE data', tle: '' },
      { status: 500 }
    );
  }
}
