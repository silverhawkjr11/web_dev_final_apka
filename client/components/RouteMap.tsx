'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <div className="leaflet-container bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
    <div className="text-gray-500">Loading map...</div>
  </div>
});

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface RouteData {
  routeName: string;
  coordinates: number[][];
  dailySegments: Array<{
    day: number;
    distance: number;
    startPoint: {
      lat: number;
      lng: number;
      name: string;
    };
    endPoint: {
      lat: number;
      lng: number;
      name: string;
    };
    waypoints: number[][];
  }>;
  tripType: 'cycling' | 'trekking';
}

interface RouteMapProps {
  routeData: RouteData;
}

export default function RouteMap({ routeData }: RouteMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet only on client side
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
        
        // Fix for default markers in Leaflet with Next.js
        delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      });
    }
  }, []);

  if (!isClient || !L) {
    return (
      <div className="leaflet-container bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Calculate map bounds from route segments (better than routeData.coordinates)
  const getAllRoutePoints = () => {
    const allPoints: [number, number][] = [];
    
    console.log('🗺️ RouteMap: Calculating bounds from route data');
    console.log('🗺️ RouteMap: Daily segments:', routeData.dailySegments.length);
    
    // Collect all waypoints from all daily segments
    routeData.dailySegments.forEach((segment, index) => {
      console.log(`🗺️ RouteMap: Day ${index + 1} - Start: [${segment.startPoint.lat}, ${segment.startPoint.lng}]`);
      console.log(`🗺️ RouteMap: Day ${index + 1} - End: [${segment.endPoint.lat}, ${segment.endPoint.lng}]`);
      console.log(`🗺️ RouteMap: Day ${index + 1} - Waypoints: ${segment.waypoints?.length || 0}`);
      
      if (segment.waypoints && Array.isArray(segment.waypoints)) {
        segment.waypoints.forEach(point => {
          if (Array.isArray(point) && point.length >= 2) {
            allPoints.push([point[0], point[1]]);
          }
        });
        if (segment.waypoints.length > 0) {
          console.log(`🗺️ RouteMap: Day ${index + 1} - First waypoint: [${segment.waypoints[0][0]}, ${segment.waypoints[0][1]}]`);
          console.log(`🗺️ RouteMap: Day ${index + 1} - Last waypoint: [${segment.waypoints[segment.waypoints.length-1][0]}, ${segment.waypoints[segment.waypoints.length-1][1]}]`);
        }
      }
      // Also add start and end points
      allPoints.push([segment.startPoint.lat, segment.startPoint.lng]);
      allPoints.push([segment.endPoint.lat, segment.endPoint.lng]);
    });
    
    console.log(`🗺️ RouteMap: Total collected points: ${allPoints.length}`);
    if (allPoints.length > 0) {
      console.log('🗺️ RouteMap: First point:', allPoints[0]);
      console.log('🗺️ RouteMap: Last point:', allPoints[allPoints.length - 1]);
    }
    
    return allPoints;
  };
  
  const allRoutePoints = getAllRoutePoints();
  const bounds = allRoutePoints.length > 0 ? L.latLngBounds(allRoutePoints) : null;
  const center = bounds ? bounds.getCenter() : 
    routeData.dailySegments.length > 0 
      ? [routeData.dailySegments[0].startPoint.lat, routeData.dailySegments[0].startPoint.lng]
      : [41.9028, 12.4964]; // Rome as default instead of Madrid
  
  console.log('🗺️ RouteMap: Final map center:', center);
  console.log('🗺️ RouteMap: Has bounds:', !!bounds);

  // Colors for different days
  const dayColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Create custom icons for start/end points
  const createCustomIcon = (color: string, symbol: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${symbol}</div>`,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  const startIcon = createCustomIcon('#10B981', '🚩');
  const endIcon = createCustomIcon('#EF4444', '🏁');
  const waypointIcon = createCustomIcon('#3B82F6', '•');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">
          {routeData.tripType === 'cycling' ? '🚴‍♂️' : '🥾'} Route Map
        </h3>
        <div className="text-sm text-gray-600">
          {routeData.dailySegments.length} day{routeData.dailySegments.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="leaflet-container" style={{ height: '400px', width: '100%' }}>
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          bounds={bounds || undefined}
          boundsOptions={{ padding: [20, 20] }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Render daily segments */}
          {routeData.dailySegments.map((segment, index) => {
            const color = dayColors[index % dayColors.length];
            
            return (
              <React.Fragment key={segment.day}>
                {/* Polyline for the day's route */}
                <Polyline 
                  positions={segment.waypoints as [number, number][]}
                  color={color}
                  weight={4}
                  opacity={0.8}
                  dashArray={routeData.tripType === 'trekking' ? '10, 5' : undefined}
                />
                
                {/* Start point marker */}
                <Marker 
                  position={[segment.startPoint.lat, segment.startPoint.lng]}
                  icon={index === 0 ? startIcon : waypointIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <div className="font-semibold text-green-700">
                        {index === 0 ? '🚩 Start Point' : `Day ${segment.day} Start`}
                      </div>
                      <div className="text-sm text-gray-600">{segment.startPoint.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Day {segment.day}: {segment.distance}km
                      </div>
                    </div>
                  </Popup>
                </Marker>
                
                {/* End point marker (for last segment or different cities) */}
                {(index === routeData.dailySegments.length - 1 || routeData.tripType === 'cycling') && (
                  <Marker 
                    position={[segment.endPoint.lat, segment.endPoint.lng]}
                    icon={index === routeData.dailySegments.length - 1 ? endIcon : waypointIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <div className="font-semibold text-red-700">
                          {index === routeData.dailySegments.length - 1 ? '🏁 End Point' : `Day ${segment.day} End`}
                        </div>
                        <div className="text-sm text-gray-600">{segment.endPoint.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Day {segment.day}: {segment.distance}km
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Route Legend</h4>
          {routeData.dailySegments.map((segment, index) => (
            <div key={segment.day} className="flex items-center space-x-2">
              <div 
                className="w-4 h-1 rounded"
                style={{ backgroundColor: dayColors[index % dayColors.length] }}
              ></div>
              <span className="text-gray-600">
                Day {segment.day}: {segment.distance}km
              </span>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Markers</h4>
          <div className="space-y-1 text-gray-600">
            <div>🚩 Start Point</div>
            <div>🏁 End Point</div>
            <div>• Waypoints</div>
          </div>
        </div>
      </div>

      {/* Route Type Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-sm text-gray-600">
          <strong>Route Type:</strong> {routeData.tripType === 'cycling' ? 'Cycling (roads & bike paths)' : 'Trekking (trails & hiking paths)'}
          {routeData.tripType === 'trekking' && (
            <span className="ml-2 text-blue-600">• Circular route returns to start</span>
          )}
        </div>
      </div>
    </div>
  );
}