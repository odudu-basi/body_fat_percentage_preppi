import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  supabase,
  getSession,
  signOut as supabaseSignOut,
  onAuthStateChange,
  signInWithApple,
  isAppleSignInAvailable,
} from '../services/supabase';
import { getUserProfile, upsertUserProfile } from '../services/storage';
import { calculateNutritionTargets } from '../utils/calorieCalculator';

// Safely import analytics - don't crash if it fails
let identifyUser, resetUser, setUserProperties, trackOnboardingComplete;
try {
  const analytics = require('../utils/analytics');
  identifyUser = analytics.identifyUser || (() => {});
  resetUser = analytics.resetUser || (() => {});
  setUserProperties = analytics.setUserProperties || (() => {});
  trackOnboardingComplete = analytics.trackOnboardingComplete || (() => {});
} catch (e) {
  console.log('[AuthContext] Analytics not available');
  // Provide no-op functions if analytics fails to load
  identifyUser = () => {};
  resetUser = () => {};
  setUserProperties = () => {};
  trackOnboardingComplete = () => {};
}

// Safely import TikTok tracking
let trackTikTokRegistration, trackTikTokLogin, trackTikTokCompleteTutorial;
try {
  const tiktok = require('../services/tiktokTracking');
  trackTikTokRegistration = tiktok.trackTikTokRegistration || (() => {});
  trackTikTokLogin = tiktok.trackTikTokLogin || (() => {});
  trackTikTokCompleteTutorial = tiktok.trackTikTokCompleteTutorial || (() => {});
} catch (e) {
  console.log('[AuthContext] TikTok tracking not available');
  trackTikTokRegistration = () => {};
  trackTikTokLogin = () => {};
  trackTikTokCompleteTutorial = () => {};
}

const AuthContext = createContext(undefined);

