import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import Constants from 'expo-constants';

import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/theme';
import { AuthProvider } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { TutorialProvider } from './src/context/TutorialContext';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import TikTok SDK only in production
let initializeTikTokSDK, trackTikTokLaunchApp;
if (!isExpoGo) {
  const tiktokModule = require('./src/services/tiktokTracking');
  initializeTikTokSDK = tiktokModule.initializeTikTokSDK;
  trackTikTokLaunchApp = tiktokModule.trackTikTokLaunchApp;
} else {
  // Expo Go - provide dummy functions
  initializeTikTokSDK = async () => {
    console.log('[App] 🔧 DEV MODE: TikTok SDK not available in Expo Go');
    return false;
  };
  trackTikTokLaunchApp = async () => {
    console.log('[App] 🔧 DEV MODE: TikTok tracking not available in Expo Go');
  };
}

// Conditionally import Superwall and RevenueCat only in production
let SuperwallProvider, SuperwallLoaded, SuperwallLoading;
let Purchases;
let SuperwallPurchaseController, SubscriptionSyncContext, UserIdentificationSync;

if (!isExpoGo) {
  // Production build - import Superwall and RevenueCat
  const superwallModule = require('expo-superwall');
  SuperwallProvider = superwallModule.SuperwallProvider;
  SuperwallLoaded = superwallModule.SuperwallLoaded;
  SuperwallLoading = superwallModule.SuperwallLoading;

  Purchases = require('react-native-purchases').default;

  SuperwallPurchaseController = require('./src/context/SuperwallPurchaseController').default;
  SubscriptionSyncContext = require('./src/context/SubscriptionSyncContext').default;
  UserIdentificationSync = require('./src/context/UserIdentificationSync').default;
} else {
  // Expo Go - provide dummy components
  console.log('[App] 🔧 DEV MODE: Skipping Superwall/RevenueCat imports (Expo Go)');

  // Dummy pass-through components
  SuperwallProvider = ({ children }) => <>{children}</>;
  SuperwallLoaded = ({ children }) => <>{children}</>;
  SuperwallLoading = ({ children }) => null;
  SuperwallPurchaseController = ({ children }) => <>{children}</>;
  SubscriptionSyncContext = ({ children }) => <>{children}</>;
  UserIdentificationSync = ({ children }) => <>{children}</>;
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const routeNameRef = React.useRef();
  const navigationRef = React.useRef();

  // CRITICAL: Configure RevenueCat and TikTok SDK on mount (before rendering providers)
  // Only in production builds, not in Expo Go
  useEffect(() => {
    // Initialize TikTok SDK and track LaunchApp (async, non-blocking)
    (async () => {
      const initialized = await initializeTikTokSDK();
      if (initialized) {
        // Track launch app after SDK is ready
        await trackTikTokLaunchApp();
      }
    })();

    if (isExpoGo) {
      console.log('[App] 🔧 DEV MODE: Skipping RevenueCat configuration (Expo Go)');
      return;
    }

    const apiKey = process.env.REVENUECAT_API_KEY || '';

    if (!apiKey) {
      console.error('[App] ❌ REVENUECAT_API_KEY not found in environment!');
      console.error('[App] RevenueCat will not work without API key');
      return;
    }

    console.log('[App] 🔧 Configuring RevenueCat...');
    console.log('[App] Platform:', Platform.OS);

    Purchases.configure({ apiKey });

    console.log('[App] ✅ RevenueCat configured successfully');
  }, []);

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

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Superwall API keys from environment (only used in production)
  const superwallApiKeys = isExpoGo ? null : {
    ios: process.env.SUPERWALL_API_KEY || '',
    android: process.env.SUPERWALL_API_KEY || '',
  };

  // Render different provider hierarchy based on environment
  if (isExpoGo) {
    // Expo Go - Simple provider hierarchy
    // Still need SubscriptionSyncContext and UserIdentificationSync for hooks
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <TutorialProvider>
                <SubscriptionSyncContext>
                  <UserIdentificationSync>
                    <View style={styles.container} onLayout={onLayoutRootView}>
                      <StatusBar style="light" />
                      <NavigationContainer
                        ref={navigationRef}
                        onReady={() => {
                          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
                        }}
                      >
                        <AppNavigator />
                      </NavigationContainer>
                    </View>
                  </UserIdentificationSync>
                </SubscriptionSyncContext>
              </TutorialProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Production - Full provider hierarchy with Superwall/RevenueCat
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <SuperwallPurchaseController>
          <SuperwallProvider apiKeys={superwallApiKeys}>
            <SuperwallLoading>
              <View style={styles.container} />
            </SuperwallLoading>
            <SuperwallLoaded>
              <AuthProvider>
                <SubscriptionProvider>
                  <TutorialProvider>
                    <SubscriptionSyncContext>
                      <UserIdentificationSync>
                        <View style={styles.container} onLayout={onLayoutRootView}>
                          <StatusBar style="light" />
                          <NavigationContainer
                            ref={navigationRef}
                            onReady={() => {
                              routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
                            }}
                          >
                            <AppNavigator />
                          </NavigationContainer>
                        </View>
                      </UserIdentificationSync>
                    </SubscriptionSyncContext>
                  </TutorialProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </SuperwallLoaded>
          </SuperwallProvider>
        </SuperwallPurchaseController>
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
