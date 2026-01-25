import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_API_KEY_IOS = 'appl_mrfQufZNpGpdmPAJsnBZtNWGLKO';
const REVENUECAT_API_KEY_ANDROID = ''; // Add your Android key when ready

// Entitlement ID - this should match what you set in RevenueCat dashboard
const ENTITLEMENT_ID = 'Pro';

// Track if already initialized to prevent re-initialization
let isInitialized = false;

/**
 * Initialize RevenueCat
 * Call this once when the app starts
 */
export const initializePurchases = async (userId = null) => {
  // Prevent re-initialization
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized, skipping');
    return;
  }

  try {
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn('[RevenueCat] API key not configured for this platform');
      throw new Error('RevenueCat API key not configured');
    }

    console.log('[RevenueCat] Configuring...');

    // Add timeout to prevent hanging (10 seconds max)
    const configurePromise = Purchases.configure({ apiKey });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RevenueCat configure timeout')), 10000)
    );

    await Promise.race([configurePromise, timeoutPromise]);

    // If user is logged in, identify them
    if (userId) {
      const loginPromise = Purchases.logIn(userId);
      const loginTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RevenueCat login timeout')), 5000)
      );
      await Promise.race([loginPromise, loginTimeoutPromise]);
    }

    isInitialized = true;
    console.log('[RevenueCat] ✅ Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] ❌ Failed to initialize:', error);
    isInitialized = false;
    throw error; // Re-throw so caller knows it failed
  }
};

/**
 * Check if user has Pro subscription
 * @returns {Promise<boolean>}
 */
export const checkProAccess = async () => {
  try {
    if (!isInitialized) {
      console.warn('[RevenueCat] Not initialized, cannot check Pro access');
      return false;
    }

    // Add timeout to prevent hanging
    const customerInfoPromise = Purchases.getCustomerInfo();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('checkProAccess timeout')), 5000)
    );

    const customerInfo = await Promise.race([customerInfoPromise, timeoutPromise]);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('[RevenueCat] Failed to check subscription:', error);
    return false;
  }
};

/**
 * Get available packages/offerings
 * @returns {Promise<Array>}
 */
export const getOfferings = async () => {
  try {
    if (!isInitialized) {
      console.warn('[RevenueCat] Not initialized, cannot get offerings');
      return [];
    }

    // Add timeout to prevent hanging
    const offeringsPromise = Purchases.getOfferings();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getOfferings timeout')), 5000)
    );

    const offerings = await Promise.race([offeringsPromise, timeoutPromise]);
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
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

/**
 * Present RevenueCat Paywall (configured in RevenueCat dashboard)
 * @param {string} offering - Optional offering identifier
 * @returns {Promise<{success: boolean, customerInfo?: Object}>}
 */
export const presentPaywall = async (offering = null) => {
  try {
    if (!isInitialized) {
      console.warn('[RevenueCat] Not initialized, cannot present paywall');
      return { success: false, error: 'Not initialized' };
    }

    console.log('[RevenueCat] Presenting paywall...');

    // Present the paywall - this will show the UI you configured in RevenueCat dashboard
    const paywallResult = await Purchases.presentPaywall(offering ? { offering } : {});

    console.log('[RevenueCat] Paywall result:', paywallResult);

    // Check if user made a purchase
    const customerInfo = await Purchases.getCustomerInfo();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    return {
      success: true,
      isPro,
      customerInfo,
      purchased: isPro,
    };
  } catch (error) {
    // User cancelled or error occurred
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled paywall');
      return { success: true, cancelled: true, isPro: false };
    }

    console.error('[RevenueCat] Failed to present paywall:', error);
    return { success: false, error };
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
  presentPaywall,
};

