import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { StudentNavigator } from './src/navigation/StudentNavigator';
import { TeacherNavigator } from './src/navigation/TeacherNavigator';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { COLORS } from './src/theme/theme';
import { Provider as PaperProvider } from 'react-native-paper';
import { useUserStore } from './src/store';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, saveTokenToBackend } from './src/services/NotificationService';
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Configure notifications to show alerts even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const RootNavigator = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { loadUser } = useUserStore();

  React.useEffect(() => {
    loadUser();
  }, [user]);

  // Handle Notifications
  React.useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          saveTokenToBackend(token).catch(err => console.error('Token registration failed:', err));
        }
      });
    }

    // Listener for when a notification is received while the app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Listener for when a user interacts with a notification (clicked it)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification clicked:', data);

      if (data && data.screen) {
        // Deep linking logic
        if (navigationRef.isReady()) {
          // @ts-ignore
          navigationRef.navigate(data.screen, { id: data.id });
        }
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [user]);

  if (isAuthLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/splishIcon.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'teacher' || user.role === 'admin' ? (
        <TeacherNavigator />
      ) : (
        <StudentNavigator />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});
