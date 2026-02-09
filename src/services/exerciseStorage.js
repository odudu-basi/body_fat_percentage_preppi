import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import {
  saveExercise as storageLayerSaveExercise,
  getExercises as storageLayerGetExercises,
  updateExercise as storageLayerUpdateExercise,
  deleteExercise as storageLayerDeleteExercise,
  getUserProfile,
} from './storage';
import { getDailyExercises, CARDIO_EXERCISES, WEIGHTLIFTING_EXERCISES } from '../constants/dailyExercises';
import { getTodayLocalDate, getCurrentTimestamp } from '../utils/dateUtils';

// Detect if running in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';
const USE_LOCAL_STORAGE = false; // Force Supabase mode for testing

// Race condition protection: prevent multiple simultaneous exercise creations
let isCreatingExercises = false;
let creationPromise = null;

/**
 * Get today's exercises for the current user
 * If no exercises exist for today, create the default ones
 */
export const getTodaysExercises = async () => {
  try {
    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    const today = getTodayLocalDate();
    console.log('[ExerciseStorage] Getting exercises for:', today, 'userId:', userId);
    const exercises = await storageLayerGetExercises(today, userId);
    console.log('[ExerciseStorage] Found exercises:', exercises?.length || 0);

    // If no exercises for today, create the defaults
    if (!exercises || exercises.length === 0) {
      console.log('[ExerciseStorage] No exercises found, creating defaults...');

      // RACE CONDITION PROTECTION: If already creating, wait for that to finish
      if (isCreatingExercises && creationPromise) {
        console.log('[ExerciseStorage] Already creating exercises, waiting...');
        return await creationPromise;
      }

      // Set flag and create promise
      isCreatingExercises = true;
      creationPromise = createDefaultExercises(userId, today);

      try {
        const defaultExercises = await creationPromise;
        console.log('[ExerciseStorage] Created default exercises:', defaultExercises?.length || 0);
        return defaultExercises;
      } finally {
        // Reset flags after creation
        isCreatingExercises = false;
        creationPromise = null;
      }
    }

    return exercises.map(formatExerciseFromDB);
  } catch (error) {
    console.error('Error getting today\'s exercises:', error);
    return [];
  }
};

/**
 * Create default exercises for a user on a specific date
 * Number of exercises depends on user's difficulty level:
 * - Easy: 1 cardio + 1 weightlifting
 * - Medium: 2 cardio + 2 weightlifting
 * - Hard: 3 cardio + 3 weightlifting
 */
