import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useSubscriptionSync } from '../context/SubscriptionSyncContext';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';
import {
  WelcomeScreen,
  GenderScreen,
  BirthdayScreen,
  HeightWeightScreen,
  EthnicityScreen,
  WorkoutFrequencyScreen,
  WaterIntakeScreen,
  BodyFatCostsScreen,
  DifficultyScreen,
  TestimonialsScreen,
  AccuracyScreen,
  PaywallScreen,
} from '../screens/onboarding';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DailyScreen from '../screens/DailyScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProgressPhotosScreen from '../screens/ProgressPhotosScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import BuddyScreen from '../screens/BuddyScreen';
import BuddyChatScreen from '../screens/BuddyChatScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ScanDetailsScreen from '../screens/ScanDetailsScreen';
import NutritionResultsScreen from '../screens/NutritionResultsScreen';
import CustomTabBar from '../components/common/CustomTabBar';
import { Colors } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Tab Navigator (main app screens)
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      sceneContainerStyle={{
        backgroundColor: 'transparent',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Daily" component={DailyScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Feedback" component={FeedbackScreen} />
      <Tab.Screen 
        name="Buddy" 
        component={BuddyScreen}
        options={{
          tabBarButton: () => null, // Hide from tab bar, accessed via logo
        }}
      />
    </Tab.Navigator>
  );
};

// Auth Navigator (for unauthenticated users)
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Gender" component={GenderScreen} />
      <AuthStack.Screen name="Birthday" component={BirthdayScreen} />
      <AuthStack.Screen name="HeightWeight" component={HeightWeightScreen} />
      <AuthStack.Screen name="Ethnicity" component={EthnicityScreen} />
      <AuthStack.Screen name="WorkoutFrequency" component={WorkoutFrequencyScreen} />
      <AuthStack.Screen name="WaterIntake" component={WaterIntakeScreen} />
      <AuthStack.Screen name="BodyFatCosts" component={BodyFatCostsScreen} />
      <AuthStack.Screen name="Difficulty" component={DifficultyScreen} />
      <AuthStack.Screen name="Testimonials" component={TestimonialsScreen} />
      <AuthStack.Screen name="Accuracy" component={AccuracyScreen} />
      <AuthStack.Screen name="Paywall" component={PaywallScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

// Paywall Navigator (for authenticated but unsubscribed users)
const PaywallNavigator = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Paywall"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    >
      <AuthStack.Screen name="Paywall" component={PaywallScreen} />
    </AuthStack.Navigator>
  );
};

// Main Stack Navigator (includes tabs + modal screens)
const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen 
        name="Results" 
        component={ResultsScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen 
        name="ScanDetails" 
        component={ScanDetailsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="NutritionResults" 
        component={NutritionResultsScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen 
        name="BuddyChat" 
        component={BuddyChatScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen 
        name="ProgressPhotos" 
        component={ProgressPhotosScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.dark.primary} />
  </View>
);

// Root Navigator - handles auth state and subscription gate
// Per user requirements:
// - Onboarding, splash, welcome = NOT paywalled
// - Main app = Requires subscription (checked via Superwall)
const AppNavigator = () => {
  const { isAuthenticated, initialized, loading } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();

  // Show loading while initializing auth
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  // Show onboarding/auth flow if not authenticated
  // This includes: Welcome, Gender, Birthday, ..., PaywallScreen, LoginScreen
  if (!isAuthenticated) {
    console.log('[AppNavigator] User not authenticated - showing onboarding');
    return <AuthNavigator />;
  }

  // User is authenticated - now check subscription
  // Only wait for RevenueCat subscription status to load
  // Note: SubscriptionSync is optional per Superwall docs
  if (subLoading) {
    console.log('[AppNavigator] Waiting for subscription status...');
    return <LoadingScreen />;
  }

  // In Expo Go, skip subscription check (RevenueCat doesn't work in Expo Go)
  if (isExpoGo) {
    console.log('[AppNavigator] Dev mode - bypassing subscription check');
    return <MainNavigator />;
  }

  // Check subscription status (RevenueCat is source of truth)
  // If not subscribed, show paywall (for app reinstalls, new devices, etc.)
  if (!isPro) {
    console.log('[AppNavigator] User authenticated but not subscribed - showing paywall');
    return <PaywallNavigator />;
  }

  // User is authenticated AND subscribed - show main app
  console.log('[AppNavigator] User authenticated and subscribed - showing main app');
  return <MainNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
});

export default AppNavigator;
