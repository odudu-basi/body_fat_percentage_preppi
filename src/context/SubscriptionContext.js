import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initializePurchases,
  checkProAccess,
  restorePurchases,
  getOfferings,
  purchasePackage,
} from '../services/purchases';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children, appReady }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState([]);

  // Initialize RevenueCat ONLY when app is ready (prevents crash)
  useEffect(() => {
    // CRITICAL: Don't initialize until app is ready
    if (!appReady) {
      console.log('[SubscriptionContext] Waiting for app to be ready...');
      return;
    }

    let isMounted = true;
    let timeoutId = null;

    const init = async () => {
      try {
        // CRITICAL: Wait 3 seconds after appReady to avoid collision with AuthContext
        console.log('[SubscriptionContext] Scheduling RevenueCat initialization in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (!isMounted) return;

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
  }, [appReady]); // Initialize when app becomes ready

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

