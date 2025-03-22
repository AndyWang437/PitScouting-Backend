"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoints = exports.default = exports.BASE_URL = void 0;
// Import axios properly by installing the package first
// You'll need to run: npm install axios --save
const axios_1 = __importDefault(require("axios"));
exports.BASE_URL = process.env.REACT_APP_API_URL || 'https://pit-scouting-backend.onrender.com';
// Create the axios instance with proper configuration
const api = axios_1.default.create({
    baseURL: exports.BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});
exports.default = api;
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
        get: (teamNumber) => `/api/teams/${teamNumber}`,
        getConfig: (isFormData = false) => ({
            headers: {
                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
                ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
            }
        })
    },
    storage: {
        getUrl: (path) => {
            if (!path)
                return '';
            // The backend stores paths as 'uploads/filename'
            // We need to extract just the filename and construct the URL
            const filename = path.split('/').pop();
            return `${exports.BASE_URL}/api/storage/${filename}`;
        }
    }
};
exports.endpoints = endpoints;
