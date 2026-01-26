import React, { createContext, useContext, useEffect, useState } from 'react';
import Constants from 'expo-constants';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import modules only in production
let Purchases, useUser;

if (!isExpoGo) {
  Purchases = require('react-native-purchases').default;
  const superwallModule = require('expo-superwall');
  useUser = superwallModule.useUser;
}

/**
 * Subscription Sync Status Context
 * Tracks whether RevenueCat → Superwall sync is complete
 */
const SubscriptionSyncStatusContext = createContext({
  isSynced: false,
});

export const useSubscriptionSync = () => {
  const context = useContext(SubscriptionSyncStatusContext);
  if (!context) {
    throw new Error('useSubscriptionSync must be used within SubscriptionSyncContext');
  }
  return context;
};

/**
 * Subscription Sync Context
 * Syncs RevenueCat subscription status to Superwall
 *
 * Per Superwall docs: "When using RevenueCat or custom purchase controllers,
 * you'll need to manually update subscription status using setSubscriptionStatus()"
 *
 * This is REQUIRED for Superwall to know about RevenueCat subscriptions
 */
const SubscriptionSyncContext = ({ children }) => {
  // In Expo Go, skip subscription sync completely
  if (isExpoGo) {
    console.log('[SubscriptionSync] 🔧 DEV MODE: Skipping sync (Expo Go)');
    return (
      <SubscriptionSyncStatusContext.Provider value={{ isSynced: true }}>
        {children}
      </SubscriptionSyncStatusContext.Provider>
    );
  }

  const { setSubscriptionStatus } = useUser();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    console.log('[SubscriptionSync] Starting RevenueCat → Superwall sync...');

    // Sync initial subscription status
    const syncInitialStatus = async () => {
      try {
        console.log('[SubscriptionSync] Fetching initial customer info from RevenueCat...');
        const customerInfo = await Purchases.getCustomerInfo();
        const entitlementIds = Object.keys(customerInfo.entitlements.active);

        const status = entitlementIds.length === 0 ? 'INACTIVE' : 'ACTIVE';
        const entitlements = entitlementIds.map(id => ({
          id,
          type: 'SERVICE_LEVEL',
        }));

        console.log('[SubscriptionSync] Syncing to Superwall - Status:', status);
        console.log('[SubscriptionSync] Active entitlements:', entitlementIds);

        // This is documented in Superwall docs for RevenueCat integration
        setSubscriptionStatus({
          status,
          entitlements,
        });

        console.log('[SubscriptionSync] ✅ Initial sync complete');
        setIsSynced(true);
      } catch (error) {
        console.error('[SubscriptionSync] ❌ Failed to sync subscription status:', error);
        console.error('[SubscriptionSync] Error details:', JSON.stringify(error, null, 2));
        console.error('[SubscriptionSync] This usually means:');
        console.error('[SubscriptionSync] 1. RevenueCat not configured (missing API key)');
        console.error('[SubscriptionSync] 2. RevenueCat configured after this component mounted');
        console.error('[SubscriptionSync] 3. Network error fetching customer info');

        // On error, set status to INACTIVE so Superwall knows about it
        // This prevents the "subscription status was not set" error
        try {
          setSubscriptionStatus({
            status: 'INACTIVE',
            entitlements: [],
          });
          console.log('[SubscriptionSync] Set status to INACTIVE due to error');
        } catch (setStatusError) {
          console.error('[SubscriptionSync] Failed to set INACTIVE status:', setStatusError);
        }

        // Mark as synced so app doesn't get stuck on loading screen
        setIsSynced(true);
      }
    };

    // Listen for RevenueCat subscription changes and sync to Superwall
    const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      const entitlementIds = Object.keys(customerInfo.entitlements.active);
      const status = entitlementIds.length === 0 ? 'INACTIVE' : 'ACTIVE';
      const entitlements = entitlementIds.map(id => ({
        id,
        type: 'SERVICE_LEVEL',
      }));

      console.log('[SubscriptionSync] RevenueCat update - Syncing to Superwall');
      console.log('[SubscriptionSync] Status:', status, 'Entitlements:', entitlementIds);

      setSubscriptionStatus({
        status,
        entitlements,
      });
    });

    // Run initial sync
    syncInitialStatus();

    // Cleanup
    return () => {
      console.log('[SubscriptionSync] Cleaning up listener');
      listener?.remove();
    };
  }, [setSubscriptionStatus]);

  return (
    <SubscriptionSyncStatusContext.Provider value={{ isSynced }}>
      {children}
    </SubscriptionSyncStatusContext.Provider>
  );
};

export default SubscriptionSyncContext;
