import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch TLE data from Celestrak - 'active' group has all operational satellites
    const response = await fetch(
      `https://celestrak.com/NORAD/elements/gp.php?GROUP=active&FORMAT=tle`,
      {
        headers: {
          'User-Agent': 'Meridian-Actual-Satellite-Tracker',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Celestrak returned status ${response.status}`);
    }

    const tleText = await response.text();

    if (!tleText || tleText.trim().length === 0) {
      throw new Error('Received empty TLE data from Celestrak');
    }

    // Cache for 1 hour
    return NextResponse.json(
      { tle: tleText },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
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
