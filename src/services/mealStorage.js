import { supabase } from './supabase';

/**
 * Save a meal log to Supabase
 * @param {Object} mealData - The meal data to save
 * @returns {Promise<Object>} - The saved meal with ID
 */
export const saveMeal = async (mealData) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    
    // Format data for Supabase meal_logs table
    const mealRecord = {
      user_id: user.id,
      meal_name: mealData.meal_name || 'Unknown Meal',
      meal_type: mealData.meal_time || 'snack',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      calories: mealData.total_calories || 0,
      protein_g: mealData.macros?.protein_g || 0,
      carbs_g: mealData.macros?.carbs_g || 0,
      fat_g: mealData.macros?.fat_g || 0,
      fiber_g: mealData.macros?.fiber_g || 0,
      sugar_g: mealData.macros?.sugar_g || 0,
      sodium_mg: mealData.macros?.sodium_mg || 0,
      servings: mealData.servings || 1,
      notes: mealData.notes || '',
      image_path: mealData.photo_uri || null,
      ai_analysis: {
        original_analysis: mealData.original_analysis,
        ingredients: mealData.ingredients,
        confidence: mealData.confidence,
      },
    };

    const { data, error } = await supabase
      .from('meal_logs')
      .insert(mealRecord)
      .select()
      .single();

    if (error) throw error;

    console.log('Meal saved to Supabase:', data.id);
    
    // Return in the format expected by the app
    return formatMealFromDB(data);
  } catch (error) {
    console.error('Error saving meal:', error);
    throw error;
  }
};

/**
 * Get all meals for current user
 * @returns {Promise<Array>} - Array of meal objects
 */
export const getMeals = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(formatMealFromDB);
  } catch (error) {
    console.error('Error getting meals:', error);
    return [];
  }
};

/**
 * Get meals for today
 * @returns {Promise<Array>} - Array of meal objects for today
 */
export const getTodaysMeals = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(formatMealFromDB);
  } catch (error) {
    console.error('Error getting today\'s meals:', error);
    return [];
  }
};

/**
 * Get a specific meal by ID
 * @param {string} mealId - The meal ID
 * @returns {Promise<Object|null>} - The meal or null
 */
export const getMealById = async (mealId) => {
  try {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('id', mealId)
      .single();

    if (error) throw error;

    return data ? formatMealFromDB(data) : null;
  } catch (error) {
    console.error('Error getting meal by ID:', error);
    return null;
  }
};

/**
 * Update a meal
 * @param {string} mealId - The meal ID to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object|null>} - The updated meal or null
 */
export const updateMeal = async (mealId, updates) => {
  try {
    const updateData = {};
    
    if (updates.total_calories !== undefined) updateData.calories = updates.total_calories;
    if (updates.servings !== undefined) updateData.servings = updates.servings;
    if (updates.macros) {
      if (updates.macros.protein_g !== undefined) updateData.protein_g = updates.macros.protein_g;
      if (updates.macros.carbs_g !== undefined) updateData.carbs_g = updates.macros.carbs_g;
      if (updates.macros.fat_g !== undefined) updateData.fat_g = updates.macros.fat_g;
      if (updates.macros.fiber_g !== undefined) updateData.fiber_g = updates.macros.fiber_g;
      if (updates.macros.sugar_g !== undefined) updateData.sugar_g = updates.macros.sugar_g;
      if (updates.macros.sodium_mg !== undefined) updateData.sodium_mg = updates.macros.sodium_mg;
    }

    const { data, error } = await supabase
      .from('meal_logs')
      .update(updateData)
      .eq('id', mealId)
      .select()
      .single();

    if (error) throw error;

    console.log('Meal updated:', mealId);
    return data ? formatMealFromDB(data) : null;
  } catch (error) {
    console.error('Error updating meal:', error);
    return null;
  }
};

/**
 * Delete a meal
 * @param {string} mealId - The meal ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteMeal = async (mealId) => {
  try {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId);

    if (error) throw error;

    console.log('Meal deleted:', mealId);
    return true;
  } catch (error) {
    console.error('Error deleting meal:', error);
    return false;
  }
};

/**
 * Get total calories for today
 * @returns {Promise<number>} - Total calories
 */
export const getTodaysCalories = async () => {
  try {
    const todaysMeals = await getTodaysMeals();
    return todaysMeals.reduce((total, meal) => total + (meal.total_calories || 0), 0);
  } catch (error) {
    console.error('Error getting today\'s calories:', error);
    return 0;
  }
};

/**
 * Get meals for a specific date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of meal objects
 */
export const getMealsForDateRange = async (startDate, endDate) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(formatMealFromDB);
  } catch (error) {
    console.error('Error getting meals for date range:', error);
    return [];
  }
};

