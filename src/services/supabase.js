import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

// Supabase configuration
const SUPABASE_URL = 'https://zltkngnohnpaiowffpqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdGtuZ25vaG5wYWlvd2ZmcHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDE0MjUsImV4cCI6MjA4NDI3NzQyNX0.pi7bIcokmSYR2Y0MJqvrMie9MHjWzRU2XpspNXfDw8Y';

// Create Supabase client with AsyncStorage for session persistence
let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a basic client without storage as fallback
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Sign up a new user with email and password
 */
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get the current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Get the current user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Reset password for email
 */
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * Check if Apple Sign In is available on this device
 */
export const isAppleSignInAvailable = async () => {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error('Error checking Apple Sign In availability:', error);
    return false;
  }
};

/**
 * Sign in with Apple
 */
export const signInWithApple = async () => {
  try {
    // Generate a random nonce for security
    const rawNonce = Array.from(
      { length: 32 },
      () => Math.random().toString(36).charAt(2)
    ).join('');
    
    // Hash the nonce using SHA256
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    // Sign in with Supabase using the Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) throw error;

    // If this is a new user, create their profile with Apple data
    if (data.user) {
      const fullName = credential.fullName;
      const displayName = fullName 
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
        : null;

      // Check if profile exists, if not create one
      const existingProfile = await getUserProfile(data.user.id);
      if (!existingProfile) {
        await upsertUserProfile({
          id: data.user.id,
          email: data.user.email || credential.email,
          full_name: displayName,
          avatar_url: null,
          created_at: new Date().toISOString(),
        });
      }
    }

    return { data, error: null };
  } catch (error) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // User canceled the sign in
      return { data: null, error: { message: 'Sign in was canceled' } };
    }
    console.error('Apple Sign In error:', error);
    return { data: null, error };
  }
};

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Fetch user profile from profiles table
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
};

/**
 * Create or update user profile
 */
export const upsertUserProfile = async (profile) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Save daily meal log
 */
export const saveMealLog = async (mealData) => {
  const { data, error } = await supabase
    .from('meal_logs')
    .insert(mealData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Get meal logs for a specific date
 */
export const getMealLogs = async (userId, date) => {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Get meal logs for a date range
 */
export const getMealLogsRange = async (userId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Delete a meal log
 */
export const deleteMealLog = async (mealId) => {
  const { error } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', mealId);
  
  if (error) throw error;
};

/**
 * Save workout log
 */
export const saveWorkoutLog = async (workoutData) => {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert(workoutData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Get workout logs for a specific date
 */
export const getWorkoutLogs = async (userId, date) => {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

/**
 * Save daily progress/checklist
 */
export const saveDailyProgress = async (progressData) => {
  const { data, error } = await supabase
    .from('daily_progress')
    .upsert(progressData, { onConflict: 'user_id,date' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Get daily progress for a specific date
 */
export const getDailyProgress = async (userId, date) => {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

/**
 * Save user goals/targets
 */
export const saveUserGoals = async (goalsData) => {
  const { data, error } = await supabase
    .from('user_goals')
    .upsert(goalsData, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Get user goals
 */
export const getUserGoals = async (userId) => {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// ============================================
// STORAGE HELPERS
// ============================================

/**
 * Upload an image to Supabase storage
 */
export const uploadImage = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) throw error;
  return data;
};

/**
 * Get public URL for an image
 */
export const getImageUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Delete an image from storage
 */
export const deleteImage = async (bucket, path) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
};

export default supabase;
