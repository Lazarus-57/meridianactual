import { NextResponse } from 'next/server';

// Allow up to 30s on Vercel
export const maxDuration = 30;

// Targeted groups that cover our tracked satellites without downloading all 14,700
const TLE_GROUPS = [
  'stations',     // ISS, CSS
  'weather',      // NOAA, GOES, MetOp, Suomi NPP, JPSS
  'resource',     // Landsat, ResourceSat, Cartosat, Sentinel-2
  'sarsat',       // Sentinel-1, RADARSAT, RCM, ALOS, EOS-04
  'science',      // Hubble, ICESat-2, CALIPSO, GRACE-FO, SMAP, DSCOVR
  'geodetic',     // CryoSat-2, Jason-3, Sentinel-6
  'noaa',         // NOAA polar orbiters
  'goes',         // GOES geostationary
  'gnss',         // GPS, Galileo, navigation
  'indian',       // ISRO satellites (Cartosat, Oceansat, IRNSS, INSAT, etc.)
];

async function fetchGroup(group: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(
    `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`,
    {
      headers: { 'User-Agent': 'Meridian-Actual-Satellite-Tracker' },
      signal,
    }
  );
  if (!response.ok) throw new Error(`Group ${group}: ${response.status}`);
  return response.text();
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    // Fetch all groups in parallel
    const results = await Promise.allSettled(
      TLE_GROUPS.map(group => fetchGroup(group, controller.signal))
    );

    clearTimeout(timeout);

    // Combine all successful results
    const tleChunks: string[] = [];
    let successCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.trim().length > 0) {
        tleChunks.push(result.value.trim());
        successCount++;
      }
    }

    console.log(`TLE fetch: ${successCount}/${TLE_GROUPS.length} groups succeeded`);

    if (tleChunks.length === 0) {
      throw new Error('All Celestrak group fetches failed');
    }

    const tleText = tleChunks.join('\n');

    return NextResponse.json(
      { tle: tleText },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching TLE from Celestrak:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TLE data', tle: '' },
      { status: 500 }
    );
  }
}
