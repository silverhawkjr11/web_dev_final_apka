'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RouteForm from '@/components/RouteForm';
import RouteMap from '@/components/RouteMap';
import RouteDetails from '@/components/RouteDetails';
import WeatherWidget from '@/components/WeatherWidget';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import axios from 'axios';

// Geocoding service using OpenStreetMap Nominatim API (free, no API key needed)
const geocodeCity = async (city: string, country: string): Promise<[number, number] | null> => {
  try {
    console.log(`🌍 Geocoding: ${city}, ${country}`);
    const query = encodeURIComponent(`${city}, ${country}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      console.log(`✅ Geocoded ${city}: [${lat}, ${lng}]`);
      return [lat, lng];
    }
    
    console.warn(`⚠️ No coordinates found for ${city}, ${country}`);
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error for ${city}, ${country}:`, error);
    return null;
  }
};

// Find a real nearby town/city using Nominatim within a sensible radius
const findNearbyCity = async (
  lat: number,
  lng: number,
  tripType: string,
  dayIndex: number
): Promise<{ lat: number; lng: number; name: string } | null> => {
  const targetDeg = tripType === 'cycling' ? 0.4 : 0.08;
  const delta = targetDeg * 2;
  const viewbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;

  const trySearch = async (q: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}&viewbox=${viewbox}&bounded=1&limit=20`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return res.ok ? res.json() : [];
  };

  try {
    let places = await trySearch('town');
    if (!places.length) places = await trySearch('city');
    if (!places.length) return null;

    const suitable = places.filter((p: any) => {
      const d = Math.sqrt(
        Math.pow(parseFloat(p.lat) - lat, 2) + Math.pow(parseFloat(p.lon) - lng, 2)
      );
      return d > targetDeg * 0.15;
    });

    const list = suitable.length ? suitable : places;
    const pick = list[dayIndex % list.length];
    return {
      lat: parseFloat(pick.lat),
      lng: parseFloat(pick.lon),
      name: pick.display_name.split(',')[0].trim()
    };
  } catch {
    return null;
  }
};

interface WeatherData {
  location: string;
  forecast: Array<{
    day: string;
    temp: string;
    condition: string;
    icon: string;
    humidity?: string;
    windSpeed?: string;
    feelsLike?: string;
  }>;
}

interface RouteData {
  routeName: string;
  country: string;
  city: string;
  tripType: 'cycling' | 'trekking';
  duration: number;
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
  totalDistance: number;
  description: string;
  countryImage: string;
}

export default function PlanningPage() {
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') as 'cycling' | 'trekking' | null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to access route planning');
      return;
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Authentication Required
        </h2>
        <p className="text-gray-600">
          Please sign in to access the route planning feature.
        </p>
      </div>
    );
  }

  const handleRouteGeneration = async (formData: any) => {
    setIsGenerating(true);
    
    try {
      // Generate route using AI/LLM
      const routeData = await generateRouteWithAI(formData);
      setCurrentRoute(routeData);
      
      // Fetch weather data for the route
      const firstCoordinate = routeData.coordinates && routeData.coordinates.length > 0 
        ? routeData.coordinates[0] 
        : [routeData.dailySegments[0]?.startPoint.lat || 0, routeData.dailySegments[0]?.startPoint.lng || 0];
      const weather = await fetchWeatherData(firstCoordinate);
      setWeatherData(weather);
      
      toast.success('Route generated successfully!');
      setShowApproveDialog(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate route');
    } finally {
      setIsGenerating(false);
    }
  };

  // Optimize route data for storage by reducing waypoint density
  const optimizeRouteForStorage = (routeData: RouteData): RouteData => {
    console.log('🎯 Optimizing route data for storage...');
    console.log('🎯 Original total coordinates:', routeData.coordinates.length);
    
    const optimizedSegments = routeData.dailySegments.map((segment, index) => {
      const originalWaypoints = segment.waypoints.length;
      
      // Keep every 5th waypoint for storage (still shows route accurately)
      const sampledWaypoints = segment.waypoints.filter((_, idx) => {
        return idx === 0 || idx === segment.waypoints.length - 1 || idx % 5 === 0;
      });
      
      console.log(`🎯 Day ${index + 1}: ${originalWaypoints} → ${sampledWaypoints.length} waypoints`);
      
      return {
        ...segment,
        waypoints: sampledWaypoints
      };
    });
    
    // Also optimize main coordinates array
    const optimizedCoordinates = routeData.coordinates.filter((_, idx) => {
      return idx === 0 || idx === routeData.coordinates.length - 1 || idx % 5 === 0;
    });
    
    console.log('🎯 Optimized total coordinates:', optimizedCoordinates.length);
    
    return {
      ...routeData,
      coordinates: optimizedCoordinates,
      dailySegments: optimizedSegments
    };
  };

  const handleApproveRoute = async () => {
    if (!currentRoute) return;

    try {
      console.log('💾 Attempting to save route...');
      console.log('💾 Route data:', {
        routeName: currentRoute.routeName,
        country: currentRoute.country,
        city: currentRoute.city,
        tripType: currentRoute.tripType,
        duration: currentRoute.duration
      });

      // Optimize route data to reduce payload size
      const optimizedRoute = optimizeRouteForStorage(currentRoute);

      // Use axios which already has auth headers configured
      const response = await axios.post('/routes', {
        routeName: optimizedRoute.routeName,
        country: optimizedRoute.country,
        city: optimizedRoute.city,
        tripType: optimizedRoute.tripType,
        duration: optimizedRoute.duration,
        routeData: {
          coordinates: optimizedRoute.coordinates,
          dailySegments: optimizedRoute.dailySegments,
          totalDistance: optimizedRoute.totalDistance,
          description: optimizedRoute.description,
          countryImage: optimizedRoute.countryImage
        },
        weatherData,
        approved: true
      });

      console.log('✅ Route saved successfully:', response.data);
      toast.success('Route approved and saved!');
      setShowApproveDialog(false);
    } catch (error: any) {
      console.error('❌ Save route error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save route';
      toast.error(errorMessage);
    }
  };

  // Function to decode polyline string (used by OpenRouteService and Google Maps)
  const decodePolyline = (encoded: string): number[][] => {
    console.log('🔓 Starting polyline decode for string length:', encoded.length);
    const coordinates: number[][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    try {
      while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte;

        // Decode latitude
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);

        const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += deltaLat;

        shift = 0;
        result = 0;

        // Decode longitude
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);

        const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += deltaLng;

        // Convert from encoded units to decimal degrees
        coordinates.push([lat / 1e5, lng / 1e5]);
      }

      console.log('🔓 Decode complete. Points:', coordinates.length);
      if (coordinates.length > 0) {
        console.log('🔓 First point:', coordinates[0]);
        console.log('🔓 Last point:', coordinates[coordinates.length - 1]);
      }

      return coordinates;
    } catch (error) {
      console.log('❌ Polyline decode error:', error);
      return [];
    }
  };

  // Function to get real road routes using our Next.js API route (no CORS issues)
  const getRealRouteCoordinates = async (
    startPoint: { lat: number; lng: number; name: string },
    endPoint: { lat: number; lng: number; name: string },
    tripType: string
  ): Promise<number[][]> => {
    console.log(`� NEW CODE RUNNING! Getting route from ${startPoint.name} to ${endPoint.name} (${tripType})`);
    console.log(`�🛣️ Getting route from ${startPoint.name} to ${endPoint.name} (${tripType})`);
    
    try {
      console.log(`📡 Calling OSRM (free navigation API)`);
      
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startPoint,
          endPoint,
          tripType
        })
      });

      console.log(`📡 API Response Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const data = result.data;
          console.log('✅ Got real route data from OSRM!');
          console.log('📋 API Response structure:', JSON.stringify(data, null, 2).substring(0, 1000) + '...');
          
          if (data.routes && data.routes[0]) {
            console.log('🔍 Route keys:', Object.keys(data.routes[0]));
            console.log('🗺️ Route distance:', data.routes[0].distance, 'meters');
            console.log('🗺️ Route duration:', data.routes[0].duration, 'seconds');
            
            if (data.routes[0].geometry) {
              console.log('🗺️ Found geometry!', data.routes[0].geometry.substring(0, 100) + '...');
            }
          }
          
          // Handle OSRM response structure
          let routeCoordinates = null;
          
          if (data.routes && data.routes[0] && data.routes[0].geometry) {
            // OSRM geojson geometry: coordinates are [lng, lat] — flip to [lat, lng] for Leaflet
            const geojsonCoords: number[][] = data.routes[0].geometry.coordinates;
            console.log(`🗺️ Got ${geojsonCoords.length} coordinate points from OSRM GeoJSON`);
            routeCoordinates = geojsonCoords.map((c: number[]) => [c[1], c[0]]);
            console.log('🗺️ First coord:', routeCoordinates[0]);
            console.log('🗺️ Last coord:', routeCoordinates[routeCoordinates.length - 1]);
          }
          
          if (routeCoordinates && Array.isArray(routeCoordinates) && routeCoordinates.length > 0) {
            console.log(`🗺️ Route has ${routeCoordinates.length} real road points from OSRM`);
            console.log('🗺️ Sample coordinates:', routeCoordinates.slice(0, 3));
            return routeCoordinates;
          } else {
            console.log('❌ No valid coordinates found in OSRM response');
            console.log('❌ RouteCoordinates value:', routeCoordinates);
          }
        } else {
          console.log(`❌ API returned error: ${result.error}`);
        }
      } else {
        const errorResult = await response.json();
        console.log(`❌ OSRM API Error: ${response.status} - ${errorResult.error}`);
      }
    } catch (error) {
      console.log(`❌ Navigation API Error: ${error}`);
    }

    // Enhanced REALISTIC CURVED algorithm (backup when OSRM fails)
    console.log('⚠️ OSRM failed - using enhanced realistic route algorithm as backup');
    const coordinates = [];
    const steps = tripType === 'cycling' ? 50 : 30; // More points for smoother curves
    
    // Calculate distance and direction for realistic path planning
    const totalDistance = Math.sqrt(
      Math.pow(endPoint.lat - startPoint.lat, 2) + 
      Math.pow(endPoint.lng - startPoint.lng, 2)
    );
    
    // Add intermediate waypoints for more realistic routing
    const waypoints = [startPoint];
    
    // Add 2-4 intermediate cities/towns for longer routes
    if (totalDistance > 0.5) { // For longer routes
      const numWaypoints = Math.min(4, Math.floor(totalDistance / 0.2));
      
      for (let w = 1; w < numWaypoints; w++) {
        const progress = w / numWaypoints;
        const baseProgress = progress + (Math.random() - 0.5) * 0.3; // Add randomness
        
        const intermediateLat = startPoint.lat + (endPoint.lat - startPoint.lat) * baseProgress;
        const intermediateLng = startPoint.lng + (endPoint.lng - startPoint.lng) * baseProgress;
        
        // Offset to simulate road detours around obstacles
        const roadOffset = (Math.random() - 0.5) * 0.1; // Larger offset for realism
        const terrainOffset = (Math.random() - 0.5) * 0.08;
        
        waypoints.push({
          lat: intermediateLat + roadOffset,
          lng: intermediateLng + terrainOffset,
          name: `Via Point ${w}`
        });
      }
    }
    
    waypoints.push(endPoint);
    
    // Create smooth curved sections between waypoints
    for (let w = 0; w < waypoints.length - 1; w++) {
      const segmentStart = waypoints[w];
      const segmentEnd = waypoints[w + 1];
      const segmentSteps = Math.floor(steps / (waypoints.length - 1));
      
      for (let i = 0; i < segmentSteps; i++) {
        const progress = i / segmentSteps;
        
        let lat, lng;
        if (tripType === 'cycling') {
          // Cycling: Follow road patterns with gentle curves
          const roadCurve = Math.sin(progress * Math.PI * 2.5) * 0.008; // Road bends
          const roadVariation = Math.sin(progress * Math.PI * 6) * 0.003; // Small variations
          const roadDetour = Math.cos(progress * Math.PI * 1.5) * 0.012; // Detours around obstacles
          const urbanSpread = Math.sin(progress * Math.PI * 4) * 0.005; // City route variations
          
          lat = segmentStart.lat + (segmentEnd.lat - segmentStart.lat) * progress + roadCurve + roadVariation;
          lng = segmentStart.lng + (segmentEnd.lng - segmentStart.lng) * progress + roadDetour + urbanSpread;
        } else {
          // Trekking: Follow natural terrain with winding paths
          const trailWind = Math.sin(progress * Math.PI * 4) * 0.015; // Winding mountain trail
          const elevation = Math.cos(progress * Math.PI * 3) * 0.012; // Elevation changes
          const naturalPath = Math.sin(progress * Math.PI * 8) * 0.008; // Natural path variations
          const terrainFollowing = Math.cos(progress * Math.PI * 5) * 0.010; // Following ridges/valleys
          
          lat = segmentStart.lat + (segmentEnd.lat - segmentStart.lat) * progress + trailWind + elevation;
          lng = segmentStart.lng + (segmentEnd.lng - segmentStart.lng) * progress + naturalPath + terrainFollowing;
        }
        
        coordinates.push([lat, lng]);
      }
    }
    
    // Ensure we end exactly at the destination
    coordinates.push([endPoint.lat, endPoint.lng]);
    
    console.log(`🔄 Generated ${coordinates.length} realistic curved route points`);
    console.log(`🎯 First few waypoints:`, coordinates.slice(0, 5));
    console.log(`🎯 Last few waypoints:`, coordinates.slice(-5));
    console.log(`🗺️ Total waypoints: ${waypoints.length}, Route segments: ${coordinates.length}`);
    return coordinates;
  };

  const generateRouteWithAI = async (formData: any): Promise<RouteData> => {
    const { country, city, tripType, duration } = formData;
    
    // Helper function to get country-specific images
    const getCountryImage = (countryName: string): string => {
      const countryImages: Record<string, string> = {
        france: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&h=400&fit=crop', // Eiffel Tower
        spain: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop', // Spanish architecture
        italy: 'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?w=600&h=400&fit=crop', // Italian countryside
        germany: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=400&fit=crop', // German castle
        greece: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop', // Greek islands
        portugal: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop', // Portuguese coastline
        netherlands: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop', // Dutch tulips
        switzerland: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', // Swiss mountains
        austria: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', // Alpine scenery
        uk: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop', // London
        'united kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop',
        england: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop'
      };
      
      const defaultImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop'; // Generic landscape
      return countryImages[countryName.toLowerCase()] || defaultImage;
    };
    
    // Try real OpenAI API first, fallback to enhanced mock data
    try {
      if (process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your-openai-api-key') {
        console.log('🤖 Using real OpenAI API for route generation');
        
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true
        });

        const prompt = `Create a detailed ${duration}-day ${tripType} route in ${country}, starting from ${city}.

Route Requirements:
- Trip Type: ${tripType === 'cycling' ? 'Cycling (30-70km per day, city-to-city)' : 'Trekking (5-10km per day, circular route)'}
- Duration: ${duration} days
- Starting point: ${city}, ${country}

Please provide ONLY a JSON response with this exact structure:
{
  "cities": ["City1", "City2", "City3"],
  "dailyDistances": [45, 38, 42],
  "description": "Detailed route description with cultural highlights and scenery",
  "totalDistance": 125,
  "routeHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
}

Make it realistic with actual cities in ${country}.`;

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        });

        const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
        
        // Convert AI response to our route format
        const coordinates: number[][] = [];
        const dailySegments: Array<{
          day: number;
          distance: number;
          startPoint: { lat: number; lng: number; name: string };
          endPoint: { lat: number; lng: number; name: string };
          waypoints: number[][];
        }> = [];
        
        // Get real coordinates for the starting city using geocoding API
        console.log(`🌍 Getting coordinates for ${city}, ${country}...`);
        const startCoords = await geocodeCity(city, country);
        
        if (!startCoords) {
          throw new Error(`Could not find coordinates for ${city}, ${country}`);
        }
        
        console.log(`📍 Starting coordinates: [${startCoords[0]}, ${startCoords[1]}]`);
        
        for (let day = 0; day < duration; day++) {
          const cityName = aiResponse.cities?.[day] || `Day ${day + 1} Destination`;
          const distance = aiResponse.dailyDistances?.[day] || (tripType === 'cycling' ? 45 : 8);
          
          const startPoint = day === 0 ? 
            { lat: startCoords[0], lng: startCoords[1], name: `${city} Center` } :
            dailySegments[day - 1].endPoint;
          
          // Geocode the AI-suggested city name for a real endpoint
          const cityCoords = await geocodeCity(cityName, country);
          const endPoint = cityCoords
            ? { lat: cityCoords[0], lng: cityCoords[1], name: cityName }
            : (await findNearbyCity(startCoords[0], startCoords[1], tripType, day)) ||
              { lat: startCoords[0] + 0.3, lng: startCoords[1], name: cityName };
          
          // Get real road route using OpenRouteService API
          const aiDayCoordinates = await getRealRouteCoordinates(
            startPoint, 
            endPoint, 
            tripType
          );
          
          dailySegments.push({
            day: day + 1,
            distance,
            startPoint,
            endPoint,
            waypoints: aiDayCoordinates
          });
          
          console.log(`🗺️ Day ${day + 1} waypoints (${aiDayCoordinates.length} points):`, aiDayCoordinates.slice(0, 3), '...', aiDayCoordinates.slice(-2));
          coordinates.push(...aiDayCoordinates);
        }
        
        return {
          routeName: `🤖 AI-Generated ${country} ${duration}-Day ${tripType} Adventure`,
          country,
          city,
          tripType,
          duration,
          coordinates,
          dailySegments,
          totalDistance: aiResponse.totalDistance || dailySegments.reduce((sum, seg) => sum + seg.distance, 0),
          description: aiResponse.description || `AI-powered ${duration}-day ${tripType} adventure through ${country}.`,
          countryImage: getCountryImage(country)
        };
      }
    } catch (error) {
      console.warn('🔄 OpenAI API failed, using enhanced fallback:', error);
    }
    
    // Enhanced fallback with realistic data using geocoding
    console.log('📍 Using enhanced mock data with geocoding API');
    
    // Get real coordinates for the starting city using geocoding API
    console.log(`🌍 Getting fallback coordinates for ${city}, ${country}...`);
    const startCoords = await geocodeCity(city, country);
    
    if (!startCoords) {
      // Ultimate fallback to a default location if geocoding fails
      console.warn(`⚠️ Geocoding failed for ${city}, ${country}. Using default coordinates.`);
      const defaultCoords: [number, number] = [46.2044, 6.1432]; // Geneva, Switzerland (central Europe)
      console.log(`📍 Using default coordinates: [${defaultCoords[0]}, ${defaultCoords[1]}]`);
      
      return {
        routeName: `🗺️ ${country} ${duration}-Day ${tripType} Adventure`,
        country,
        city,
        tripType,
        duration,
        coordinates: [[defaultCoords[0], defaultCoords[1]]],
        dailySegments: [{
          day: 1,
          distance: tripType === 'cycling' ? 35 : 8,
          startPoint: { lat: defaultCoords[0], lng: defaultCoords[1], name: `${city} Center` },
          endPoint: { lat: defaultCoords[0] + 0.1, lng: defaultCoords[1] + 0.1, name: 'Destination' },
          waypoints: []
        }],
        totalDistance: tripType === 'cycling' ? 35 : 8,
        description: `${duration}-day ${tripType} adventure in ${country}. Note: Could not find exact coordinates for ${city}.`,
        countryImage: getCountryImage(country)
      };
    }
    
    console.log(`📍 Fallback coordinates for ${city}: [${startCoords[0]}, ${startCoords[1]}]`);
    
    const isCycling = tripType === 'cycling';
    const dailyDistance = isCycling ? 
      Math.floor(Math.random() * 40) + 30 : 
      Math.floor(Math.random() * 5) + 5;
    
    const coordinates: number[][] = [];
    const dailySegments: Array<{
      day: number;
      distance: number;
      startPoint: { lat: number; lng: number; name: string };
      endPoint: { lat: number; lng: number; name: string };
      waypoints: number[][];
    }> = [];
    
    for (let day = 0; day < duration; day++) {
      const startPoint = day === 0 ? 
        { lat: startCoords[0], lng: startCoords[1], name: `${city} Center` } :
        dailySegments[day - 1].endPoint;
      
      console.log(`🗓️ Day ${day + 1} start point:`, startPoint);

      // For trekking last day: return to start
      const isLastTrekkingDay = !isCycling && day === duration - 1;
      let endPoint: { lat: number; lng: number; name: string };

      if (isLastTrekkingDay) {
        endPoint = { lat: startCoords[0], lng: startCoords[1], name: `${city} Center` };
      } else {
        const nearby = await findNearbyCity(startCoords[0], startCoords[1], tripType, day);
        if (nearby) {
          endPoint = nearby;
        } else {
          const dir = (day / Math.max(duration - 1, 1)) * Math.PI;
          const dist = isCycling ? 0.4 : 0.07;
          endPoint = {
            lat: startCoords[0] + Math.cos(dir) * dist,
            lng: startCoords[1] + Math.sin(dir) * dist,
            name: `${city} - Day ${day + 1}`
          };
        }
      }
      
      // Get real road route using OpenRouteService API  
      const dayCoordinates = await getRealRouteCoordinates(
        startPoint,
        endPoint, 
        tripType
      );
      
      coordinates.push(...dayCoordinates);
      
      console.log(`🗺️ Fallback Day ${day + 1} waypoints (${dayCoordinates.length} points):`, dayCoordinates.slice(0, 3), '...', dayCoordinates.slice(-2));
      
      dailySegments.push({
        day: day + 1,
        distance: dailyDistance,
        startPoint,
        endPoint,
        waypoints: dayCoordinates
      });
    }
    
    return {
      routeName: `${tripType === 'cycling' ? '🚴‍♂️' : '🥾'} ${country} ${duration}-Day Adventure`,
      country,
      city,
      tripType,
      duration,
      coordinates,
      dailySegments,
      totalDistance: dailyDistance * duration,
      description: `A ${duration}-day ${tripType} adventure through ${country}, starting from ${city}. ${[
        isCycling ? 
        `This route takes you through scenic roads and bike paths, connecting beautiful French cities like ${dailySegments.map(s => s.endPoint.name).join(', ')}.` :
        'This circular trekking route offers beautiful trails through the countryside and returns you to your starting point.',
        `Experience the culture, cuisine, and landscapes that make ${country} a world-renowned destination.`,
        `Perfect for ${isCycling ? 'road bikes and hybrid bikes' : 'hikers of all skill levels'}.`
      ].join(' ')}`,
      countryImage: getCountryImage(country)
    };
  };

  const fetchWeatherData = async (coordinates: number[]): Promise<WeatherData> => {
    // Real OpenWeatherMap API integration
    try {
      if (process.env.NEXT_PUBLIC_WEATHER_API_KEY && process.env.NEXT_PUBLIC_WEATHER_API_KEY !== 'your-openweathermap-api-key') {
        console.log('🌤️ Using real OpenWeatherMap API for weather data');
        
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
        const lat = coordinates[0];
        const lon = coordinates[1];
        
        // Get current weather and 5-day forecast
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=24`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const weatherData = await response.json();
        
        // Process forecast data - get one forecast per day for next 3 days
        const processedForecast = [];
        const now = new Date();
        
        for (let i = 1; i <= 3; i++) {
          const targetDate = new Date(now);
          targetDate.setDate(now.getDate() + i);
          
          // Find forecast closest to noon for each day
          const dayForecast = weatherData.list.find((item: any) => {
            const forecastDate = new Date(item.dt * 1000);
            return (
              forecastDate.getDate() === targetDate.getDate() &&
              forecastDate.getMonth() === targetDate.getMonth() &&
              forecastDate.getHours() >= 12 && forecastDate.getHours() <= 15
            );
          }) || weatherData.list[i * 8 - 1]; // Fallback to approximate time
          
          if (dayForecast) {
            // Map OpenWeatherMap icons to emojis
            const getWeatherEmoji = (iconCode: string) => {
              const iconMap: Record<string, string> = {
                '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '⛅',
                '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
                '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌦️',
                '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
                '50d': '🌫️', '50n': '🌫️'
              };
              return iconMap[iconCode] || '🌤️';
            };
            
            processedForecast.push({
              day: i === 1 ? 'Tomorrow' : `Day ${i}`,
              temp: `${Math.round(dayForecast.main.temp)}°C`,
              condition: dayForecast.weather[0].description
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
              icon: getWeatherEmoji(dayForecast.weather[0].icon),
              humidity: `${dayForecast.main.humidity}%`,
              windSpeed: `${Math.round(dayForecast.wind.speed * 3.6)} km/h`, // Convert m/s to km/h
              feelsLike: `${Math.round(dayForecast.main.feels_like)}°C`
            });
          }
        }
        
        return {
          location: `${currentRoute?.city || 'Route'} Area`,
          forecast: processedForecast.length > 0 ? processedForecast : [
            { day: 'Tomorrow', temp: '22°C', condition: 'Sunny', icon: '☀️' },
            { day: 'Day 2', temp: '25°C', condition: 'Partly Cloudy', icon: '⛅' },
            { day: 'Day 3', temp: '20°C', condition: 'Cloudy', icon: '☁️' }
          ]
        };
        
      }
    } catch (error) {
      console.warn('🔄 Weather API failed, using enhanced fallback:', error);
    }
    
    // Enhanced fallback weather data
    console.log('🌤️ Using enhanced mock weather data');
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
    const icons = ['☀️', '⛅', '☁️', '🌧️', '🌤️'];
    
    return {
      location: `${currentRoute?.city || 'Route'} Area`,
      forecast: Array.from({ length: 3 }, (_, i) => {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const temp = Math.floor(Math.random() * 10) + 18; // 18-28°C
        const icon = icons[conditions.indexOf(condition)];
        
        return {
          day: i === 0 ? 'Tomorrow' : `Day ${i + 1}`,
          temp: `${temp}°C`,
          condition,
          icon
        };
      })
    };
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🗺️ Route Planning
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Plan your perfect {initialType || 'cycling or trekking'} adventure with AI-powered route suggestions and real-time weather data
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Route Form */}
        <div className="space-y-6">
          <RouteForm 
            onSubmit={handleRouteGeneration}
            isLoading={isGenerating}
            initialType={initialType}
          />
          
          {currentRoute && weatherData && (
            <WeatherWidget weatherData={weatherData} />
          )}
        </div>

        {/* Route Visualization */}
        <div className="space-y-6">
          {currentRoute ? (
            <>
              {/* Debug: Log route data being passed to map */}
              {console.log(`📊 FINAL ROUTE DATA PASSED TO MAP:`)}
              {console.log(`📊 Total coordinates: ${currentRoute.coordinates.length}`)}
              {console.log(`📊 Daily segments: ${currentRoute.dailySegments.length}`)}
              {currentRoute.dailySegments.forEach((seg, idx) => {
                console.log(`📊 Day ${seg.day}: ${seg.waypoints.length} waypoints`, seg.waypoints.slice(0, 2), '...', seg.waypoints.slice(-1));
              })}
              
              <RouteMap routeData={currentRoute} />
              <RouteDetails routeData={currentRoute} />
              
              {/* Approval Section */}
              {showApproveDialog && (
                <div className="card bg-green-50 border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">
                    ✅ Route Generated Successfully!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Review your route above. If you're satisfied with the plan, approve it to save to your route history.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleApproveRoute}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
                    >
                      ✓ Approve & Save Route
                    </button>
                    <button
                      onClick={() => {
                        setCurrentRoute(null);
                        setShowApproveDialog(false);
                        setWeatherData(null);
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
                    >
                      ✗ Generate New Route
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Plan Your Route
              </h3>
              <p className="text-gray-500">
                Fill in the form on the left to generate your personalized route with AI assistance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}