const createDefaultExercises = async (userId, date) => {
  try {
    // Get user's profile to determine difficulty level
    const profile = await getUserProfile(userId);
    const difficulty = profile?.difficulty || 'medium';
    console.log('[ExerciseStorage] User difficulty level:', difficulty);

    // Get today's exercises based on difficulty
    const dailyExercises = getDailyExercises(difficulty);
    console.log('[ExerciseStorage] getDailyExercises() returned:', dailyExercises);

    const exercisesToCreate = dailyExercises.map((ex, index) => {
      const baseExercise = {
        user_id: userId,
        date: date,
        title: ex.title,
        description: ex.description,
        duration: ex.duration,
        calories: ex.calories,
        icon: ex.icon,
        is_custom: ex.is_custom,
        is_completed: false,
        created_at: getCurrentTimestamp(),
      };

      // Only add ID for local storage (Supabase generates UUIDs automatically)
      if (USE_LOCAL_STORAGE) {
        baseExercise.id = Date.now().toString() + index;
      }

      return baseExercise;
    });
    console.log('[ExerciseStorage] Exercises to create:', exercisesToCreate);

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
    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    const today = getTodayLocalDate();

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
 * Update exercise details (duration and calories)
 * Uses storage abstraction layer
 */
export const updateExercise = async (exerciseId, { duration, calories }) => {
  try {
    const updateData = {
      duration,
      calories: parseInt(calories) || 0,
    };

    const result = await storageLayerUpdateExercise(exerciseId, updateData);
    console.log('Exercise updated:', exerciseId, 'duration:', duration, 'calories:', calories);
    return formatExerciseFromDB(result);
  } catch (error) {
    console.error('Error updating exercise:', error);
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
 * Helper function to determine if an exercise is cardio or weightlifting
 */
const getExerciseType = (exerciseTitle) => {
  const isCardio = CARDIO_EXERCISES.some(ex => ex.title === exerciseTitle);
  return isCardio ? 'cardio' : 'weightlifting';
};

/**
 * Update exercises when difficulty changes - preserves completed exercises
 * @param {string} newDifficulty - The new difficulty level (easy, medium, hard)
 */
export const updateExercisesForDifficulty = async (newDifficulty) => {
  try {
    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[ExerciseStorage] No user found, cannot update exercises');
        return { success: false, error: 'No user authenticated' };
      }
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    const today = getTodayLocalDate();
    console.log('[ExerciseStorage] Updating exercises for difficulty:', newDifficulty, 'userId:', userId);

    // Get current exercises
    const currentExercises = await storageLayerGetExercises(today, userId);
    console.log('[ExerciseStorage] Current exercises:', currentExercises?.length || 0);

    // Determine how many of each type we need for the new difficulty
    const exerciseCount = {
      easy: 1,
      medium: 2,
      hard: 3,
    }[newDifficulty] || 2;

    console.log(`[ExerciseStorage] New difficulty requires ${exerciseCount} cardio + ${exerciseCount} weightlifting`);

    // Separate current exercises by type and completion status
    const completedCardio = [];
    const completedWeightlifting = [];
    const uncompletedCardio = [];
    const uncompletedWeightlifting = [];

    currentExercises.forEach(ex => {
      const type = getExerciseType(ex.title);
      if (ex.is_completed) {
        if (type === 'cardio') {
          completedCardio.push(ex);
        } else {
          completedWeightlifting.push(ex);
        }
      } else {
        if (type === 'cardio') {
          uncompletedCardio.push(ex);
        } else {
          uncompletedWeightlifting.push(ex);
        }
      }
    });

    console.log('[ExerciseStorage] Completed cardio:', completedCardio.length);
    console.log('[ExerciseStorage] Completed weightlifting:', completedWeightlifting.length);
    console.log('[ExerciseStorage] Uncompleted cardio:', uncompletedCardio.length);
    console.log('[ExerciseStorage] Uncompleted weightlifting:', uncompletedWeightlifting.length);

    // Calculate how many new exercises we need to add
    const cardioNeeded = Math.max(0, exerciseCount - completedCardio.length);
    const weightliftingNeeded = Math.max(0, exerciseCount - completedWeightlifting.length);

    console.log(`[ExerciseStorage] Need to add ${cardioNeeded} cardio and ${weightliftingNeeded} weightlifting`);

    // Get the daily exercises for this difficulty (to get fresh ones)
    const dailyExercises = getDailyExercises(newDifficulty);
    const dailyCardio = dailyExercises.filter(ex => getExerciseType(ex.title) === 'cardio');
    const dailyWeightlifting = dailyExercises.filter(ex => getExerciseType(ex.title) === 'weightlifting');

    // Filter out exercises that are already completed (to avoid duplicates)
    const completedTitles = [...completedCardio, ...completedWeightlifting].map(ex => ex.title);
    const availableCardio = dailyCardio.filter(ex => !completedTitles.includes(ex.title));
    const availableWeightlifting = dailyWeightlifting.filter(ex => !completedTitles.includes(ex.title));

    // Add new exercises if needed
    const exercisesToCreate = [];

    for (let i = 0; i < cardioNeeded && i < availableCardio.length; i++) {
      const ex = availableCardio[i];
      exercisesToCreate.push({
        user_id: userId,
        date: today,
        title: ex.title,
        description: ex.description,
        duration: ex.duration,
        calories: ex.calories,
        icon: ex.icon,
        is_custom: ex.is_custom,
        is_completed: false,
        created_at: getCurrentTimestamp(),
      });
    }

    for (let i = 0; i < weightliftingNeeded && i < availableWeightlifting.length; i++) {
      const ex = availableWeightlifting[i];
      exercisesToCreate.push({
        user_id: userId,
        date: today,
        title: ex.title,
        description: ex.description,
        duration: ex.duration,
        calories: ex.calories,
        icon: ex.icon,
        is_custom: ex.is_custom,
        is_completed: false,
        created_at: getCurrentTimestamp(),
      });
    }

    console.log('[ExerciseStorage] Creating', exercisesToCreate.length, 'new exercises');

    // Delete uncompleted exercises that exceed the new quota
    const exercisesToDelete = [];

    // For cardio: keep completed ones, delete excess uncompleted
    if (completedCardio.length < exerciseCount) {
      // We have room for some uncompleted cardio, delete the rest
      const uncompletedToKeep = exerciseCount - completedCardio.length;
      const uncompletedToDelete = uncompletedCardio.slice(uncompletedToKeep);
      exercisesToDelete.push(...uncompletedToDelete);
    } else {
      // We have too many completed cardio, delete all uncompleted
      exercisesToDelete.push(...uncompletedCardio);
    }

    // For weightlifting: same logic
    if (completedWeightlifting.length < exerciseCount) {
      const uncompletedToKeep = exerciseCount - completedWeightlifting.length;
      const uncompletedToDelete = uncompletedWeightlifting.slice(uncompletedToKeep);
      exercisesToDelete.push(...uncompletedToDelete);
    } else {
      exercisesToDelete.push(...uncompletedWeightlifting);
    }

    console.log('[ExerciseStorage] Deleting', exercisesToDelete.length, 'uncompleted exercises');

    // Execute the changes
    if (USE_LOCAL_STORAGE) {
      // Local storage
      const allData = await AsyncStorage.getItem('@bodymax:exercise_logs');
      let allExercises = allData ? JSON.parse(allData) : [];

      // Remove exercises to delete
      const idsToDelete = exercisesToDelete.map(ex => ex.id);
      allExercises = allExercises.filter(ex => !idsToDelete.includes(ex.id));

      // Add new exercises with IDs
      const newExercisesWithIds = exercisesToCreate.map((ex, index) => ({
        ...ex,
        id: Date.now().toString() + index,
      }));
      allExercises = [...newExercisesWithIds, ...allExercises];

      await AsyncStorage.setItem('@bodymax:exercise_logs', JSON.stringify(allExercises));
    } else {
      // Supabase: delete old exercises
      if (exercisesToDelete.length > 0) {
        const idsToDelete = exercisesToDelete.map(ex => ex.id);
        const { error: deleteError } = await supabase
          .from('exercise_logs')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('[ExerciseStorage] Error deleting exercises:', deleteError);
        }
      }

      // Create new exercises
      if (exercisesToCreate.length > 0) {
        const { error: createError } = await supabase
          .from('exercise_logs')
          .insert(exercisesToCreate);

        if (createError) {
          console.error('[ExerciseStorage] Error creating exercises:', createError);
        }
      }
    }

    console.log('[ExerciseStorage] Exercise update complete');
    return {
      success: true,
      added: exercisesToCreate.length,
      deleted: exercisesToDelete.length,
      kept: completedCardio.length + completedWeightlifting.length,
    };
  } catch (error) {
    console.error('[ExerciseStorage] Error updating exercises for difficulty:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete ALL exercises for today
 * Useful when changing difficulty level
 */
export const deleteAllTodaysExercises = async () => {
  try {
    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[ExerciseStorage] No user found, cannot delete exercises');
        return { success: false, deleted: 0 };
      }
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    const today = getTodayLocalDate();
    console.log('[ExerciseStorage] Deleting ALL exercises for:', today, 'userId:', userId);

    if (USE_LOCAL_STORAGE) {
      // Local storage
      const allData = await AsyncStorage.getItem('@bodymax:exercise_logs');
      const allExercises = allData ? JSON.parse(allData) : [];
      const remaining = allExercises.filter(ex => ex.date !== today || ex.user_id !== userId);
      const deleted = allExercises.length - remaining.length;
      await AsyncStorage.setItem('@bodymax:exercise_logs', JSON.stringify(remaining));
      console.log('[ExerciseStorage] Deleted', deleted, 'exercises from local storage');
      return { success: true, deleted };
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('exercise_logs')
        .delete()
        .eq('user_id', userId)
        .eq('date', today)
        .select(); // Get deleted rows to count them

      if (error) {
        console.error('[ExerciseStorage] Error deleting exercises:', error);
        return { success: false, deleted: 0, error };
      }

      const deleted = data?.length || 0;
      console.log('[ExerciseStorage] Deleted', deleted, 'exercises from Supabase');
      return { success: true, deleted };
    }
  } catch (error) {
    console.error('[ExerciseStorage] Error deleting all today\'s exercises:', error);
    return { success: false, deleted: 0, error };
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
  deleteAllTodaysExercises,
  updateExercisesForDifficulty,
  getTodaysBurnedCalories,
};
