import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
} from '@expo-google-fonts/rubik';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SplashScreenComponent from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/theme';
import { AuthProvider } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { initAnalytics, trackAppOpen, trackScreenView } from './src/utils/analytics';

// Check if we're in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false); // NEW: Track when app is ready for native modules
  const routeNameRef = React.useRef();
  const navigationRef = React.useRef();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
  });

  // CRITICAL: Wait for splash to finish, THEN mark app as ready for native modules
  useEffect(() => {
    if (!showSplash && fontsLoaded) {
      // Wait 2 seconds after splash finishes before allowing native modules
      const timer = setTimeout(() => {
        console.log('[App] ✅ App ready for native module initialization');
        setAppReady(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showSplash, fontsLoaded]);

  // Initialize Mixpanel analytics - ONLY after app is ready
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const setupAnalytics = async () => {
      // Wait for app to be ready
      if (!appReady) {
        return;
      }

      // CRITICAL: Add additional delay to avoid collision
      console.log('[App] Scheduling analytics initialization in 5 seconds...');
      timeoutId = setTimeout(async () => {
        try {
          console.log('[App] Initializing analytics...');
          await initAnalytics();
          if (isMounted) {
            trackAppOpen();
            console.log('[App] Analytics initialized successfully');
          }
        } catch (error) {
          console.error('[App] Analytics setup error:', error);
          // Don't crash the app if analytics fails
        }
      }, 5000); // Wait 5 seconds after app is ready
    };

    setupAnalytics();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [appReady]); // Re-run when app becomes ready

  // Superwall is now configured via SuperwallProvider wrapper

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  const appContent = (
    <AuthProvider appReady={appReady}>
      <SubscriptionProvider appReady={appReady}>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <StatusBar style="light" />
          {showSplash ? (
            <SplashScreenComponent onFinish={handleSplashFinish} />
          ) : (
            <NavigationContainer
              ref={navigationRef}
              onReady={() => {
                routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
              }}
              onStateChange={() => {
                try {
                  const previousRouteName = routeNameRef.current;
                  const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

                  if (previousRouteName !== currentRouteName && currentRouteName) {
                    // Track screen view in Mixpanel
                    trackScreenView(currentRouteName);
                  }

                  // Save the current route name for next change
                  routeNameRef.current = currentRouteName;
                } catch (error) {
                  console.error('[Navigation] Error tracking screen view:', error);
                }
              }}
            >
              <AppNavigator />
            </NavigationContainer>
          )}
        </View>
      </SubscriptionProvider>
    </AuthProvider>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        {appContent}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
});