// Check if we're running in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Dev mode bypass - set to true to skip authentication in Expo Go
// This will show onboarding but skip actual Apple Sign In
const DEV_MODE_BYPASS_AUTH = true;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);

  // Check Apple Sign In availability
  useEffect(() => {
    const checkAppleAvailability = async () => {
      const available = await isAppleSignInAvailable();
      setAppleSignInAvailable(available);
    };
    checkAppleAvailability();
  }, []);

  // Initialize auth state
  useEffect(() => {

    let subscription = null;
    let isMounted = true; // Prevent state updates after unmount

    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing auth state...');

        // Get initial session with timeout (more lenient in Expo Go)
        let currentSession = null;
        try {
          const sessionPromise = getSession();
          // In Expo Go, Supabase can be slower, so use longer timeout or skip timeout
          if (isExpoGo) {
            // In Expo Go, don't timeout - just wait for the call
            console.log('[AuthContext] 🔧 DEV MODE: Getting session without timeout');
            try {
              currentSession = await sessionPromise;
            } catch (err) {
              // In dev mode, session might not exist - that's ok
              console.log('[AuthContext] No session found in dev mode (expected)');
              currentSession = null;
            }
          } else {
            // In production, use timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('getSession timeout')), 10000)
            );
            currentSession = await Promise.race([sessionPromise, timeoutPromise]);
          }
        } catch (sessionError) {
          console.error('[AuthContext] Error getting session:', sessionError);
          currentSession = null;
        }

        if (!isMounted) {
          console.log('[AuthContext] Component unmounted during session fetch');
          return;
        }

        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);
          // Fetch user profile
          try {
            let userProfile = null;
            if (isExpoGo) {
              // In Expo Go, don't timeout - just wait
              console.log('[AuthContext] 🔧 DEV MODE: Getting profile without timeout');
              try {
                userProfile = await getUserProfile(currentSession.user.id);
              } catch (err) {
                console.log('[AuthContext] No profile found in dev mode (expected)');
                userProfile = null;
              }
            } else {
              // In production, use timeout
              const profilePromise = getUserProfile(currentSession.user.id);
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('getUserProfile timeout')), 5000)
              );
              userProfile = await Promise.race([profilePromise, timeoutPromise]);
            }

            if (isMounted && userProfile) {
              setProfile(userProfile);
              console.log('[AuthContext] User profile loaded');
            }
          } catch (profileError) {
            console.error('[AuthContext] Error fetching profile:', profileError);
            // Continue without profile - user is still authenticated
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
          console.log('[AuthContext] Auth initialized');
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    try {
      const authListener = onAuthStateChange(async (event, newSession) => {
        console.log('[AuthContext] Auth state changed:', event);

        if (!isMounted) {
          console.log('[AuthContext] Ignoring auth change - component unmounted');
          return;
        }

        setSession(newSession);

        if (newSession?.user) {
          setUser(newSession.user);
          // Fetch updated profile
          try {
            const userProfile = await getUserProfile(newSession.user.id);
            if (isMounted) {
              setProfile(userProfile);

              // Identify user in Mixpanel
              identifyUser(newSession.user.id, {
                email: newSession.user.email,
                gender: userProfile?.gender,
                age: userProfile?.age,
                fitness_goal: userProfile?.fitness_goal,
                difficulty: userProfile?.difficulty,
                activity_level: userProfile?.activity_level,
              });
            }
          } catch (error) {
            console.error('[AuthContext] Error fetching profile:', error);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            // Reset analytics user on logout
            resetUser();
          }
        }
      });

      if (authListener?.data?.subscription) {
        subscription = authListener.data.subscription;
      }
    } catch (error) {
      console.error('[AuthContext] Error setting up auth listener:', error);
    }

    return () => {
      isMounted = false; // Mark as unmounted
      subscription?.unsubscribe();
    };
  }, []); // Initialize once on mount

  // Dev mode sign in (bypasses Apple authentication)
  const signInDevMode = async (onboardingData = {}) => {
    if (!DEV_MODE_BYPASS_AUTH || !isExpoGo) {
      console.warn('Dev mode sign in only available in Expo Go with DEV_MODE_BYPASS_AUTH enabled');
      return { data: null, error: new Error('Not in dev mode') };
    }

    try {
      setLoading(true);
      console.log('🔧 DEV MODE: Bypassing authentication, going straight to app');
      console.log('🔧 DEV MODE: Onboarding data:', onboardingData);

      // Create a mock user
      const devUser = {
        id: 'dev-user',
        email: 'dev@example.com',
      };

      // Process onboarding data
      const profileData = {
        id: 'dev-user',
        full_name: 'Dev User',
        email: 'dev@example.com',
        gender: onboardingData.gender,
        birthday: onboardingData.birthday,
        height_cm: onboardingData.height_cm,
        weight_kg: onboardingData.weight_kg,
        ethnicity: onboardingData.ethnicity,
        workout_frequency: onboardingData.workoutFrequency,
        water_intake_liters: onboardingData.waterIntake,
        kitchen_items: onboardingData.kitchen_items || [],
        allergies: onboardingData.allergies || [],
        dietary_restriction: onboardingData.dietary_restriction || 'none',
        difficulty: onboardingData.difficulty || 'medium',
        activity_level: onboardingData.workoutFrequency === '6+' ? 'very_active'
          : onboardingData.workoutFrequency === '3-5' ? 'moderately_active'
          : 'lightly_active',
      };

      // Calculate age from birthday if provided
      if (onboardingData.birthday) {
        const birthDate = new Date(onboardingData.birthday);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        profileData.age = age;
      }

      // Calculate nutrition targets (calories + macros) with user's selected difficulty
      if (profileData.weight_kg && profileData.height_cm && profileData.age && profileData.gender) {
        const nutritionTargets = calculateNutritionTargets(profileData, profileData.difficulty);
        Object.assign(profileData, nutritionTargets);
        console.log('🔧 DEV MODE: Calculated nutrition targets:', nutritionTargets);
      }

      // Save profile data to AsyncStorage so it persists across app reloads
      const savedProfile = await upsertUserProfile(profileData);
      console.log('🔧 DEV MODE: Profile saved to AsyncStorage:', savedProfile);

      setUser(devUser);
      setProfile(savedProfile);
      setSession({ user: devUser });

      // Identify user in Mixpanel
      identifyUser(devUser.id, {
        email: devUser.email,
        gender: savedProfile?.gender,
        age: savedProfile?.age,
        fitness_goal: savedProfile?.fitness_goal,
        difficulty: savedProfile?.difficulty,
        activity_level: savedProfile?.activity_level,
      });

      // Track onboarding completion
      trackOnboardingComplete(0);

      // TikTok: dev mode counts as registration + tutorial complete
      trackTikTokRegistration(devUser.email);
      trackTikTokCompleteTutorial();

      return { data: { user: devUser, session: { user: devUser } }, error: null };
    } catch (error) {
      console.error('Dev mode sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with Email/Password
  const signUpWithEmail = async (email, password, onboardingData = {}) => {
    try {
      setLoading(true);
      console.log('📧 EMAIL SIGNUP: Starting with email:', email);
      console.log('📧 EMAIL SIGNUP: Onboarding data:', onboardingData);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Email signup error:', error);
        return { data: null, error };
      }

      if (data?.user) {
        console.log('✅ Email signup successful, user ID:', data.user.id);

        // Process and save onboarding data
        if (Object.keys(onboardingData).length > 0) {
          console.log('💾 Saving onboarding data to profile:', onboardingData);

          const profileUpdates = {
            gender: onboardingData.gender,
            birthday: onboardingData.birthday,
            height_cm: onboardingData.height_cm,
            weight_kg: onboardingData.weight_kg,
            target_weight_kg: onboardingData.target_weight_kg,
            target_body_fat_percentage: onboardingData.target_body_fat_percentage,
            ethnicity: onboardingData.ethnicity,
            workout_frequency: onboardingData.workoutFrequency,
            water_intake_liters: onboardingData.waterIntake,
            kitchen_items: onboardingData.kitchen_items || [],
            allergies: onboardingData.allergies || [],
            dietary_restriction: onboardingData.dietary_restriction || 'none',
            difficulty: onboardingData.difficulty || 'medium',
            activity_level: onboardingData.workoutFrequency === '6+' ? 'very_active'
              : onboardingData.workoutFrequency === '3-5' ? 'moderately_active'
              : 'lightly_active',
          };

          // Calculate age from birthday if provided
          if (onboardingData.birthday) {
            const birthDate = new Date(onboardingData.birthday);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            profileUpdates.age = age;
          }

          // Calculate nutrition targets
          const fullProfileData = { ...profileUpdates, id: data.user.id, email };
          if (fullProfileData.weight_kg && fullProfileData.height_cm && fullProfileData.age && fullProfileData.gender) {
            const difficulty = profileUpdates.difficulty || 'medium';
            const nutritionTargets = calculateNutritionTargets(fullProfileData, difficulty);
            Object.assign(profileUpdates, nutritionTargets);
            console.log('📊 Calculated nutrition targets:', nutritionTargets);
          }

          // Create profile
          const newProfile = {
            id: data.user.id,
            email,
            full_name: email.split('@')[0], // Use email prefix as name
            ...profileUpdates,
          };

          console.log('💾 About to save profile:', newProfile);
          const savedProfile = await upsertUserProfile(newProfile);
          console.log('✅ Profile saved successfully:', savedProfile);
          setProfile(savedProfile);

          // Identify user in Mixpanel
          identifyUser(data.user.id, {
            email: data.user.email,
            gender: savedProfile?.gender,
            age: savedProfile?.age,
            fitness_goal: savedProfile?.fitness_goal,
            difficulty: savedProfile?.difficulty,
            activity_level: savedProfile?.activity_level,
          });

          // Track onboarding completion for new users
          // Calculate time (this is a rough estimate since we don't track start time)
          trackOnboardingComplete(0); // We don't have exact time, so pass 0

          // TikTok: new user registered + tutorial done
          trackTikTokRegistration(email);
          trackTikTokCompleteTutorial();
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Email signup error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Email/Password
  const signInWithEmail = async (email, password, onboardingData = {}) => {
    try {
      setLoading(true);
      console.log('📧 EMAIL SIGNIN: Starting with email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Email signin error:', error);
        return { data: null, error };
      }

      if (data?.user) {
        console.log('✅ Email signin successful, user ID:', data.user.id);

        // Fetch and update profile if onboarding data provided
        try {
          let userProfile = await getUserProfile(data.user.id);

          if (Object.keys(onboardingData).length > 0) {
            console.log('💾 Updating profile with onboarding data');

            const profileUpdates = {
              gender: onboardingData.gender,
              birthday: onboardingData.birthday,
              height_cm: onboardingData.height_cm,
              weight_kg: onboardingData.weight_kg,
              ethnicity: onboardingData.ethnicity,
              workout_frequency: onboardingData.workoutFrequency,
              water_intake_liters: onboardingData.waterIntake,
              difficulty: onboardingData.difficulty || 'medium',
              activity_level: onboardingData.workoutFrequency === '6+' ? 'very_active'
                : onboardingData.workoutFrequency === '3-5' ? 'moderately_active'
                : 'lightly_active',
            };

            if (onboardingData.birthday) {
              const birthDate = new Date(onboardingData.birthday);
              const today = new Date();
              const age = today.getFullYear() - birthDate.getFullYear();
              profileUpdates.age = age;
            }

            const fullProfileData = { ...userProfile, ...profileUpdates, id: data.user.id };
            if (fullProfileData.weight_kg && fullProfileData.height_cm && fullProfileData.age && fullProfileData.gender) {
              const difficulty = profileUpdates.difficulty || 'medium';
              const nutritionTargets = calculateNutritionTargets(fullProfileData, difficulty);
              Object.assign(profileUpdates, nutritionTargets);
            }

            const updatedProfile = {
              ...userProfile,
              ...profileUpdates,
              id: data.user.id,
            };

            userProfile = await upsertUserProfile(updatedProfile);
            console.log('✅ Profile updated successfully');
          }

          setProfile(userProfile);

          // TikTok: returning user logged in
          trackTikTokLogin(email);
        } catch (profileError) {
          console.error('❌ Error fetching/updating profile:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Email signin error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Apple handler
  const signInApple = async (onboardingData = {}) => {
    try {
      setLoading(true);
      console.log('🍎 APPLE SIGN IN: Starting with onboarding data:', onboardingData);

      const { data, error } = await signInWithApple();

      if (error) {
        console.error('Apple Sign In error:', error);
        return { data: null, error };
      }

      if (data?.user) {
        console.log('✅ Apple Sign In successful, user ID:', data.user.id);

        // Fetch the profile after sign in
        try {
          let userProfile = await getUserProfile(data.user.id);
          console.log('📊 Fetched existing profile:', userProfile);

          // Save onboarding data to profile if provided
          if (Object.keys(onboardingData).length > 0) {
            console.log('💾 Saving onboarding data to profile:', onboardingData);

            // Process onboarding data
            const profileUpdates = {
              gender: onboardingData.gender,
              birthday: onboardingData.birthday,
              height_cm: onboardingData.height_cm,
              weight_kg: onboardingData.weight_kg,
              target_weight_kg: onboardingData.target_weight_kg,
              target_body_fat_percentage: onboardingData.target_body_fat_percentage,
              ethnicity: onboardingData.ethnicity,
              workout_frequency: onboardingData.workoutFrequency,
              water_intake_liters: onboardingData.waterIntake,
              kitchen_items: onboardingData.kitchen_items || [],
              allergies: onboardingData.allergies || [],
              dietary_restriction: onboardingData.dietary_restriction || 'none',
              difficulty: onboardingData.difficulty || 'medium',
              activity_level: onboardingData.workoutFrequency === '6+' ? 'very_active'
                : onboardingData.workoutFrequency === '3-5' ? 'moderately_active'
                : 'lightly_active',
            };

            // Calculate age from birthday if provided
            if (onboardingData.birthday) {
              const birthDate = new Date(onboardingData.birthday);
              const today = new Date();
              const age = today.getFullYear() - birthDate.getFullYear();
              profileUpdates.age = age;
            }

            // Calculate nutrition targets (calories + macros) with user's selected difficulty
            const fullProfileData = { ...userProfile, ...profileUpdates, id: data.user.id };
            if (fullProfileData.weight_kg && fullProfileData.height_cm && fullProfileData.age && fullProfileData.gender) {
              const difficulty = profileUpdates.difficulty || 'medium';
              const nutritionTargets = calculateNutritionTargets(fullProfileData, difficulty);
              Object.assign(profileUpdates, nutritionTargets);
              console.log('📊 Calculated nutrition targets with difficulty:', difficulty, nutritionTargets);
            }

            // Update profile with onboarding data
            const updatedProfile = {
              ...userProfile,
              ...profileUpdates,
              id: data.user.id,
            };

            userProfile = await upsertUserProfile(updatedProfile);

            // Track onboarding completion for new users with onboarding data
            trackOnboardingComplete(0);

            // TikTok: new user registered + tutorial done
            trackTikTokRegistration(data.user.email || null);
            trackTikTokCompleteTutorial();
          } else {
            // TikTok: returning user logged back in
            trackTikTokLogin(data.user.email || null);
          }

          setProfile(userProfile);
        } catch (profileError) {
          console.error('Error fetching profile after Apple sign in:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in with Apple error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const signOut = async () => {
    try {
      setLoading(true);
      await supabaseSignOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      // Reset analytics user
      resetUser();
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Update profile handler
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const updatedProfile = {
        ...profile,
        ...updates,
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      const result = await upsertUserProfile(updatedProfile);
      setProfile(result);

      // Update user properties in Mixpanel
      setUserProperties({
        gender: result?.gender,
        age: result?.age,
        fitness_goal: result?.fitness_goal,
        difficulty: result?.difficulty,
        activity_level: result?.activity_level,
        weight_kg: result?.weight_kg,
        height_cm: result?.height_cm,
      });
      return { data: result, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    try {
      if (!user) return null;
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Refresh profile error:', error);
      return null;
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setLoading(true);

      // Delete from Supabase database (works in both Expo Go and Production now)
      // Note: All related data (meal_logs, daily_checklists, body_scans, etc.)
      // will be automatically deleted via CASCADE when the profile is deleted
      console.log('🗑️ Deleting account from Supabase database...');

      if (!user?.id) {
        console.log('⚠️ No user ID found, clearing local state only');

        // Clear AsyncStorage if in Expo Go
        if (isExpoGo) {
          await AsyncStorage.clear();
          console.log('🔧 DEV MODE: Local storage cleared');
        }

        // Reset state
        setUser(null);
        setProfile(null);
        setSession(null);
        return { error: null };
      }

      // Delete user profile and all related data from Supabase
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('❌ Error deleting profile from database:', deleteError);
        throw deleteError;
      }

      console.log('✅ Profile and related data deleted from database');

      // Clear AsyncStorage if in Expo Go (just to be safe)
      if (isExpoGo) {
        await AsyncStorage.clear();
        console.log('🔧 DEV MODE: Local storage also cleared');
      }

      // Sign out to clear the session
      await supabaseSignOut();

      setUser(null);
      setProfile(null);
      setSession(null);

      return { error: null };
    } catch (error) {
      console.error('Delete account error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    initialized,
    isAuthenticated: !!user,
    appleSignInAvailable,
    signInApple,
    signInDevMode,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateProfile,
    refreshProfile,
    deleteAccount,
    supabase,
    isDevMode: DEV_MODE_BYPASS_AUTH && isExpoGo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
