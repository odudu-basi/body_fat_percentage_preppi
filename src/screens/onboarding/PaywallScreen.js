import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { trackPaywallView, trackSubscriptionPurchase } from '../../utils/analytics';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import LoadingIndicator from '../../components/common/LoadingIndicator';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Safely import TikTok tracking - only works in production builds
let trackTikTokSubscribe, trackTikTokPurchase;
try {
  const tiktok = require('../../services/tiktokTracking');
  trackTikTokSubscribe = tiktok.trackTikTokSubscribe || (() => {});
  trackTikTokPurchase = tiktok.trackTikTokPurchase || (() => {});
} catch (e) {
  console.log('[PaywallScreen] TikTok tracking not available');
  trackTikTokSubscribe = () => {};
  trackTikTokPurchase = () => {};
}

// Conditionally import Superwall only in production
let usePlacement;

if (!isExpoGo) {
  const superwallModule = require('expo-superwall');
  usePlacement = superwallModule.usePlacement;
}

const PaywallScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { refreshSubscription } = useSubscription();
  const { isAuthenticated } = useAuth();

  // DEVELOPMENT MODE: Skip paywall in Expo Go
  useEffect(() => {
    if (isExpoGo) {
      console.log('[PaywallScreen] 🔧 DEV MODE: Skipping paywall (Expo Go)');
      navigation.navigate('Login', {
        ...route.params,
      });
    }
  }, []);

  // Return early if in Expo Go to avoid hook errors
  if (isExpoGo) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator text="Redirecting..." />
        </View>
      </View>
    );
  }

  // Superwall placement hook - EXACTLY as documented (only in production)
  const { registerPlacement, state: placementState } = usePlacement({
    onError: (error) => {
      console.error('[PaywallScreen] Paywall Error:', error);
    },
    onPresent: (info) => {
      console.log('[PaywallScreen] Paywall Presented:', info);
      trackPaywallView();
    },
    onDismiss: (info, result) => {
      console.log('[PaywallScreen] ========================================');
      console.log('[PaywallScreen] Paywall Dismissed');
      console.log('[PaywallScreen] Info:', JSON.stringify(info, null, 2));
      console.log('[PaywallScreen] Result:', result);
      console.log('[PaywallScreen] ========================================');

      // CRITICAL: Since there's NO dismiss button on the paywall,
      // if onDismiss fires, user completed the purchase flow
      // Check result for logging, but any dismiss = completion
      if (result) {
        console.log('[PaywallScreen] Dismiss result type:', typeof result);
        console.log('[PaywallScreen] Dismiss result value:', result);
      }

      // Track purchase (any dismiss = user went through purchase flow)
      trackSubscriptionPurchase('pro_subscription', 0);

      // TikTok: subscription confirmed
      trackTikTokSubscribe(0);
      trackTikTokPurchase(0);
      console.log('[PaywallScreen] Purchase tracked, user completed paywall flow');
    },
  });

  // Handle navigation based on placementState (as docs recommend)
  useEffect(() => {
    if (placementState) {
      console.log('[PaywallScreen] Placement state changed:', JSON.stringify(placementState));

      // After paywall interaction, refresh subscription and navigate
      // Do this outside the callback to avoid async issues
      const handlePostPaywall = async () => {
        console.log('[PaywallScreen] Refreshing subscription status...');
        await refreshSubscription();

        // Only navigate to Login if user is NOT already authenticated
        // If user is already logged in (returning user with expired subscription),
        // AppNavigator will automatically route them to MainApp after isPro updates
        if (!isAuthenticated) {
          console.log('[PaywallScreen] User not authenticated - navigating to Login...');
          navigation.navigate('Login', {
            ...route.params,
          });
        } else {
          console.log('[PaywallScreen] User already authenticated - AppNavigator will handle routing');
          // AppNavigator will detect isPro = true and show MainApp automatically
        }
      };

      handlePostPaywall();
    }
  }, [placementState, isAuthenticated]);

  useEffect(() => {
    const presentPaywall = async () => {
      // DEVELOPMENT MODE: Skip paywall in Expo Go
      if (isExpoGo) {
        console.log('[PaywallScreen] 🔧 DEV MODE: Skipping paywall');
        navigation.navigate('Login', {
          ...route.params,
        });
        return;
      }

      // PRODUCTION MODE: Register Superwall placement
      // No try-catch - errors handled by onError callback
      console.log('[PaywallScreen] Registering placement: campaign_trigger');

      await registerPlacement({
        placement: 'campaign_trigger',
      });

      console.log('[PaywallScreen] Placement registered');
    };

    // Present paywall on mount
    presentPaywall();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.loadingContainer}>
        <LoadingIndicator text="Loading subscription..." />
        {placementState && (
          <Text style={styles.debugText}>
            State: {JSON.stringify(placementState)}
          </Text>
        )}
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
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  debugText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
    opacity: 0.5,
  },
});

export default PaywallScreen;
