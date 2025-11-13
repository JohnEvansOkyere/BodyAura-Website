// frontend/src/services/api.ts

import axios, { AxiosError, AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    // Handle different error statuses
    if (error.response) {
      const { status, data, config } = error.response;
      
      // Don't show toast for auth endpoints - let the component handle it
      const isAuthEndpoint = config?.url?.includes('/api/auth/login') || 
                             config?.url?.includes('/api/auth/signup');

      switch (status) {
        case 401:
          // Only auto-logout if NOT on login/signup page
          if (!isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          }
          break;
        
        case 403:
          if (!isAuthEndpoint) {
            toast.error('Access denied. You don\'t have permission.');
          }
          break;
        
        case 404:
          if (!isAuthEndpoint) {
            toast.error(data?.detail || 'Resource not found.');
          }
          break;
        
        case 422:
          // Validation errors - don't show toast, let component handle it
          break;
        
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        
        default:
          if (!isAuthEndpoint && status >= 400) {
            toast.error(data?.detail || 'An error occurred. Please try again.');
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;