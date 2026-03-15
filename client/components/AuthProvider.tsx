'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
axios.defaults.baseURL = API_URL;

// Add auth header to all requests
axios.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 responses
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          Cookies.set('accessToken', accessToken, { expires: 1 });
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
          
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data;
      
      setUser(userData);
      Cookies.set('accessToken', accessToken, { expires: 1 });
      Cookies.set('refreshToken', refreshToken, { expires: 7 });
      
      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Registration attempt:', { username, email });
      console.log('🌐 API Base URL:', API_URL);
      console.log('🌐 Full URL will be:', `${API_URL}/auth/register`);
      
      const response = await axios.post('/auth/register', { username, email, password });
      console.log('✅ Registration response:', response.data);
      
      const { user: userData, accessToken, refreshToken } = response.data;
      
      setUser(userData);
      Cookies.set('accessToken', accessToken, { expires: 1 });
      Cookies.set('refreshToken', refreshToken, { expires: 7 });
      
      toast.success('Registration successful!');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error config:', error.config);
      
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = Cookies.get('refreshToken');
      if (!refreshTokenValue) return false;

      const response = await axios.post('/auth/refresh', { refreshToken: refreshTokenValue });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      Cookies.set('accessToken', accessToken, { expires: 1 });
      Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
      
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      const token = Cookies.get('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get('/auth/verify');
      setUser(response.data.user);
    } catch (error: any) {
      // If verification fails, try to refresh the token
      if (error.response?.status === 403 || error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          // Try verification again after refresh
          try {
            const response = await axios.get('/auth/verify');
            setUser(response.data.user);
          } catch (verifyError) {
            logout();
          }
        }
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-refresh token every 14 minutes (tokens expire in 15 minutes)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        refreshToken();
      }, 14 * 60 * 1000); // 14 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}