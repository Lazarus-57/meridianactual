import { NextRequest, NextResponse } from 'next/server';

const API_KEY = 'YNWVSF-BN4RKB-QV9ECQ-5OMU';

export async function GET(request: NextRequest) {
  try {
    // Test with abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.n2yo.com/rest/v1/satellite/positions/25544/20.5937/78.9629/0/1?apiKey=${API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      data: data,
      message: 'Raw API response for ISS'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || String(error),
      name: error.name,
      message: 'Failed to fetch from N2YO API - Check if API key is valid or API is down'
    }, { status: 500 });
  }
}