/**
 * Get weekly nutrition data grouped by day
 * @param {Date} weekStartDate - The Sunday of the week to fetch
 * @returns {Promise<Object>} - Object with daily totals and weekly average
 */
export const getWeeklyNutritionData = async (weekStartDate) => {
  try {
    // Calculate week start (Sunday) and end (Saturday)
    const startDate = new Date(weekStartDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const meals = await getMealsForDateRange(startDateStr, endDateStr);
    
    // Initialize days array (Sun-Sat)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = days.map((day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + index);
      return {
        day,
        date: dayDate.toISOString().split('T')[0],
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
      };
    });
    
    // Group meals by day
    meals.forEach(meal => {
      const mealDate = meal.date;
      const dayIndex = dailyData.findIndex(d => d.date === mealDate);
      if (dayIndex !== -1) {
        dailyData[dayIndex].protein += meal.macros?.protein_g || 0;
        dailyData[dayIndex].carbs += meal.macros?.carbs_g || 0;
        dailyData[dayIndex].fats += meal.macros?.fat_g || 0;
        dailyData[dayIndex].calories += meal.total_calories || 0;
      }
    });
    
    // Calculate weekly totals and average
    const daysWithData = dailyData.filter(d => d.calories > 0);
    const totalCalories = dailyData.reduce((sum, d) => sum + d.calories, 0);
    const averageCalories = daysWithData.length > 0 
      ? Math.round(totalCalories / daysWithData.length) 
      : 0;
    
    return {
      dailyData,
      totalCalories,
      averageCalories,
      daysWithData: daysWithData.length,
    };
  } catch (error) {
    console.error('Error getting weekly nutrition data:', error);
    return {
      dailyData: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
        day,
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
      })),
      totalCalories: 0,
      averageCalories: 0,
      daysWithData: 0,
    };
  }
};

/**
 * Format meal data for storage (from AI analysis)
 * @param {Object} analysisResult - AI analysis result
 * @param {string} photoUri - Photo URI
 * @param {number} servings - Number of servings
 * @returns {Object} - Formatted meal data
 */
export const formatMealForStorage = (analysisResult, photoUri, servings = 1) => {
  const adjustedCalories = Math.round((analysisResult?.total_calories || 0) * servings);
  const adjustedMacros = {
    protein_g: Math.round((analysisResult?.macros?.protein_g || 0) * servings),
    carbs_g: Math.round((analysisResult?.macros?.carbs_g || 0) * servings),
    fat_g: Math.round((analysisResult?.macros?.fat_g || 0) * servings),
    fiber_g: Math.round((analysisResult?.macros?.fiber_g || 0) * servings),
    sugar_g: Math.round((analysisResult?.macros?.sugar_g || 0) * servings),
    sodium_mg: Math.round((analysisResult?.macros?.sodium_mg || 0) * servings),
  };

  return {
    meal_name: analysisResult?.meal_name || 'Unknown Meal',
    meal_time: analysisResult?.meal_time || 'snack',
    total_calories: adjustedCalories,
    macros: adjustedMacros,
    ingredients: analysisResult?.ingredients || [],
    confidence: analysisResult?.confidence || 'medium',
    notes: analysisResult?.notes || '',
    photo_uri: photoUri,
    servings: servings,
    original_analysis: analysisResult,
  };
};

/**
 * Format database record to app format
 * @param {Object} dbRecord - Database record
 * @returns {Object} - Formatted meal for app use
 */
const formatMealFromDB = (dbRecord) => {
  return {
    id: dbRecord.id,
    meal_name: dbRecord.meal_name,
    meal_time: dbRecord.meal_type,
    total_calories: dbRecord.calories,
    macros: {
      protein_g: dbRecord.protein_g,
      carbs_g: dbRecord.carbs_g,
      fat_g: dbRecord.fat_g,
      fiber_g: dbRecord.fiber_g,
      sugar_g: dbRecord.sugar_g,
      sodium_mg: dbRecord.sodium_mg,
    },
    servings: dbRecord.servings,
    photo_uri: dbRecord.image_path,
    date: dbRecord.date,
    logged_at: dbRecord.created_at,
    notes: dbRecord.notes,
    ingredients: dbRecord.ai_analysis?.ingredients || [],
    confidence: dbRecord.ai_analysis?.confidence || 'medium',
    original_analysis: dbRecord.ai_analysis?.original_analysis || null,
  };
};

/**
 * Clear all meals for current user (for testing)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllMeals = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('All meals cleared');
    return true;
  } catch (error) {
    console.error('Error clearing meals:', error);
    return false;
  }
};

export default {
  saveMeal,
  getMeals,
  getTodaysMeals,
  getMealById,
  updateMeal,
  deleteMeal,
  getTodaysCalories,
  getMealsForDateRange,
  getWeeklyNutritionData,
  formatMealForStorage,
  clearAllMeals,
};
