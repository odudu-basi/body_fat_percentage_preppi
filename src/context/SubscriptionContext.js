import React, { createContext, useContext, useState, useEffect } from 'react';
import Constants from 'expo-constants';
import {
  initializePurchases,
  checkProAccess,
  restorePurchases,
  getOfferings,
  purchasePackage,
} from '../services/purchases';

// Dynamically import Superwall (will fail in Expo Go)
let Superwall = null;
try {
  Superwall = require('@superwall/react-native-superwall').default;
} catch (e) {
  // Superwall not available in Expo Go
}

const isExpoGo = Constants.appOwnership === 'expo';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState([]);

  // Initialize RevenueCat and check subscription status
  useEffect(() => {
    const init = async () => {
      try {
        await initializePurchases();
        
        // Check if user has Pro access
        const hasProAccess = await checkProAccess();
        setIsPro(hasProAccess);

        // Get available offerings
        const availableOfferings = await getOfferings();
        setOfferings(availableOfferings);
      } catch (error) {
        console.error('Failed to initialize subscriptions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Restore purchases (for existing subscribers from old app)
  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      const result = await restorePurchases();
      if (result.success && result.isPro) {
        setIsPro(true);
        return { success: true, message: 'Subscription restored successfully!' };
      } else if (result.success && !result.isPro) {
        return { success: false, message: 'No active subscription found.' };
      }
      return { success: false, message: 'Failed to restore purchases.' };
    } catch (error) {
      return { success: false, message: 'An error occurred while restoring.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Purchase a subscription
  const handlePurchase = async (pkg) => {
    setIsLoading(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        setIsPro(true);
        return { success: true, message: 'Welcome to Pro!' };
      } else if (result.cancelled) {
        return { success: false, message: 'Purchase cancelled.' };
      }
      return { success: false, message: 'Purchase failed.' };
    } catch (error) {
      return { success: false, message: 'An error occurred during purchase.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh subscription status
  const refreshSubscription = async () => {
    try {
      // Check RevenueCat subscription status
      const hasProAccess = await checkProAccess();
      setIsPro(hasProAccess);

      // Sync with Superwall (only in production builds)
      if (!isExpoGo && Superwall) {
        try {
          const superwallStatus = await Superwall.getSubscriptionStatus();
          const isActive = superwallStatus === 'ACTIVE';

          // If there's a mismatch, log it
          if (hasProAccess !== isActive) {
            console.warn('Subscription status mismatch between RevenueCat and Superwall');
          }
        } catch (superwallError) {
          console.log('Superwall sync skipped:', superwallError.message);
        }
      }

      // Use RevenueCat as source of truth
      setIsPro(hasProAccess);
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
      // Fallback to RevenueCat only
      const hasProAccess = await checkProAccess();
      setIsPro(hasProAccess);
    }
  };

  const value = {
    isPro,
    isLoading,
    offerings,
    restorePurchases: handleRestorePurchases,
    purchase: handlePurchase,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;

