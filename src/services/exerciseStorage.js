import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import {
  saveExercise as storageLayerSaveExercise,
  getExercises as storageLayerGetExercises,
  updateExercise as storageLayerUpdateExercise,
  deleteExercise as storageLayerDeleteExercise,
} from './storage';

// Detect if running in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';
const USE_LOCAL_STORAGE = isExpoGo;

// Default exercises that are created for each day
const DEFAULT_EXERCISES = [
  {
    title: 'Cardio',
    description: 'High intensity interval training to boost your metabolism and burn fat',
    duration: '30 min',
    calories: 320,
    icon: 'heart',
    is_custom: false,
  },
  {
    title: 'Weight Lifting',
    description: 'Strength training to build muscle and increase your resting metabolic rate',
    duration: '45 min',
    calories: 280,
    icon: 'barbell',
    is_custom: false,
  },
];

/**
 * Get today's exercises for the current user
 * If no exercises exist for today, create the default ones
 */
export const getTodaysExercises = async () => {
  try {
    let userId = 'dev-user';
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      userId = user.id;
    }

    const today = new Date().toISOString().split('T')[0];
    const exercises = await storageLayerGetExercises(today, userId);

    // If no exercises for today, create the defaults
    if (!exercises || exercises.length === 0) {
      const defaultExercises = await createDefaultExercises(userId, today);
      return defaultExercises;
    }

    return exercises.map(formatExerciseFromDB);
  } catch (error) {
    console.error('Error getting today\'s exercises:', error);
    return [];
  }
};

/**
 * Create default exercises for a user on a specific date
 */
const createDefaultExercises = async (userId, date) => {
  try {
    const exercisesToCreate = DEFAULT_EXERCISES.map((ex, index) => ({
      id: Date.now().toString() + index,
      user_id: userId,
      date: date,
      title: ex.title,
      description: ex.description,
      duration: ex.duration,
      calories: ex.calories,
      icon: ex.icon,
      is_custom: ex.is_custom,
      is_completed: false,
      created_at: new Date().toISOString(),
    }));

    if (USE_LOCAL_STORAGE) {
      // Local storage
      const existingData = await AsyncStorage.getItem('@bodymax:exercise_logs');
      const existing = existingData ? JSON.parse(existingData) : [];
      const updated = [...exercisesToCreate, ...existing];
      await AsyncStorage.setItem('@bodymax:exercise_logs', JSON.stringify(updated));
      return exercisesToCreate.map(formatExerciseFromDB);
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert(exercisesToCreate)
        .select();

      if (error) throw error;
      return (data || []).map(formatExerciseFromDB);
    }
  } catch (error) {
    console.error('Error creating default exercises:', error);
    return [];
  }
};

/**
 * Add a custom exercise
 * Uses storage abstraction layer
 */
export const addExercise = async (exerciseData) => {
  try {
    let userId = 'dev-user';
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const today = new Date().toISOString().split('T')[0];

    const exerciseRecord = {
      user_id: userId,
      date: today,
      title: exerciseData.title,
      description: exerciseData.description || '',
      duration: exerciseData.duration || '',
      calories: exerciseData.calories || 0,
      icon: exerciseData.icon || 'fitness',
      is_custom: true,
      is_completed: false,
    };

    const result = await storageLayerSaveExercise(exerciseRecord);
    console.log('Exercise added:', result.id);
    return formatExerciseFromDB(result);
  } catch (error) {
    console.error('Error adding exercise:', error);
    return null;
  }
};

/**
 * Toggle exercise completion status
 * Uses storage abstraction layer
 */
export const toggleExerciseCompletion = async (exerciseId, isCompleted) => {
  try {
    const updateData = {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    };

    const result = await storageLayerUpdateExercise(exerciseId, updateData);
    console.log('Exercise toggled:', exerciseId, 'completed:', isCompleted);
    return formatExerciseFromDB(result);
  } catch (error) {
    console.error('Error toggling exercise:', error);
    return null;
  }
};

/**
 * Delete an exercise
 * Uses storage abstraction layer
 */
export const deleteExercise = async (exerciseId) => {
  try {
    const result = await storageLayerDeleteExercise(exerciseId);
    return result.success;
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return false;
  }
};

/**
 * Get total burned calories for today (completed exercises only)
 * @returns {Promise<number>} - Total burned calories
 */
export const getTodaysBurnedCalories = async () => {
  try {
    const exercises = await getTodaysExercises();
    return exercises
      .filter(ex => ex.is_completed)
      .reduce((total, ex) => total + (ex.calories || 0), 0);
  } catch (error) {
    console.error('Error getting today\'s burned calories:', error);
    return 0;
  }
};

/**
 * Format database record to app format
 * @param {Object} dbRecord - Database record
 * @returns {Object} - Formatted exercise for app use
 */
const formatExerciseFromDB = (dbRecord) => {
  return {
    id: dbRecord.id,
    title: dbRecord.title,
    description: dbRecord.description,
    duration: dbRecord.duration,
    calories: dbRecord.calories,
    icon: dbRecord.icon,
    date: dbRecord.date,
    is_completed: dbRecord.is_completed,
    is_custom: dbRecord.is_custom,
    completed_at: dbRecord.completed_at,
    created_at: dbRecord.created_at,
  };
};

export default {
  getTodaysExercises,
  addExercise,
  toggleExerciseCompletion,
  deleteExercise,
  getTodaysBurnedCalories,
};
