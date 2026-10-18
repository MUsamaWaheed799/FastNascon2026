import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach DRF Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nascon_token');
      if (token && config.headers) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handling & Error normalization
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthPage = window.location.pathname.startsWith('/auth');
        if (!isAuthPage) {
          localStorage.removeItem('nascon_token');
          localStorage.removeItem('nascon_user');
          window.location.href = '/auth/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper to format DRF errors nicely for toast & UI display
export function formatApiError(error: any): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data) {
      if (typeof data === 'string') return data;
      if (data.detail) return data.detail;
      if (data.non_field_errors) {
        return Array.isArray(data.non_field_errors)
          ? data.non_field_errors.join(' ')
          : String(data.non_field_errors);
      }
      // Field level errors
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        const valStr = Array.isArray(val) ? val.join(' ') : typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `${firstKey}: ${valStr}`;
      }
    }
    if (error.message) return error.message;
  }
  return 'An unexpected network error occurred. Please check your backend connection.';
}
