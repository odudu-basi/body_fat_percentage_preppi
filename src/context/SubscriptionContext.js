import React, { createContext, useContext, useState, useEffect } from 'react';
import Constants from 'expo-constants';
import {
  initializePurchases,
  checkProAccess,
  restorePurchases,
  getOfferings,
  purchasePackage,
} from '../services/purchases';

// Check if we're in Expo Go (development mode)
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

  // Initialize RevenueCat
  useEffect(() => {
    // DEVELOPMENT MODE: Skip RevenueCat in Expo Go
    if (isExpoGo) {
      console.log('[SubscriptionContext] 🔧 DEV MODE: Skipping RevenueCat (Expo Go)');
      setIsPro(true); // Set to true so user can access app
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId = null;

    const init = async () => {
      try {
        console.log('[SubscriptionContext] Starting initialization...');

        // Initialize RevenueCat without userId (will create anonymous user)
        try {
          await initializePurchases();
          console.log('[SubscriptionContext] RevenueCat initialized');
        } catch (initError) {
          console.error('[SubscriptionContext] RevenueCat init failed:', initError);
          if (isMounted) {
            setIsPro(false);
            setOfferings([]);
            setIsLoading(false);
          }
          return;
        }

        if (!isMounted) return;

        // Add small delay before checking Pro access
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!isMounted) return;

        // Check Pro access
        try {
          const hasProAccess = await checkProAccess();
          if (isMounted) {
            setIsPro(hasProAccess);
            console.log('[SubscriptionContext] Pro access:', hasProAccess);
          }
        } catch (accessError) {
          console.error('[SubscriptionContext] Error checking Pro access:', accessError);
          if (isMounted) setIsPro(false);
        }

        // Add small delay before getting offerings
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!isMounted) return;

        // Get available offerings
        try {
          const availableOfferings = await getOfferings();
          if (isMounted) {
            setOfferings(availableOfferings);
            console.log('[SubscriptionContext] Offerings loaded:', availableOfferings.length);
          }
        } catch (offeringsError) {
          console.error('[SubscriptionContext] Error getting offerings:', offeringsError);
          if (isMounted) setOfferings([]);
        }
      } catch (error) {
        console.error('[SubscriptionContext] Initialization error:', error);
        if (isMounted) {
          setIsPro(false);
          setOfferings([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []); // Initialize once on mount

  // Subscriptions are device-based, not user-based
  // RevenueCat will automatically create anonymous user IDs per device
  // Users keep their subscription even if they log out or switch accounts

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
      // Check RevenueCat subscription status (source of truth)
      const hasProAccess = await checkProAccess();
      setIsPro(hasProAccess);

      console.log('Subscription status refreshed from RevenueCat:', hasProAccess);
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
      // Fallback to RevenueCat check
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

