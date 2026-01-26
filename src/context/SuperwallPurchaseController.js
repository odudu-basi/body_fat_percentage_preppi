import React from 'react';
import Constants from 'expo-constants';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import modules only in production
let Purchases, PURCHASES_ERROR_CODE, CustomPurchaseControllerProvider;

if (!isExpoGo) {
  const purchasesModule = require('react-native-purchases');
  Purchases = purchasesModule.default;
  PURCHASES_ERROR_CODE = purchasesModule.PURCHASES_ERROR_CODE;

  const superwallModule = require('expo-superwall');
  CustomPurchaseControllerProvider = superwallModule.CustomPurchaseControllerProvider;
}

/**
 * Superwall Purchase Controller
 * Integrates RevenueCat as the purchase handler for Superwall paywalls
 *
 * This component wraps the app and handles all purchase/restore requests
 * from Superwall paywalls by routing them through RevenueCat
 */
const SuperwallPurchaseController = ({ children }) => {
  // In Expo Go, just pass through children
  if (isExpoGo) {
    console.log('[SuperwallPurchaseController] 🔧 DEV MODE: Skipping (Expo Go)');
    return <>{children}</>;
  }

  const purchaseController = {
    /**
     * Handle purchase requests from Superwall
     * Fetches product from RevenueCat and executes purchase
     */
    onPurchase: async (params) => {
      try {
        console.log('[SuperwallPurchaseController] Purchase requested:', params.productId);
        console.log('[SuperwallPurchaseController] Full params:', JSON.stringify(params));

        // Fetch product from RevenueCat
        console.log('[SuperwallPurchaseController] Fetching product from RevenueCat...');
        const products = await Purchases.getProducts([params.productId]);
        console.log('[SuperwallPurchaseController] Products found:', products.length);

        const product = products[0];

        if (!product) {
          console.error('[SuperwallPurchaseController] ❌ Product not found in RevenueCat!');
          console.error('[SuperwallPurchaseController] Requested product ID:', params.productId);
          console.error('[SuperwallPurchaseController] This usually means:');
          console.error('[SuperwallPurchaseController] 1. Product ID mismatch between Superwall and RevenueCat');
          console.error('[SuperwallPurchaseController] 2. Product not configured in App Store Connect');
          console.error('[SuperwallPurchaseController] 3. RevenueCat not properly synced with App Store');
          return { type: 'failed', error: 'Product not found. Please contact support.' };
        }

        // Log product details for debugging
        console.log('[SuperwallPurchaseController] Product found:', {
          identifier: product.identifier,
          productType: product.productType,
          title: product.title,
          priceString: product.priceString,
        });

        // Execute purchase through RevenueCat
        console.log('[SuperwallPurchaseController] Purchasing product via RevenueCat...');
        const purchaseResult = await Purchases.purchaseStoreProduct(product);

        console.log('[SuperwallPurchaseController] ✅ Purchase successful!');
        console.log('[SuperwallPurchaseController] Customer info:', {
          activeEntitlements: Object.keys(purchaseResult.customerInfo.entitlements.active),
        });

        return { type: 'purchased' };
      } catch (error) {
        // Handle user cancellation
        if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          console.log('[SuperwallPurchaseController] Purchase cancelled by user');
          return { type: 'cancelled' };
        }

        // Handle product already owned
        if (error.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
          console.log('[SuperwallPurchaseController] Product already purchased - treating as success');
          return { type: 'purchased' };
        }

        // Handle other errors with detailed logging
        console.error('[SuperwallPurchaseController] ❌ Purchase failed:', error);
        console.error('[SuperwallPurchaseController] Error code:', error.code);
        console.error('[SuperwallPurchaseController] Error message:', error.message);
        console.error('[SuperwallPurchaseController] Error details:', JSON.stringify(error));

        return { type: 'failed', error: error.message || 'Purchase failed. Please try again.' };
      }
    },

    /**
     * Handle restore requests from Superwall
     * Routes to RevenueCat's restore purchases
     */
    onPurchaseRestore: async () => {
      try {
        console.log('[SuperwallPurchaseController] Restore purchases requested');
        const customerInfo = await Purchases.restorePurchases();

        const activeEntitlements = Object.keys(customerInfo.entitlements.active);
        console.log('[SuperwallPurchaseController] ✅ Restore successful');
        console.log('[SuperwallPurchaseController] Active entitlements:', activeEntitlements);

        if (activeEntitlements.length > 0) {
          console.log('[SuperwallPurchaseController] Purchases restored successfully');
        } else {
          console.log('[SuperwallPurchaseController] No purchases to restore');
        }

        return { type: 'restored' };
      } catch (error) {
        console.error('[SuperwallPurchaseController] ❌ Restore failed:', error);
        console.error('[SuperwallPurchaseController] Error details:', JSON.stringify(error));
        return { type: 'failed', error: error.message || 'Restore failed. Please try again.' };
      }
    },
  };

  return (
    <CustomPurchaseControllerProvider controller={purchaseController}>
      {children}
    </CustomPurchaseControllerProvider>
  );
};

export default SuperwallPurchaseController;
