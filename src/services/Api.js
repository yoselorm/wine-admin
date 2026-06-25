import axios from 'axios';
import { api_url } from '../utils/config';

const api = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Automatically attach the token to every outgoing request
api.interceptors.request.use(
  (config) => {
    // Parsing the token out of the centralized 'admin_data' object
    const adminDataString = localStorage.getItem('admin_data');
    if (adminDataString) {
      try {
        const adminData = JSON.parse(adminDataString);
        if (adminData && adminData.token) {
          config.headers.Authorization = `Bearer ${adminData.token}`;
        }
      } catch (e) {
        console.error("Error parsing admin_data from localStorage", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle Global Errors (Like Session Expirations)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is expired, invalid, or blacklisted on the backend
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_data');
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default api;