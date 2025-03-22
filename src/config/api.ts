// Import axios properly by installing the package first
// You'll need to run: npm install axios --save
import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL || 'https://pit-scouting-backend.onrender.com';

// Create the axios instance with proper configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to handle auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Define the endpoints structure with /api prefix since it's not in baseURL
const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register'
  },
  teams: {
    list: '/api/teams',
    create: '/api/teams',
    get: (teamNumber: string | number) => `/api/teams/${teamNumber}`,
    getConfig: (isFormData: boolean = false) => ({
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
      }
    })
  },
  storage: {
    getUrl: (path: string) => {
      if (!path) return '';
      // The backend stores paths as 'uploads/filename'
      // We need to extract just the filename and construct the URL
      const filename = path.split('/').pop();
      return `${BASE_URL}/api/storage/${filename}`;
    }
  }
} as const;

export { api as default, endpoints }; 