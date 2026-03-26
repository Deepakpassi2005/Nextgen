import Constants from 'expo-constants';
import { Platform } from 'react-native';

// IP address for physical device debugging (replace with your computer's IP)
const MANUAL_IP = '10.64.112.85'; 

// For production, replace this with your Render backend URL
// Example: 'https://asset-manager-backend.onrender.com/api'
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://YOUR_BACKEND_URL.onrender.com/api';

// Dynamically get the IP address of the Metro bundler to connect physical devices
const debuggerHost = Constants.expoConfig?.hostUri;
let localhost = debuggerHost ? debuggerHost.split(':')[0] : MANUAL_IP;

// If we're on Android emulator and localhost is 'localhost' or '127.0.0.1', use the 10.0.2.2 alias
if (Platform.OS === 'android' && (localhost === 'localhost' || localhost === '127.0.0.1')) {
  localhost = '10.0.2.2';
}

export const CONFIG = {
  // Use production URL if not in development, otherwise use dynamic local IP
  API_BASE_URL: __DEV__ ? `http://${localhost}:5001/api` : PRODUCTION_API_URL,
  
  APP_NAME: 'NextGen School',
  VERSION: '1.0.0',
  
  // School Physical GPS Configuration (Rosematias Chamber, Vasco da Gama, Goa)
  SCHOOL_LAT: 15.39585,
  SCHOOL_LNG: 73.81568,
  PUNCH_RADIUS: 2000,
};
