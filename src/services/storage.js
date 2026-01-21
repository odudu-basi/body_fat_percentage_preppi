/**
 * Storage Abstraction Layer
 * Automatically switches between local storage (dev) and Supabase (production)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Detect if running in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';
const USE_LOCAL_STORAGE = isExpoGo;

console.log(`💾 Storage Mode: ${USE_LOCAL_STORAGE ? 'LOCAL (AsyncStorage)' : 'REMOTE (Supabase)'}`);

// Storage keys for AsyncStorage
const STORAGE_KEYS = {
  USER_PROFILE: '@bodymax:user_profile',
  BODY_SCANS: '@bodymax:body_scans',
  MEAL_LOGS: '@bodymax:meal_logs',
  DAILY_CHECKLISTS: '@bodymax:daily_checklists',
  EXERCISE_LOGS: '@bodymax:exercise_logs',
};

// ============================================
// USER PROFILE
// ============================================

export const getUserProfile = async (userId) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const upsertUserProfile = async (profileData) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profileData));
      return profileData;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
};

// ============================================
// BODY SCANS
// ============================================

export const saveBodyScan = async (scanData) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage - add to array
      const existingScans = await getBodyScans();
      const newScan = {
        ...scanData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      const updatedScans = [newScan, ...existingScans];
      await AsyncStorage.setItem(STORAGE_KEYS.BODY_SCANS, JSON.stringify(updatedScans));
      return newScan;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('body_scans')
        .insert([scanData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving body scan:', error);
    throw error;
  }
};

export const getBodyScans = async (userId = null) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BODY_SCANS);
      return data ? JSON.parse(data) : [];
    } else {
      // Supabase
      const query = supabase
        .from('body_scans')
        .select('*')
        .order('scan_date', { ascending: false });

      if (userId) {
        query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error('Error getting body scans:', error);
    return [];
  }
};

export const getLatestBodyScan = async (userId = null) => {
  try {
    const scans = await getBodyScans(userId);
    return scans[0] || null;
  } catch (error) {
    console.error('Error getting latest body scan:', error);
    return null;
  }
};

// ============================================
// MEAL LOGS
// ============================================

export const saveMeal = async (mealData) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const existingMeals = await getMeals();
      const newMeal = {
        ...mealData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      const updatedMeals = [newMeal, ...existingMeals];
      await AsyncStorage.setItem(STORAGE_KEYS.MEAL_LOGS, JSON.stringify(updatedMeals));
      return newMeal;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('meal_logs')
        .insert([mealData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving meal:', error);
    throw error;
  }
};

export const getMeals = async (date = null, userId = null) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEAL_LOGS);
      let meals = data ? JSON.parse(data) : [];

      // Filter by date if provided
      if (date) {
        const targetDate = new Date(date).toISOString().split('T')[0];
        meals = meals.filter(meal => {
          const mealDate = meal.date || new Date(meal.created_at).toISOString().split('T')[0];
          return mealDate === targetDate;
        });
      }

      return meals;
    } else {
      // Supabase
      let query = supabase
        .from('meal_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error('Error getting meals:', error);
    return [];
  }
};

export const deleteMeal = async (mealId) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const meals = await getMeals();
      const updatedMeals = meals.filter(meal => meal.id !== mealId);
      await AsyncStorage.setItem(STORAGE_KEYS.MEAL_LOGS, JSON.stringify(updatedMeals));
      return { success: true };
    } else {
      // Supabase
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', mealId);

      if (error) throw error;
      return { success: true };
    }
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
};

// ============================================
// DAILY CHECKLISTS
// ============================================

export const getChecklist = async (date, userId = null) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHECKLISTS);
      const checklists = data ? JSON.parse(data) : [];
      return checklists.find(c => c.date === date) || null;
    } else {
      // Supabase
      let query = supabase
        .from('daily_checklists')
        .select('*')
        .eq('date', date);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    }
  } catch (error) {
    console.error('Error getting checklist:', error);
    return null;
  }
};

export const saveChecklist = async (checklistData) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHECKLISTS);
      let checklists = data ? JSON.parse(data) : [];

      // Remove existing checklist for this date
      checklists = checklists.filter(c => c.date !== checklistData.date);

      // Add new/updated checklist
      const newChecklist = {
        ...checklistData,
        id: checklistData.id || Date.now().toString(),
        updated_at: new Date().toISOString(),
      };
      checklists.unshift(newChecklist);

      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHECKLISTS, JSON.stringify(checklists));
      return newChecklist;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('daily_checklists')
        .upsert(checklistData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving checklist:', error);
    throw error;
  }
};

// ============================================
// EXERCISE LOGS
// ============================================

export const saveExercise = async (exerciseData) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const existingExercises = await getExercises();
      const newExercise = {
        ...exerciseData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      const updatedExercises = [newExercise, ...existingExercises];
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(updatedExercises));
      return newExercise;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert([exerciseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving exercise:', error);
    throw error;
  }
};

export const getExercises = async (date = null, userId = null) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_LOGS);
      let exercises = data ? JSON.parse(data) : [];

      // Filter by date if provided
      if (date) {
        exercises = exercises.filter(ex => ex.date === date);
      }

      return exercises;
    } else {
      // Supabase
      let query = supabase
        .from('exercise_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error('Error getting exercises:', error);
    return [];
  }
};

export const updateExercise = async (exerciseId, updates) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const exercises = await getExercises();
      const updatedExercises = exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates, updated_at: new Date().toISOString() } : ex
      );
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(updatedExercises));
      const updated = updatedExercises.find(ex => ex.id === exerciseId);
      return updated;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('exercise_logs')
        .update(updates)
        .eq('id', exerciseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw error;
  }
};

export const deleteExercise = async (exerciseId) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const exercises = await getExercises();
      const updatedExercises = exercises.filter(ex => ex.id !== exerciseId);
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_LOGS, JSON.stringify(updatedExercises));
      return { success: true };
    } else {
      // Supabase
      const { error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;
      return { success: true };
    }
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clear all local storage (dev mode only)
 */
export const clearAllLocalStorage = async () => {
  if (!USE_LOCAL_STORAGE) {
    console.warn('Cannot clear local storage in production mode');
    return;
  }

  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.BODY_SCANS,
      STORAGE_KEYS.MEAL_LOGS,
      STORAGE_KEYS.DAILY_CHECKLISTS,
      STORAGE_KEYS.EXERCISE_LOGS,
    ]);
    console.log('🗑️  All local storage cleared');
  } catch (error) {
    console.error('Error clearing local storage:', error);
  }
};

/**
 * Get storage mode (for debugging)
 */
export const getStorageMode = () => {
  return USE_LOCAL_STORAGE ? 'local' : 'remote';
};

export default {
  getUserProfile,
  upsertUserProfile,
  saveBodyScan,
  getBodyScans,
  getLatestBodyScan,
  saveMeal,
  getMeals,
  deleteMeal,
  getChecklist,
  saveChecklist,
  saveExercise,
  getExercises,
  updateExercise,
  deleteExercise,
  clearAllLocalStorage,
  getStorageMode,
};
