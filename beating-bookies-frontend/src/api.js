import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/', // Your backend root URL
});

const refreshToken = async () => {
  const refresh = localStorage.getItem('refreshToken');
  try {
    const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh });
    localStorage.setItem('accessToken', response.data.access);
    return response.data.access;
  } catch (err) {
    return null;
  }
};

// Add a request interceptor to include the JWT token (if available) in headers
api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor for handling token refresh
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    const newAccessToken = await refreshToken();
    if (newAccessToken) {
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    }
  }
  return Promise.reject(error);
});

export const fetchTeamById = (id) => {
  return api.get(`api/teams/${id}/`);
};

export const fetchTeams = () => {
  return api.get('api/teams/');
};

export const registerUser = (userData) => {
  return api.post('register/', userData);
};

export default api;
