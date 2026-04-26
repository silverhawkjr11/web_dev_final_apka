'use client';

import Image from 'next/image';

interface RouteData {
  routeName: string;
  country: string;
  city: string;
  tripType: 'cycling' | 'trekking';
  duration: number;
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
  }>;
  totalDistance: number;
  description: string;
  countryImage: string;
}

interface RouteDetailsProps {
  routeData: RouteData;
}

export default function RouteDetails({ routeData }: RouteDetailsProps) {
  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">
          Route Details
        </h3>
        <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
          {routeData.tripType === 'cycling' ? '🚴‍♂️ Cycling' : '🥾 Trekking'}
        </div>
      </div>

      {/* Route Name and Basic Info */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-gray-800">
          {routeData.routeName}
        </h4>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Destination:</span>
            <br />
            <span className="text-gray-800">{routeData.city}, {routeData.country}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Duration:</span>
            <br />
            <span className="text-gray-800">{routeData.duration} day{routeData.duration > 1 ? 's' : ''}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Total Distance:</span>
            <br />
            <span className="text-gray-800 font-semibold">{routeData.totalDistance} km</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Avg. Daily:</span>
            <br />
            <span className="text-gray-800">{Math.round(routeData.totalDistance / routeData.duration)} km/day</span>
          </div>
        </div>
      </div>

      {/* Country Image */}
      <div className="relative">
        <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-200">
          <Image
            src={routeData.countryImage || `https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&h=400&fit=crop`}
            alt={`${routeData.country} landscape`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              // Fallback to a generic landscape if country image fails
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
            <div className="text-white">
              <div className="text-lg font-semibold">{routeData.country}</div>
              <div className="text-sm opacity-90">Beautiful landscapes ahead</div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Description */}
      <div>
        <h5 className="font-semibold text-gray-700 mb-2">Route Description</h5>
        <p className="text-gray-600 leading-relaxed">
          {routeData.description}
        </p>
      </div>

      {/* Daily Breakdown */}
      <div>
        <h5 className="font-semibold text-gray-700 mb-3">Daily Breakdown</h5>
        <div className="space-y-3">
          {routeData.dailySegments.map((segment) => (
            <div key={segment.day} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-800">
                  Day {segment.day}
                </div>
                <div className="text-sm bg-white px-2 py-1 rounded font-medium">
                  {segment.distance} km
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <span className="w-12 text-green-600 font-medium">Start:</span>
                  <span>{segment.startPoint.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-12 text-red-600 font-medium">End:</span>
                  <span>{segment.endPoint.name}</span>
                </div>
              </div>

              {/* Estimated time based on trip type */}
              <div className="mt-2 text-xs text-gray-500">
                Estimated time: {
                  routeData.tripType === 'cycling'
                    ? `${Math.round(segment.distance / 15)} - ${Math.round(segment.distance / 20)} hours`
                    : `${Math.round(segment.distance / 3)} - ${Math.round(segment.distance / 4)} hours`
                } (including breaks)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Characteristics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-800 mb-2">Route Characteristics</h5>
        <div className="space-y-2 text-sm text-blue-700">
          {routeData.tripType === 'cycling' ? (
            <>
              <div className="flex items-center">
                <span className="mr-2">🛣️</span>
                <span>Follows real roads and dedicated bike paths</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🏙️</span>
                <span>City-to-city route with urban and suburban sections</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">⚡</span>
                <span>Moderate to fast pace (15-20 km/h average)</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🚴‍♂️</span>
                <span>Suitable for road bikes and hybrid bikes</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center">
                <span className="mr-2">🥾</span>
                <span>Follows hiking trails and walking paths</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔄</span>
                <span>Circular route - returns to starting point</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🚶‍♂️</span>
                <span>Walking pace (3-4 km/h average)</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">👟</span>
                <span>Suitable for hiking boots and comfortable shoes</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Difficulty Level */}
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
        <div>
          <div className="font-semibold text-gray-700">Difficulty Level</div>
          <div className="text-sm text-gray-600">
            Based on distance and terrain type
          </div>
        </div>
        <div className="text-right">
          {(() => {
            const avgDaily = routeData.totalDistance / routeData.duration;
            let difficulty, color;

            if (routeData.tripType === 'cycling') {
              if (avgDaily <= 40) { difficulty = 'Easy'; color = 'text-green-600'; }
              else if (avgDaily <= 55) { difficulty = 'Medium'; color = 'text-yellow-600'; }
              else { difficulty = 'Hard'; color = 'text-red-600'; }
            } else {
              if (avgDaily <= 6) { difficulty = 'Easy'; color = 'text-green-600'; }
              else if (avgDaily <= 8) { difficulty = 'Medium'; color = 'text-yellow-600'; }
              else { difficulty = 'Hard'; color = 'text-red-600'; }
            }

            return (
              <div className={`font-semibold ${color}`}>
                {difficulty}
              </div>
            );
          })()}
          <div className="text-sm text-gray-500">
            {Math.round(routeData.totalDistance / routeData.duration)} km/day avg.
          </div>
        </div>
      </div>
    </div>
  );
}
