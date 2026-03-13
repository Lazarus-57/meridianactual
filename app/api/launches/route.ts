import { NextResponse } from 'next/server';

export const maxDuration = 30;

// In-memory cache to protect against LL2 rate limits (15 req/hour free tier)
let cachedData: { json: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    // Return cached data if fresh
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedData.json, {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=600',
        },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=15&format=json',
      {
        headers: { 'User-Agent': 'Meridian-Actual-Satellite-Tracker' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`LL2 API returned ${response.status}`);
    }

    const data = await response.json();

    // Update in-memory cache
    cachedData = { json: data, timestamp: Date.now() };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching launches from LL2:', error);

    // Serve stale cache on error rather than failing
    if (cachedData) {
      return NextResponse.json(cachedData.json, {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch launch data', results: [] },
      { status: 502 }
    );
  }
}
