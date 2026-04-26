'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface RouteFormData {
  country: string;
  city: string;
  tripType: 'cycling' | 'trekking';
  duration: number;
}

interface RouteFormProps {
  onSubmit: (data: RouteFormData) => void;
  isLoading: boolean;
  initialType?: 'cycling' | 'trekking' | null;
}

export default function RouteForm({ onSubmit, isLoading, initialType }: RouteFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RouteFormData>({
    defaultValues: {
      tripType: initialType || 'cycling',
      duration: 2
    }
  });

  const tripType = watch('tripType');

  useEffect(() => {
    if (initialType) {
      setValue('tripType', initialType);
    }
  }, [initialType, setValue]);

  const handleFormSubmit = (data: RouteFormData) => {
    onSubmit(data);
  };

  // Get duration constraints based on trip type
  const getDurationConstraints = () => {
    if (tripType === 'cycling') {
      return { min: 2, max: 3, default: 2 };
    } else {
      return { min: 1, max: 3, default: 1 };
    }
  };

  const constraints = getDurationConstraints();

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Plan Your Route
      </h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="route-form">
        {/* Country/City Selection */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country/Region
          </label>
          <input
            {...register('country', {
              required: 'Country is required',
              minLength: { value: 2, message: 'Country name too short' }
            })}
            type="text"
            className="input-field"
            placeholder="e.g., Israel, France, Italy..."
          />
          {errors.country && (
            <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            Starting City
          </label>
          <input
            {...register('city', {
              required: 'City is required',
              minLength: { value: 2, message: 'City name too short' }
            })}
            type="text"
            className="input-field"
            placeholder="e.g., Tel Aviv, Paris, Rome..."
          />
          {errors.city && (
            <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
          )}
        </div>

        {/* Trip Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trip Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`cursor-pointer border-2 rounded-lg p-4 transition duration-200 ${tripType === 'cycling' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <input
                {...register('tripType')}
                type="radio"
                value="cycling"
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-3xl mb-2">🚴‍♂️</div>
                <div className="font-semibold">Cycling</div>
                <div className="text-sm text-gray-500">30-70 km/day</div>
              </div>
            </label>

            <label className={`cursor-pointer border-2 rounded-lg p-4 transition duration-200 ${tripType === 'trekking' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <input
                {...register('tripType')}
                type="radio"
                value="trekking"
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-3xl mb-2">🥾</div>
                <div className="font-semibold">Trekking</div>
                <div className="text-sm text-gray-500">5-10 km/day</div>
              </div>
            </label>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (days)
          </label>
          <select
            {...register('duration', {
              required: 'Duration is required',
              min: { value: constraints.min, message: `Minimum ${constraints.min} days` },
              max: { value: constraints.max, message: `Maximum ${constraints.max} days` }
            })}
            className="input-field"
          >
            {Array.from({ length: constraints.max - constraints.min + 1 }, (_, i) => {
              const value = constraints.min + i;
              return (
                <option key={value} value={value}>
                  {value} {value === 1 ? 'day' : 'days'}
                </option>
              );
            })}
          </select>
          {errors.duration && (
            <p className="text-red-600 text-sm mt-1">{errors.duration.message}</p>
          )}
        </div>

        {/* Trip Type Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            {tripType === 'cycling' ? '🚴‍♂️ Cycling Route Info' : '🥾 Trekking Route Info'}
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {tripType === 'cycling' ? (
              <>
                <li>• City-to-city routes on roads and bike paths</li>
                <li>• Daily distance: 30-70 kilometers</li>
                <li>• Duration: 2-3 consecutive days</li>
                <li>• Real road routing (no straight lines)</li>
              </>
            ) : (
              <>
                <li>• Circular routes starting and ending at same point</li>
                <li>• Daily distance: 5-10 kilometers</li>
                <li>• Duration: 1-3 days</li>
                <li>• Trail and hiking path routing</li>
              </>
            )}
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-200 ${isLoading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="loading-spinner mr-2"></div>
              Generating Route with AI...
            </div>
          ) : (
            <>
              🤖 Generate Route with AI
            </>
          )}
        </button>
      </form>

      {/* AI Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
          <span className="text-blue-600 text-lg mr-2">🤖</span>
          <h4 className="font-semibold text-blue-800">AI-Powered Route Generation</h4>
        </div>
        <p className="text-sm text-blue-700">
          Our advanced AI analyzes your preferences and generates optimal routes with real paths, weather forecasts, and destination imagery.
        </p>
      </div>
    </div>
  );
}
