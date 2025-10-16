
import React, { useEffect } from 'react';
import { useColorScheme, Alert } from 'react-native';
import { useFonts } from 'expo-font';
import { useNetworkState } from 'expo-network';
import { SystemBars } from 'react-native-edge-to-edge';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from '@react-navigation/native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/button';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { currentUser, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === 'login';

      if (!currentUser && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/login');
      } else if (currentUser && inAuthGroup) {
        // Redirect to home if authenticated
        router.replace('/(tabs)/(home)/');
      }
    }
  }, [currentUser, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chores" options={{ presentation: 'modal' }} />
      <Stack.Screen name="people" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isConnected } = useNetworkState();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (isConnected === false) {
      Alert.alert(
        'No Internet Connection',
        'Some features may not work properly without an internet connection.',
        [{ text: 'OK' }]
      );
    }
  }, [isConnected]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SystemBars style="auto" />
        <WidgetProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </WidgetProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
