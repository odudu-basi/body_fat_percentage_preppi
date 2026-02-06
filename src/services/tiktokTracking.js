/**
 * TikTok Ads Event Tracking Service - Native SDK Implementation
 * Uses expo-tiktok-ads-events native module for proper mobile attribution.
 */

import Constants from 'expo-constants';
import TiktokAdsEvents, {
  TikTokStandardEvents,
  TikTokLaunchApp as SDKLaunchApp,
  TikTokIdentify as SDKIdentify,
  TikTokWaitForConfig,
} from 'expo-tiktok-ads-events';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const isExpoGo = Constants.appOwnership === 'expo';

// ---------------------------------------------------------------------------
// Credentials (loaded from .env)
// NOTE: For native SDK, you need: ACCESS_TOKEN, APP_ID, TIKTOK_APP_ID
// Get these from TikTok Ads Manager (different from pixel_id/app_secret)
// ---------------------------------------------------------------------------
let TIKTOK_ACCESS_TOKEN, TIKTOK_APP_ID, TIKTOK_TIKTOK_APP_ID;
try {
  const env = require('@env');
  TIKTOK_ACCESS_TOKEN = env.TIKTOK_ACCESS_TOKEN;
  TIKTOK_APP_ID = env.TIKTOK_APP_ID;
  TIKTOK_TIKTOK_APP_ID = env.TIKTOK_TIKTOK_APP_ID;
} catch (e) {
  console.log('[TikTok] @env not available, credentials not loaded');
}

// SDK initialization state
let isInitialized = false;
let initializationPromise = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize TikTok SDK with proper flow:
 * 1. Request tracking permission (iOS 14+)
 * 2. Initialize SDK
 * 3. Wait for config to be fetched
 */
export const initializeTikTokSDK = async () => {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('[TikTok] Already initialized');
    return true;
  }

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    // Dev mode: log only
    if (isExpoGo) {
      console.log('[TikTok] DEV MODE — SDK not initialized in Expo Go');
      isInitialized = false;
      return false;
    }

    if (!TIKTOK_ACCESS_TOKEN || !TIKTOK_APP_ID || !TIKTOK_TIKTOK_APP_ID) {
      console.warn('[TikTok] Missing credentials — SDK not initialized');
      console.warn('[TikTok] Need: TIKTOK_ACCESS_TOKEN, TIKTOK_APP_ID, TIKTOK_TIKTOK_APP_ID');
      isInitialized = false;
      return false;
    }

    try {
      console.log('[TikTok] Step 1: Requesting tracking permission...');
      // Step 1: Request tracking permission (iOS 14+)
      const { status } = await requestTrackingPermissionsAsync();
      console.log('[TikTok] Tracking permission status:', status);

      console.log('[TikTok] Step 2: Initializing SDK...');
      // Step 2: Initialize SDK
      const result = await TiktokAdsEvents.initializeSdk(
        TIKTOK_ACCESS_TOKEN,
        TIKTOK_APP_ID,
        TIKTOK_TIKTOK_APP_ID,
        __DEV__ // Enable debug mode in development
      );
      console.log('[TikTok] SDK initialized:', result);

      console.log('[TikTok] Step 3: Waiting for config (10s timeout)...');
      // Step 3: Wait for global config to be fetched (10 second timeout)
      const configFetched = await TikTokWaitForConfig(10 * 1000);

      if (!configFetched) {
        console.warn('[TikTok] Config not loaded within timeout');
        isInitialized = false;
        return false;
      }

      console.log('[TikTok] ✅ SDK fully initialized and ready');
      isInitialized = true;

      // Get debug info
      try {
        const anonymousId = await TiktokAdsEvents.getAnonymousID();
        const testCode = await TiktokAdsEvents.getTestEventCode();
        console.log('[TikTok] Anonymous ID:', anonymousId);
        console.log('[TikTok] Test Event Code:', testCode);
        console.log('[TikTok] Use test code in TikTok Events Manager to verify events');
      } catch (debugError) {
        console.log('[TikTok] Could not get debug info:', debugError.message);
      }

      return true;
    } catch (error) {
      console.error('[TikTok] ❌ Initialization failed:', error);
      isInitialized = false;
      return false;
    }
  })();

  return initializationPromise;
};

