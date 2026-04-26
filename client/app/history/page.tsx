'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import RouteCard from '@/components/RouteCard';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface RouteHistory {
  _id: string;
  routeName: string;
  country: string;
  city: string;
  tripType: 'cycling' | 'trekking';
  duration: number;
  routeData: {
    totalDistance: number;
    description: string;
    countryImage: string;
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
  };
  approved: boolean;
  createdAt: string;
}

export default function HistoryPage() {
  const [routes, setRoutes] = useState<RouteHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cycling' | 'trekking'>('all');
  const [selectedRoute, setSelectedRoute] = useState<RouteHistory | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to view route history');
      return;
    }
    fetchRoutes();
  }, [isAuthenticated]);

  const fetchRoutes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'}/routes`, {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('accessToken=')[1]?.split(';')[0]}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }

      const data = await response.json();
      setRoutes(data.routes);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpdatedWeather = async (routeId: string, coordinates: number[]) => {
    try {
      // Mock weather API call - in real app, call actual weather service
      const mockWeather = {
        location: 'Route Location',
        forecast: [
          { day: 'Tomorrow', temp: `${Math.floor(Math.random() * 10) + 18}°C`, condition: 'Sunny', icon: '☀️' },
          { day: 'Day 2', temp: `${Math.floor(Math.random() * 10) + 18}°C`, condition: 'Partly Cloudy', icon: '⛅' },
          { day: 'Day 3', temp: `${Math.floor(Math.random() * 10) + 18}°C`, condition: 'Cloudy', icon: '☁️' }
        ]
      };

      setWeatherData(mockWeather);
      toast.success('Weather forecast updated for tomorrow!');
    } catch (error: any) {
      toast.error('Failed to fetch weather data');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Authentication Required
        </h2>
        <p className="text-gray-600 mb-6">
          Please sign in to view your route history.
        </p>
        <Link
          href="/login"
          className="btn-primary"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || route.tripType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          📚 Route History
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          View and revisit your saved routes with updated weather forecasts
        </p>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes by name, country, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'cycling' | 'trekking')}
            className="input-field"
          >
            <option value="all">All Route Types</option>
            <option value="cycling">🚴‍♂️ Cycling Routes</option>
            <option value="trekking">🥾 Trekking Routes</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Statistics */}
          {routes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{routes.length}</div>
                <div className="text-sm text-blue-800">Total Routes</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {routes.filter(r => r.tripType === 'cycling').length}
                </div>
                <div className="text-sm text-green-800">Cycling Routes</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {routes.filter(r => r.tripType === 'trekking').length}
                </div>
                <div className="text-sm text-orange-800">Trekking Routes</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(routes.reduce((sum, r) => sum + r.routeData.totalDistance, 0))}
                </div>
                <div className="text-sm text-purple-800">Total KM</div>
              </div>
            </div>
          )}

          {/* Routes Grid */}
          {filteredRoutes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoutes.map((route) => (
                <RouteCard
                  key={route._id}
                  route={route}
                  onViewDetails={(route) => {
                    setSelectedRoute(route);
                    const coords = route.routeData?.dailySegments?.[0]?.startPoint
                      ? [route.routeData.dailySegments[0].startPoint.lat, route.routeData.dailySegments[0].startPoint.lng]
                      : [0, 0];
                    fetchUpdatedWeather(route._id, coords);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {routes.length === 0 ? (
                <>
                  <div className="text-6xl mb-4">📍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Routes Yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    You haven't created any routes yet. Start planning your first adventure!
                  </p>
                  <Link
                    href="/planning"
                    className="btn-primary"
                  >
                    Create Your First Route
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Routes Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    No routes match your current search criteria.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                    className="btn-secondary"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Route Detail Modal */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          weatherData={weatherData}
          onClose={() => {
            setSelectedRoute(null);
            setWeatherData(null);
          }}
        />
      )}
    </div>
  );
}

// Route Detail Modal Component
function RouteDetailModal({
  route,
  weatherData,
  onClose
}: {
  route: RouteHistory;
  weatherData: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {route.routeName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Location:</span>
                <br />
                <span className="text-gray-800">{route.city}, {route.country}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Type:</span>
                <br />
                <span className="text-gray-800">
                  {route.tripType === 'cycling' ? '🚴‍♂️ Cycling' : '🥾 Trekking'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Duration:</span>
                <br />
                <span className="text-gray-800">{route.duration} days</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Distance:</span>
                <br />
                <span className="text-gray-800 font-semibold">{route.routeData.totalDistance} km</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600">{route.routeData.description}</p>
            </div>

            {/* Weather Forecast */}
            {weatherData && (
              <div className="weather-widget">
                <div className="flex items-center mb-4">
                  <span className="text-blue-600 text-xl mr-2">🌤️</span>
                  <h4 className="text-lg font-semibold text-blue-800">
                    Updated Weather Forecast
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {weatherData.forecast.map((day: any, index: number) => (
                    <div key={index} className="text-center bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {day.day}
                      </div>
                      <div className="text-2xl mb-1">
                        {day.icon}
                      </div>
                      <div className="font-semibold text-blue-800 mb-1">
                        {day.temp}
                      </div>
                      <div className="text-xs text-gray-600">
                        {day.condition}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-blue-700">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  Forecast for starting tomorrow
                </div>
              </div>
            )}

            {/* Daily Breakdown */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Daily Breakdown</h4>
              <div className="space-y-2">
                {route.routeData.dailySegments.map((segment) => (
                  <div key={segment.day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Day {segment.day}</div>
                      <div className="text-sm text-gray-600">
                        {segment.startPoint.name} → {segment.endPoint.name}
                      </div>
                    </div>
                    <div className="text-sm bg-white px-2 py-1 rounded font-medium">
                      {segment.distance} km
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Link
                href={`/planning?country=${encodeURIComponent(route.country)}&city=${encodeURIComponent(route.city)}&type=${route.tripType}`}
                className="btn-primary flex-1 text-center"
              >
                Create Similar Route
              </Link>
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
