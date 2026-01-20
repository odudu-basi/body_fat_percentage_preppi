import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import {
  WelcomeScreen,
  GenderScreen,
  BirthdayScreen,
  HeightWeightScreen,
  EthnicityScreen,
  WorkoutFrequencyScreen,
  WaterIntakeScreen,
  BodyFatCostsScreen,
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
      <AuthStack.Screen name="Testimonials" component={TestimonialsScreen} />
      <AuthStack.Screen name="Accuracy" component={AccuracyScreen} />
      <AuthStack.Screen name="Paywall" component={PaywallScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
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

// Root Navigator - handles auth state
const AppNavigator = () => {
  const { isAuthenticated, initialized, loading } = useAuth();

  // Show loading while initializing
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  // Show auth flow if not authenticated
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Show main app if authenticated
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
