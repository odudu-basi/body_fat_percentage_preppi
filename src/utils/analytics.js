/**
 * Analytics & Tracking Service (Mixpanel)
 * Centralized event tracking for app analytics
 */

import Constants from 'expo-constants';

// ANALYTICS ENABLED
const ANALYTICS_DISABLED = false;

// Safely import MIXPANEL_TOKEN - may not be available in all builds
let MIXPANEL_TOKEN = null;
try {
  const envModule = require('@env');
  MIXPANEL_TOKEN = envModule.MIXPANEL_TOKEN;
} catch (e) {
  console.log('[Analytics] @env not available, using fallback');
  // Fallback token for production builds
  MIXPANEL_TOKEN = '2092ea973e49cfaa46272b8a96d62f72';
}

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import Mixpanel only in production
let Mixpanel = null;
if (!isExpoGo) {
  try {
    const MixpanelModule = require('mixpanel-react-native');
    Mixpanel = MixpanelModule.Mixpanel;
  } catch (e) {
    console.log('[Analytics] Mixpanel not available');
  }
}

let mixpanel = null;
let isInitialized = false; // Track initialization state

/**
 * Initialize Mixpanel
 * Call this once when the app starts
 * Note: Only works in production builds, not in Expo Go
 */
export const initAnalytics = async () => {
  if (ANALYTICS_DISABLED) {
    console.log('[Analytics] 🚫 DISABLED - Skipping initialization');
    return;
  }

  // Prevent re-initialization if already initialized
  if (isInitialized || mixpanel) {
    console.log('[Analytics] Already initialized, skipping');
    return;
  }

  try {
    // Skip in Expo Go
    if (isExpoGo) {
      console.log('[Analytics] 🔧 DEV MODE: Skipping Mixpanel (Expo Go detected)');
      console.log('[Analytics] Analytics will work in production builds');
      return;
    }

    // Fallback to hardcoded token if env import fails
    const token = MIXPANEL_TOKEN || '2092ea973e49cfaa46272b8a96d62f72';

    console.log('[Analytics] Initializing Mixpanel...');

    if (!token) {
      console.warn('[Analytics] MIXPANEL_TOKEN not found - analytics disabled');
      return;
    }

    if (!Mixpanel) {
      console.warn('[Analytics] Mixpanel SDK not available - analytics disabled');
      return;
    }

    try {
      // Add timeout to prevent hanging
      const initPromise = Mixpanel.init(token);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Mixpanel init timeout')), 5000)
      );

      mixpanel = await Promise.race([initPromise, timeoutPromise]);
      isInitialized = true; // Mark as initialized
      console.log('[Analytics] ✅ Mixpanel initialized successfully');
    } catch (initError) {
      console.error('[Analytics] Mixpanel init failed:', initError);
      // Don't throw - app should still work without analytics
      mixpanel = null;
      isInitialized = false;
    }
  } catch (error) {
    console.error('[Analytics] Failed to initialize Mixpanel:', error);
    // Gracefully fail - don't crash the app
    mixpanel = null;
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {object} properties - Additional event properties
 */
export const trackEvent = (eventName, properties = {}) => {
  if (ANALYTICS_DISABLED) {
    // Silent no-op - don't spam console
    return;
  }

  // Check both mixpanel instance AND initialization flag
  if (!mixpanel || !isInitialized) {
    // Silent fail in Expo Go - don't spam console
    if (!isExpoGo) {
      console.warn('[Analytics] Mixpanel not initialized, skipping event:', eventName);
    }
    return;
  }

  try {
    // Call async but don't await - fire and forget
    // Wrap in setTimeout to ensure it runs on next tick (not blocking)
    setTimeout(() => {
      try {
        mixpanel.track(eventName, properties);
        console.log(`[Analytics] Event tracked: ${eventName}`, properties);
      } catch (err) {
        console.error(`[Analytics] Error in track callback:`, err);
      }
    }, 0);
  } catch (error) {
    console.error(`[Analytics] Error tracking event ${eventName}:`, error);
  }
};

/**
 * Identify a user
 * @param {string} userId - Unique user identifier
 * @param {object} userProperties - User profile properties (IGNORED - not used to prevent crashes)
 */
export const identifyUser = (userId, userProperties = {}) => {
  if (ANALYTICS_DISABLED) {
    // Silent no-op
    return;
  }

  // CRITICAL: Check both mixpanel AND initialization flag
  if (!mixpanel || !isInitialized) {
    console.warn('[Analytics] Mixpanel not initialized, skipping identifyUser');
    return;
  }

  try {
    // Wrap in setTimeout to prevent Promise crashes
    setTimeout(() => {
      try {
        // SAFE: Only identify user, DO NOT set properties
        mixpanel.identify(userId);
        console.log(`[Analytics] User identified: ${userId}`);

        // NOTE: User properties are NOT set to prevent native Promise crashes
        // Event tracking still works perfectly without user profiles
        if (Object.keys(userProperties).length > 0) {
          console.log(`[Analytics] User properties skipped (crash prevention):`, Object.keys(userProperties));
        }
      } catch (err) {
        console.error('[Analytics] Error in identify callback:', err);
      }
    }, 0);
  } catch (error) {
    console.error('[Analytics] Error identifying user:', error);
  }
};

/**
 * Reset user (on logout)
 */
export const resetUser = () => {
  if (ANALYTICS_DISABLED) {
    // Silent no-op
    return;
  }

  if (!mixpanel || !isInitialized) {
    console.warn('[Analytics] Mixpanel not initialized, skipping resetUser');
    return;
  }

  try {
    // Wrap in setTimeout to prevent Promise crashes
    setTimeout(() => {
      try {
        mixpanel.reset();
        console.log('[Analytics] User reset');
      } catch (err) {
        console.error('[Analytics] Error in reset callback:', err);
      }
    }, 0);
  } catch (error) {
    console.error('[Analytics] Error resetting user:', error);
  }
};

/**
 * Set user properties
 * @param {object} properties - Properties to set for the user
 */
export const setUserProperties = (properties) => {
  if (ANALYTICS_DISABLED) {
    // Silent no-op
    return;
  }

  if (!mixpanel || !isInitialized) {
    console.warn('[Analytics] Mixpanel not initialized, skipping setUserProperties');
    return;
  }

  try {
    // DISABLED: getPeople().set() causes native Promise crashes
    // This function is now a no-op to prevent crashes
    console.log('[Analytics] User properties skipped (crash prevention):', Object.keys(properties));

    // NOTE: Event tracking still works perfectly without user profiles
    // We're sacrificing user profile data to prevent app crashes
  } catch (error) {
    console.error('[Analytics] Error in setUserProperties:', error);
  }
};

// ===========================================
// PREDEFINED EVENT TRACKING FUNCTIONS
// ===========================================

// Button Press Events
export const trackButtonPress = (buttonName, location, additionalProps = {}) => {
  trackEvent('Button Pressed', {
    button_name: buttonName,
    screen: location,
    ...additionalProps,
  });
};

// Exercise Events
export const trackExercisePress = (exerciseTitle, exerciseType, isCompleted) => {
  const eventName = exerciseType === 'cardio' ? 'Cardio Exercise Pressed' : 'Weightlifting Exercise Pressed';
  trackEvent(eventName, {
    exercise_title: exerciseTitle,
    is_completed: isCompleted,
  });
};

export const trackExerciseToggle = (exerciseTitle, exerciseType, newStatus) => {
  trackEvent('Exercise Toggled', {
    exercise_title: exerciseTitle,
    exercise_type: exerciseType,
    completed: newStatus,
  });
};

// Checklist Events
export const trackChecklistItemPress = (itemTitle, isCompleted) => {
  trackEvent('Checklist Item Pressed', {
    item_title: itemTitle,
    is_completed: isCompleted,
  });
};

export const trackChecklistToggle = (itemTitle, newStatus) => {
  trackEvent('Checklist Item Toggled', {
    item_title: itemTitle,
    completed: newStatus,
  });
};

// Nutrition Events
export const trackMealLog = (mealType, calories, hasPhoto) => {
  trackEvent('Meal Logged', {
    meal_type: mealType,
    calories: calories,
    has_photo: hasPhoto,
  });
};

export const trackMealPhotoCapture = (source) => {
  trackEvent('Meal Photo Captured', {
    source: source, // 'camera' or 'library'
  });
};

export const trackMealDelete = (mealType, calories) => {
  trackEvent('Meal Deleted', {
    meal_type: mealType,
    calories: calories,
  });
};

// Body Scan Events
export const trackBodyScanStart = () => {
  trackEvent('Body Scan Started');
};

export const trackBodyScanComplete = (bodyFatPercentage, confidenceLevel) => {
  trackEvent('Body Scan Completed', {
    body_fat_percentage: bodyFatPercentage,
    confidence_level: confidenceLevel,
  });
};

export const trackScanButtonPress = (location) => {
  trackEvent('Scan Button Pressed', {
    screen: location,
  });
};

// Logo/Branding Events
export const trackLogoPress = (location) => {
  trackEvent('Logo Pressed', {
    screen: location,
  });
};

// Navigation Events
export const trackScreenView = (screenName) => {
  trackEvent('Screen Viewed', {
    screen_name: screenName,
  });
};

export const trackTabChange = (fromTab, toTab) => {
  trackEvent('Tab Changed', {
    from_tab: fromTab,
    to_tab: toTab,
  });
};

// Buddy Chat Events
export const trackBuddyMessageSent = (messageLength, suggestionUsed) => {
  trackEvent('Buddy Message Sent', {
    message_length: messageLength,
    used_suggestion: suggestionUsed,
  });
};

export const trackBuddySuggestionPress = (suggestion) => {
  trackEvent('Buddy Suggestion Pressed', {
    suggestion: suggestion,
  });
};

// Profile Events
export const trackProfileEdit = (field, oldValue, newValue) => {
  trackEvent('Profile Edited', {
    field: field,
    old_value: oldValue,
    new_value: newValue,
  });
};

export const trackDifficultyChange = (oldDifficulty, newDifficulty) => {
  trackEvent('Difficulty Changed', {
    old_difficulty: oldDifficulty,
    new_difficulty: newDifficulty,
  });
};

// Onboarding Events
export const trackOnboardingStep = (stepName, stepNumber) => {
  trackEvent('Onboarding Step Completed', {
    step_name: stepName,
    step_number: stepNumber,
  });
};

export const trackOnboardingComplete = (totalTime) => {
  trackEvent('Onboarding Completed', {
    total_time_seconds: totalTime,
  });
};

// Subscription Events
export const trackPaywallView = () => {
  trackEvent('Paywall Viewed');
};

export const trackSubscriptionPurchase = (productId, price) => {
  trackEvent('Subscription Purchased', {
    product_id: productId,
    price: price,
  });
};

// Session Events
export const trackAppOpen = () => {
  trackEvent('App Opened');
};

export const trackAppClose = () => {
  trackEvent('App Closed');
};

export default {
  initAnalytics,
  trackEvent,
  identifyUser,
  resetUser,
  setUserProperties,
  trackButtonPress,
  trackExercisePress,
  trackExerciseToggle,
  trackChecklistItemPress,
  trackChecklistToggle,
  trackMealLog,
  trackMealPhotoCapture,
  trackMealDelete,
  trackBodyScanStart,
  trackBodyScanComplete,
  trackScanButtonPress,
  trackLogoPress,
  trackScreenView,
  trackTabChange,
  trackBuddyMessageSent,
  trackBuddySuggestionPress,
  trackProfileEdit,
  trackDifficultyChange,
  trackOnboardingStep,
  trackOnboardingComplete,
  trackPaywallView,
  trackSubscriptionPurchase,
  trackAppOpen,
  trackAppClose,
};
