'use client';

interface WeatherData {
  location: string;
  forecast: Array<{
    day: string;
    temp: string;
    condition: string;
    icon: string;
  }>;
}

interface WeatherWidgetProps {
  weatherData: WeatherData;
}

export default function WeatherWidget({ weatherData }: WeatherWidgetProps) {
  return (
    <div className="weather-widget">
      <div className="flex items-center mb-4">
        <span className="text-blue-600 text-xl mr-2">🌤️</span>
        <h3 className="text-lg font-semibold text-blue-800">
          3-Day Weather Forecast
        </h3>
      </div>

      <div className="text-sm text-blue-700 mb-4">
        Weather forecast for your route starting tomorrow
      </div>

      <div className="grid grid-cols-3 gap-3">
        {weatherData.forecast.map((day, index) => (
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

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Weather conditions can change. Check the forecast again before starting your journey tomorrow!
        </div>
      </div>
    </div>
  );
}
