import axios from 'axios';
import { API_URL } from './config';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Envía cookies automáticamente
});

// Interceptor para añadir token CSRF
axiosInstance.interceptors.request.use((config) => {
  const csrfToken = Cookies.get('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});


axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    
    return Promise.reject(error);
  }
);

export default axiosInstance;