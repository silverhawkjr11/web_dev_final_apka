'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { MapPinIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

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

interface RouteCardProps {
  route: RouteHistory;
  onViewDetails: (route: RouteHistory) => void;
}

export default function RouteCard({ route, onViewDetails }: RouteCardProps) {
  const avgDailyDistance = Math.round(route.routeData.totalDistance / route.duration);
  
  const getDifficultyInfo = () => {
    let difficulty, color;
    
    if (route.tripType === 'cycling') {
      if (avgDailyDistance <= 40) {
        difficulty = 'Easy';
        color = 'bg-green-100 text-green-800';
      } else if (avgDailyDistance <= 55) {
        difficulty = 'Medium';
        color = 'bg-yellow-100 text-yellow-800';
      } else {
        difficulty = 'Hard';
        color = 'bg-red-100 text-red-800';
      }
    } else {
      if (avgDailyDistance <= 6) {
        difficulty = 'Easy';
        color = 'bg-green-100 text-green-800';
      } else if (avgDailyDistance <= 8) {
        difficulty = 'Medium';
        color = 'bg-yellow-100 text-yellow-800';
      } else {
        difficulty = 'Hard';
        color = 'bg-red-100 text-red-800';
      }
    }
    
    return { difficulty, color };
  };

  const { difficulty, color } = getDifficultyInfo();

  return (
    <div className="route-card overflow-hidden">
      {/* Route Image */}
      <div className="relative h-48 bg-gradient-to-r from-blue-400 to-green-400">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800`}>
            {route.tripType === 'cycling' ? '🚴‍♂️ Cycling' : '🥾 Trekking'}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {difficulty}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white text-lg font-semibold truncate">
            {route.routeName}
          </h3>
          <div className="flex items-center text-white text-sm opacity-90">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {route.city}, {route.country}
          </div>
        </div>
      </div>

      {/* Route Details */}
      <div className="p-4 space-y-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-semibold text-gray-800">{route.duration}</div>
            <div className="text-gray-500">day{route.duration > 1 ? 's' : ''}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">{route.routeData.totalDistance}</div>
            <div className="text-gray-500">km total</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">{avgDailyDistance}</div>
            <div className="text-gray-500">km/day</div>
          </div>
        </div>

        {/* Description Preview */}
        <p className="text-gray-600 text-sm line-clamp-2">
          {route.routeData.description}
        </p>

        {/* Creation Date */}
        <div className="flex items-center text-xs text-gray-500">
          <ClockIcon className="h-3 w-3 mr-1" />
          Created {formatDistanceToNow(new Date(route.createdAt), { addSuffix: true })}
        </div>

        {/* Daily Segments Preview */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700">Daily segments:</div>
          <div className="flex flex-wrap gap-1">
            {route.routeData.dailySegments.slice(0, 3).map((segment) => (
              <span 
                key={segment.day}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
              >
                Day {segment.day}: {segment.distance}km
              </span>
            ))}
            {route.routeData.dailySegments.length > 3 && (
              <span className="text-xs text-gray-500">
                +{route.routeData.dailySegments.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onViewDetails(route)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center"
        >
          <span>View Details & Weather</span>
          <span className="ml-2">🌤️</span>
        </button>
      </div>

      {/* Status Badge */}
      {route.approved && (
        <div className="absolute top-2 right-2">
          <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            ✓
          </div>
        </div>
      )}
    </div>
  );
}