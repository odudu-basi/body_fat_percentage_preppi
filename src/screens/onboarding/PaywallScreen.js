import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { checkProAccess, presentPaywall } from '../../services/purchases';
import { trackPaywallView, trackSubscriptionPurchase } from '../../utils/analytics';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

const PaywallScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionAndShowPaywall();
  }, []);

  const checkSubscriptionAndShowPaywall = async () => {
    try {
      setIsLoading(true);

      // Track paywall view
      trackPaywallView();

      // DEVELOPMENT MODE: Skip paywall ONLY in Expo Go (not TestFlight/Production)
      if (isExpoGo) {
        console.log('🔧 DEV MODE: Skipping paywall (Expo Go detected)');
        setIsLoading(false);
        navigation.navigate('Login', {
          ...route.params,
        });
        return;
      }

      // PRODUCTION MODE: Check subscription status using RevenueCat
      console.log('📱 PRODUCTION: Checking subscription status via RevenueCat...');

      const hasProAccess = await checkProAccess();
      console.log('[PaywallScreen] RevenueCat subscription status:', hasProAccess);

      if (hasProAccess) {
        // User is already subscribed, allow them to proceed
        console.log('✅ User is already subscribed, proceeding to Login');
        setIsLoading(false);
        navigation.navigate('Login', {
          ...route.params,
        });
        return;
      }

      // User is NOT subscribed - Show RevenueCat Paywall (from dashboard)
      console.log('🔒 User is NOT subscribed. Presenting RevenueCat paywall from dashboard...');

      // Present the paywall configured in RevenueCat dashboard
      const result = await presentPaywall();

      console.log('[PaywallScreen] Paywall result:', result);

      if (result.cancelled) {
        // User dismissed the paywall without purchasing
        console.log('[PaywallScreen] User cancelled paywall');
        // Still proceed to Login (user can access limited features)
        navigation.navigate('Login', {
          ...route.params,
        });
      } else if (result.purchased) {
        // User made a purchase
        console.log('[PaywallScreen] User purchased subscription!');
        trackSubscriptionPurchase('pro_subscription', 0); // Price handled by RevenueCat
        navigation.navigate('Login', {
          ...route.params,
        });
      } else {
        // Some other result
        console.log('[PaywallScreen] Paywall closed, proceeding to Login');
        navigation.navigate('Login', {
          ...route.params,
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('[PaywallScreen] Paywall error:', error);
      setIsLoading(false);

      // On error, show retry option
      Alert.alert(
        'Error',
        `There was an error loading the subscription: ${error.message || 'Unknown error'}`,
        [
          {
            text: 'Retry',
            onPress: () => checkSubscriptionAndShowPaywall(),
          },
          {
            text: 'Continue Anyway',
            onPress: () => {
              navigation.navigate('Login', {
                ...route.params,
              });
            },
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.loadingContainer}>
        {isLoading && (
          <>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <Text style={styles.loadingText}>Loading subscription...</Text>
          </>
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
});

export default PaywallScreen;
