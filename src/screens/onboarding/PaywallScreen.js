import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Colors, Fonts, Spacing } from '../../constants/theme';

// Dynamically import Superwall (will fail in Expo Go, which is fine)
let Superwall = null;
try {
  Superwall = require('@superwall/react-native-superwall').default;
} catch (e) {
  // Superwall not available - running in Expo Go
}

const isExpoGo = Constants.appOwnership === 'expo';

const PaywallScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscriptionAndShowPaywall = async () => {
      try {
        // DEVELOPMENT MODE: Skip paywall in Expo Go
        if (isExpoGo || !Superwall) {
          console.log('🔧 DEV MODE: Skipping paywall (Expo Go detected)');
          navigation.navigate('Login', {
            ...route.params,
          });
          return;
        }

        // PRODUCTION MODE: Show Superwall paywall
        console.log('📱 PRODUCTION: Checking subscription status...');

        // Check if user is already subscribed
        const subscriptionStatus = await Superwall.getSubscriptionStatus();

        if (subscriptionStatus === 'ACTIVE') {
          // User is already subscribed, skip paywall
          console.log('User is already subscribed, skipping paywall');
          navigation.navigate('Login', {
            ...route.params,
          });
          return;
        }

        // User is not subscribed, present paywall
        console.log('Presenting paywall with placement: campaign_trigger');

        const result = await Superwall.register('campaign_trigger', {
          // Pass any params if needed
        });

        console.log('Paywall result:', result);

        // After paywall is dismissed (either subscribed or closed)
        // Check subscription status again
        const newStatus = await Superwall.getSubscriptionStatus();

        if (newStatus === 'ACTIVE') {
          // User subscribed, go to login
          console.log('User subscribed successfully');
          navigation.navigate('Login', {
            ...route.params,
          });
        } else {
          // User dismissed without subscribing, still go to login
          // (But they won't have access to premium features)
          console.log('User dismissed paywall without subscribing');
          navigation.navigate('Login', {
            ...route.params,
          });
        }
      } catch (error) {
        console.error('Paywall error:', error);
        // On error, still allow user to proceed
        navigation.navigate('Login', {
          ...route.params,
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure Superwall is ready
    const timer = setTimeout(() => {
      checkSubscriptionAndShowPaywall();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
});

export default PaywallScreen;
