import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startPoint, endPoint, tripType } = body;

    // Use free OSRM API (Open Source Routing Machine) - no API key needed!
    const profile = tripType === 'cycling' ? 'bike' : 'foot';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?overview=full&geometries=geojson`;

    console.log(`📡 Server: Calling OSRM API (free): ${profile}`);
    console.log(`📡 Server: URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ApkaTravelRoutes/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server: Got real route data from OSRM!');
      console.log('📋 Server: Route keys:', Object.keys(data));
      if (data.routes && data.routes[0]) {
        console.log('🗺️ Server: Route distance:', data.routes[0].distance, 'meters');
        console.log('🗺️ Server: Route duration:', data.routes[0].duration, 'seconds');
        console.log('🗺️ Server: Geometry type:', typeof data.routes[0].geometry);
      }

      return NextResponse.json({
        success: true,
        data
      });
    } else {
      const errorText = await response.text();
      console.log(`❌ Server: OSRM API Error: ${response.status} - ${errorText}`);
      console.log(`❌ Server: Response headers:`, Object.fromEntries(response.headers.entries()));

      return NextResponse.json({
        success: false,
        error: `API Error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }
  } catch (error: any) {
    console.log(`❌ Server: Navigation API Error:`, error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
