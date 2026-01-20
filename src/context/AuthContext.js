import React, { createContext, useState, useEffect, useContext } from 'react';
import Constants from 'expo-constants';
import {
  supabase,
  getSession,
  getUserProfile,
  upsertUserProfile,
  signOut as supabaseSignOut,
  onAuthStateChange,
  signInWithApple,
  isAppleSignInAvailable,
} from '../services/supabase';

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

    const initializeAuth = async () => {
      try {
        // Get initial session
        const currentSession = await getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser(currentSession.user);
          // Fetch user profile
          try {
            const userProfile = await getUserProfile(currentSession.user.id);
            setProfile(userProfile);
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    try {
      const authListener = onAuthStateChange(async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        
        if (newSession?.user) {
          setUser(newSession.user);
          // Fetch updated profile
          try {
            const userProfile = await getUserProfile(newSession.user.id);
            setProfile(userProfile);
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      });
      
      if (authListener?.data?.subscription) {
        subscription = authListener.data.subscription;
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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

      setUser(devUser);
      setProfile(profileData);
      setSession({ user: devUser });

      return { data: { user: devUser, session: { user: devUser } }, error: null };
    } catch (error) {
      console.error('Dev mode sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Apple handler
  const signInApple = async (onboardingData = {}) => {
    try {
      setLoading(true);
      const { data, error } = await signInWithApple();

      if (error) {
        console.error('Apple Sign In error:', error);
        return { data: null, error };
      }

      if (data?.user) {
        // Fetch the profile after sign in
        try {
          let userProfile = await getUserProfile(data.user.id);

          // Save onboarding data to profile if provided
          if (Object.keys(onboardingData).length > 0) {
            console.log('Saving onboarding data to profile:', onboardingData);

            // Process onboarding data
            const profileUpdates = {
              gender: onboardingData.gender,
              birthday: onboardingData.birthday,
              height_cm: onboardingData.height_cm,
              weight_kg: onboardingData.weight_kg,
              ethnicity: onboardingData.ethnicity,
              workout_frequency: onboardingData.workoutFrequency,
              water_intake_liters: onboardingData.waterIntake,
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

            // Update profile with onboarding data
            const updatedProfile = {
              ...userProfile,
              ...profileUpdates,
              id: data.user.id,
            };

            userProfile = await upsertUserProfile(updatedProfile);
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
    signOut,
    updateProfile,
    refreshProfile,
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
