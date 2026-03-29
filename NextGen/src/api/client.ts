import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request - clearing stale token');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Note: Full app state reset usually requires a reload or context update
    }
    return Promise.reject(error);
  }
);

export default apiClient;