// ---------------------------------------------------------------------------
// Helper: Safe event tracking (only if SDK is initialized)
// ---------------------------------------------------------------------------

/**
 * Track event only if SDK is initialized
 */
async function trackEventSafe(trackFunction) {
  if (isExpoGo) {
    console.log('[TikTok] DEV MODE — event not sent in Expo Go');
    return;
  }

  if (!isInitialized) {
    console.warn('[TikTok] SDK not initialized — event not sent');
    return;
  }

  try {
    await trackFunction();
  } catch (error) {
    console.error('[TikTok] ❌ Event tracking failed:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Public event functions (map to TikTok's standard event names)
// ---------------------------------------------------------------------------

/** App was launched / opened */
export const trackTikTokLaunchApp = async () => {
  console.log('[TikTok] Tracking: LaunchApp');
  await trackEventSafe(async () => {
    await SDKLaunchApp();
  });
};

/** New user completed registration */
export const trackTikTokRegistration = async (email) => {
  console.log('[TikTok] Tracking: Registration');
  await trackEventSafe(async () => {
    // Identify user first
    if (email) {
      await SDKIdentify({ email });
    }
    // Track registration event
    await TiktokAdsEvents.trackTTEvent(TikTokStandardEvents.registration);
  });
};

/** Existing user logged in */
export const trackTikTokLogin = async (email) => {
  console.log('[TikTok] Tracking: Login');
  await trackEventSafe(async () => {
    // Identify user first
    if (email) {
      await SDKIdentify({ email });
    }
    // Track login event
    await TiktokAdsEvents.trackTTEvent(TikTokStandardEvents.login);
  });
};

/** User finished onboarding / tutorial */
export const trackTikTokCompleteTutorial = async () => {
  console.log('[TikTok] Tracking: CompleteTutorial');
  await trackEventSafe(async () => {
    await TiktokAdsEvents.trackTTEvent(TikTokStandardEvents.complete_tutorial);
  });
};

/** User viewed main content (home screen) */
export const trackTikTokViewContent = async () => {
  console.log('[TikTok] Tracking: ViewContent');
  await trackEventSafe(async () => {
    await TiktokAdsEvents.trackTTEvent(TikTokStandardEvents.launch_app);
  });
};

/** User subscribed (subscription confirmed) */
export const trackTikTokSubscribe = async (price = 0, currency = 'USD') => {
  console.log('[TikTok] Tracking: Subscribe', { price, currency });
  await trackEventSafe(async () => {
    await TiktokAdsEvents.trackTTEvent(TikTokStandardEvents.subscribe, [
      { key: 'currency', value: currency },
      { key: 'value', value: price },
      { key: 'content_type', value: 'subscription' },
      { key: 'content_id', value: 'pro_subscription' },
    ]);
  });
};

/** Purchase event with content details */
export const trackTikTokPurchase = async (price = 0, currency = 'USD') => {
  console.log('[TikTok] Tracking: Purchase', { price, currency });
  await trackEventSafe(async () => {
    await TiktokAdsEvents.trackTTEvent(TikTokStandardEvents.subscribe, [
      { key: 'currency', value: currency },
      { key: 'value', value: price },
      { key: 'content_type', value: 'subscription' },
      { key: 'content_id', value: 'pro_subscription' },
      { key: 'quantity', value: 1 },
    ]);
  });
};

/** Free trial started */
export const trackTikTokStartTrial = async () => {
  console.log('[TikTok] Tracking: StartTrial');
  await trackEventSafe(async () => {
    await TiktokAdsEvents.trackTTEvent(TikTokStandardEvents.start_trial);
  });
};

/** Identify user with additional info */
export const identifyTikTokUser = async (userData) => {
  console.log('[TikTok] Identifying user');
  await trackEventSafe(async () => {
    await SDKIdentify(userData);
  });
};

// Export initialization status checker
export const isTikTokInitialized = () => isInitialized;
