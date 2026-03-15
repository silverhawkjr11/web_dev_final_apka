import axios from 'axios';
import toast from 'react-hot-toast';

// Configure API client
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// API functions
export const api = {
  // Authentication
  auth: {
    register: async (userData: { username: string; email: string; password: string }) => {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    },
    
    login: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    
    refreshToken: async (refreshToken: string) => {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      return response.data;
    },
    
    verifyToken: async () => {
      const response = await apiClient.get('/auth/verify');
      return response.data;
    }
  },

  // Routes
  routes: {
    create: async (routeData: any) => {
      const response = await apiClient.post('/routes', routeData);
      return response.data;
    },
    
    getAll: async () => {
      const response = await apiClient.get('/routes');
      return response.data;
    },
    
    getById: async (id: string) => {
      const response = await apiClient.get(`/routes/${id}`);
      return response.data;
    },
    
    approve: async (id: string) => {
      const response = await apiClient.patch(`/routes/${id}/approve`);
      return response.data;
    }
  },

  // External APIs (for future real implementation)
  external: {
    generateRoute: async (params: any) => {
      // This would call OpenAI API in real implementation
      // For now, return mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            route: {
              coordinates: [], // Generated coordinates
              description: 'AI-generated route description'
            }
          });
        }, 2000);
      });
    },
    
    getWeather: async (coordinates: [number, number]) => {
      // This would call OpenWeatherMap API in real implementation
      // For now, return mock data
      return {
        location: 'Route Location',
        forecast: [
          { day: 'Tomorrow', temp: '22°C', condition: 'Sunny', icon: '☀️' },
          { day: 'Day 2', temp: '25°C', condition: 'Partly Cloudy', icon: '⛅' },
          { day: 'Day 3', temp: '20°C', condition: 'Cloudy', icon: '☁️' }
        ]
      };
    },
    
    getCountryImage: async (country: string) => {
      // This would call Unsplash API in real implementation
      return `https://images.unsplash.com/search/photos?query=${encodeURIComponent(country + ' landscape')}&w=600&h=400`;
    }
  }
};

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      toast.error(message);
    } else if (error.request) {
      toast.error('Network error - please check your connection');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default api;