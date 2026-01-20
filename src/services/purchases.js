import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_API_KEY_IOS = 'appl_mrfQufZNpGpdmPAJsnBZtNWGLKO';
const REVENUECAT_API_KEY_ANDROID = ''; // Add your Android key when ready

// Entitlement ID - this should match what you set in RevenueCat dashboard
const ENTITLEMENT_ID = 'pro';

/**
 * Initialize RevenueCat
 * Call this once when the app starts
 */
export const initializePurchases = async (userId = null) => {
  try {
    const apiKey = Platform.OS === 'ios' 
      ? REVENUECAT_API_KEY_IOS 
      : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn('RevenueCat API key not configured for this platform');
      return;
    }

    // Configure RevenueCat
    await Purchases.configure({ apiKey });

    // If user is logged in, identify them
    if (userId) {
      await Purchases.logIn(userId);
    }

    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};

/**
 * Check if user has Pro subscription
 * @returns {Promise<boolean>}
 */
export const checkProAccess = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return false;
  }
};

/**
 * Get available packages/offerings
 * @returns {Promise<Array>}
 */
export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return [];
  }
};

/**
 * Purchase a package
 * @param {Object} package - The package to purchase
 * @returns {Promise<{success: boolean, customerInfo: Object}>}
 */
export const purchasePackage = async (pkg) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    return {
      success: isPro,
      customerInfo,
    };
  } catch (error) {
    if (error.userCancelled) {
      console.log('User cancelled purchase');
      return { success: false, cancelled: true };
    }
    console.error('Purchase failed:', error);
    return { success: false, error };
  }
};

/**
 * Restore purchases - IMPORTANT for existing subscribers!
 * Call this when:
 * 1. User taps "Restore Purchases" button
 * 2. On first app launch for returning users
 * @returns {Promise<{success: boolean, isPro: boolean}>}
 */
export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    return {
      success: true,
      isPro,
      customerInfo,
    };
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return { success: false, isPro: false, error };
  }
};

/**
 * Identify user when they log in
 * This links their purchases to their account
 * @param {string} userId - Your app's user ID (e.g., Supabase user ID)
 */
export const identifyUser = async (userId) => {
  try {
    await Purchases.logIn(userId);
    console.log('User identified with RevenueCat:', userId);
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
};

/**
 * Log out user from RevenueCat
 * Call this when user logs out of your app
 */
export const logoutUser = async () => {
  try {
    await Purchases.logOut();
    console.log('User logged out from RevenueCat');
  } catch (error) {
    console.error('Failed to logout from RevenueCat:', error);
  }
};

/**
 * Get customer info
 * @returns {Promise<Object>}
 */
export const getCustomerInfo = async () => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Failed to get customer info:', error);
    return null;
  }
};

export default {
  initializePurchases,
  checkProAccess,
  getOfferings,
  purchasePackage,
  restorePurchases,
  identifyUser,
  logoutUser,
  getCustomerInfo,
};

