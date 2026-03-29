import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../api/client';

export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  let token = null;
  try {
    // For custom development builds, we use the native device token (FCM) 
    // to match the backend's Firebase Admin SDK integration.
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    token = tokenResponse.data;
    console.log('Native push token acquired:', token);
  } catch (error) {
    console.warn('Push notification token recruitment failed. If this is a development build on Android, ensure you have google-services.json configured:', error);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};

export const saveTokenToBackend = async (fcmToken: string) => {
  try {
    const response = await apiClient.put('/user/fcm-token', { fcmToken });
    return response.data;
  } catch (error) {
    console.error('Error saving FCM token to backend:', error);
    throw error;
  }
};
