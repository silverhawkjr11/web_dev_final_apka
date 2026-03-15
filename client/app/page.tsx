'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPinIcon, CalendarIcon, CameraIcon, CloudIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl text-white">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-6">
            מסלול טיולים אפקה 2026
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Plan your perfect cycling and trekking adventures with AI-powered route suggestions, real-time weather data, and interactive maps
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/planning" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition duration-200 text-lg shadow-lg"
            >
              🗺️ Plan New Route
            </Link>
            <Link 
              href="/history" 
              className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-400 transition duration-200 text-lg border-2 border-white/30"
            >
              📚 View Route History
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            What Makes Our Platform Special?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced AI-powered route planning with comprehensive weather integration and beautiful visualizations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPinIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Route Planning</h3>
            <p className="text-gray-600">
              Smart route generation powered by Advanced LLM models for optimal cycling and trekking experiences
            </p>
          </div>

          <div className="card text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CloudIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real Weather Data</h3>
            <p className="text-gray-600">
              3-day weather forecasts for your routes, assuming you start tomorrow
            </p>
          </div>

          <div className="card text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CameraIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Country Images</h3>
            <p className="text-gray-600">
              Beautiful destination imagery, both real and AI-generated to inspire your journey
            </p>
          </div>

          <div className="card text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Route History</h3>
            <p className="text-gray-600">
              Save, manage and revisit your favorite routes with updated weather data
            </p>
          </div>
        </div>
      </section>

      {/* Route Types Section */}
      <section className="py-12 bg-white rounded-2xl shadow-sm">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Choose Your Adventure
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <div className="text-5xl mb-4">🚴‍♂️</div>
              <h3 className="text-2xl font-bold text-blue-800 mb-4">Cycling Routes</h3>
              <ul className="text-left space-y-2 text-gray-700 mb-6">
                <li>• 2-3 day consecutive routes</li>
                <li>• City-to-city navigation</li>
                <li>• 30-70 km daily distances</li>
                <li>• Real road and bike path routing</li>
              </ul>
              <Link 
                href="/planning?type=cycling" 
                className="btn-primary inline-block"
              >
                Plan Cycling Route
              </Link>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <div className="text-5xl mb-4">🥾</div>
              <h3 className="text-2xl font-bold text-green-800 mb-4">Trekking Routes</h3>
              <ul className="text-left space-y-2 text-gray-700 mb-6">
                <li>• 1-3 circular routes</li>
                <li>• Start and end at same point</li>
                <li>• 5-10 km daily distances</li>
                <li>• Trail and hiking path routing</li>
              </ul>
              <Link 
                href="/planning?type=trekking" 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out inline-block"
              >
                Plan Trekking Route
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of adventurers who trust our platform for their route planning
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition duration-200 text-lg shadow-lg"
            >
              Create Account
            </Link>
            <Link 
              href="/login" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition duration-200 text-lg border-2 border-blue-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}