import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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
import { SUPERWALL_API_KEY } from '@env';

import SplashScreenComponent from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/theme';
import { AuthProvider } from './src/context/AuthContext';

// Dynamically import Superwall (will fail in Expo Go, which is fine)
let Superwall = null;
try {
  Superwall = require('@superwall/react-native-superwall').default;
} catch (e) {
  console.log('Superwall not available - running in Expo Go');
}

const isExpoGo = Constants.appOwnership === 'expo';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

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

  // Configure Superwall (only in production builds, not Expo Go)
  useEffect(() => {
    const initializeSuperwall = async () => {
      if (isExpoGo || !Superwall) {
        console.log('🔧 DEV MODE: Skipping Superwall configuration (Expo Go)');
        return;
      }

      try {
        await Superwall.configure(SUPERWALL_API_KEY, {
          purchaseController: 'revenueCat',
        });
        console.log('📱 PRODUCTION: Superwall configured successfully');
      } catch (error) {
        console.error('Failed to configure Superwall:', error);
      }
    };

    initializeSuperwall();
  }, []);

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

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <View style={styles.container} onLayout={onLayoutRootView}>
            <StatusBar style="light" />
            {showSplash ? (
              <SplashScreenComponent onFinish={handleSplashFinish} />
            ) : (
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            )}
          </View>
        </AuthProvider>
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
