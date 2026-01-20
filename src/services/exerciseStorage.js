import { supabase } from './supabase';

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
 * @returns {Promise<Array>} - Array of exercise objects
 */
export const getTodaysExercises = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date().toISOString().split('T')[0];

    // Try to get today's exercises
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // If no exercises for today, create the defaults
    if (!data || data.length === 0) {
      const defaultExercises = await createDefaultExercises(user.id, today);
      return defaultExercises;
    }

    return data.map(formatExerciseFromDB);
  } catch (error) {
    console.error('Error getting today\'s exercises:', error);
    return [];
  }
};

/**
 * Create default exercises for a user on a specific date
 * @param {string} userId - User ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of created exercises
 */
const createDefaultExercises = async (userId, date) => {
  try {
    const exercisesToCreate = DEFAULT_EXERCISES.map(ex => ({
      user_id: userId,
      date: date,
      title: ex.title,
      description: ex.description,
      duration: ex.duration,
      calories: ex.calories,
      icon: ex.icon,
      is_custom: ex.is_custom,
      is_completed: false,
    }));

    const { data, error } = await supabase
      .from('exercise_logs')
      .insert(exercisesToCreate)
      .select();

    if (error) throw error;

    return (data || []).map(formatExerciseFromDB);
  } catch (error) {
    console.error('Error creating default exercises:', error);
    return [];
  }
};

/**
 * Add a custom exercise
 * @param {Object} exerciseData - Exercise data
 * @returns {Promise<Object|null>} - Created exercise or null
 */
export const addExercise = async (exerciseData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const today = new Date().toISOString().split('T')[0];

    const exerciseRecord = {
      user_id: user.id,
      date: today,
      title: exerciseData.title,
      description: exerciseData.description || '',
      duration: exerciseData.duration || '',
      calories: exerciseData.calories || 0,
      icon: exerciseData.icon || 'fitness',
      is_custom: true,
      is_completed: false,
    };

    const { data, error } = await supabase
      .from('exercise_logs')
      .insert(exerciseRecord)
      .select()
      .single();

    if (error) throw error;

    console.log('Exercise added:', data.id);
    return formatExerciseFromDB(data);
  } catch (error) {
    console.error('Error adding exercise:', error);
    return null;
  }
};

/**
 * Toggle exercise completion status
 * @param {string} exerciseId - Exercise ID
 * @param {boolean} isCompleted - New completion status
 * @returns {Promise<Object|null>} - Updated exercise or null
 */
export const toggleExerciseCompletion = async (exerciseId, isCompleted) => {
  try {
    const updateData = {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('exercise_logs')
      .update(updateData)
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) throw error;

    console.log('Exercise toggled:', exerciseId, 'completed:', isCompleted);
    return formatExerciseFromDB(data);
  } catch (error) {
    console.error('Error toggling exercise:', error);
    return null;
  }
};

/**
 * Delete an exercise
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteExercise = async (exerciseId) => {
  try {
    const { error } = await supabase
      .from('exercise_logs')
      .delete()
      .eq('id', exerciseId);

    if (error) throw error;

    console.log('Exercise deleted:', exerciseId);
    return true;
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
