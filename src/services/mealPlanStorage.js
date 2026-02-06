import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getLocalDateString } from '../utils/dateUtils';

const MEAL_PLAN_KEY = '@bodymax:meal_plans';
const USE_LOCAL_STORAGE = false;

/**
 * Save a daily meal plan
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} mealPlan - The generated meal plan
 * @returns {Promise<Object>} - Saved meal plan
 */
export const saveDailyMealPlan = async (date, mealPlan) => {
  try {
    let userId = null;

    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    const mealPlanRecord = {
      user_id: userId,
      date: date,
      total_calories: mealPlan.total_calories,
      total_protein: mealPlan.total_protein,
      total_carbs: mealPlan.total_carbs,
      total_fat: mealPlan.total_fat,
      meals: mealPlan.meals,
      created_at: new Date().toISOString(),
    };

    if (USE_LOCAL_STORAGE) {
      // Local storage
      const existingPlans = await getMealPlans();
      const planIndex = existingPlans.findIndex(p => p.date === date && p.user_id === userId);

      if (planIndex !== -1) {
        existingPlans[planIndex] = { ...existingPlans[planIndex], ...mealPlanRecord };
      } else {
        existingPlans.push({ ...mealPlanRecord, id: Date.now().toString() });
      }

      await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(existingPlans));
      console.log('[MealPlanStorage] Saved to local storage');
      return mealPlanRecord;
    } else {
      // Supabase - check if plan exists for this date
      const { data: existing, error: fetchError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update existing plan
        const { data, error } = await supabase
          .from('meal_plans')
          .update(mealPlanRecord)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        console.log('[MealPlanStorage] Updated plan in Supabase');
        return data;
      } else {
        // Insert new plan
        const { data, error } = await supabase
          .from('meal_plans')
          .insert([mealPlanRecord])
          .select()
          .single();

        if (error) throw error;
        console.log('[MealPlanStorage] Saved new plan to Supabase');
        return data;
      }
    }
  } catch (error) {
    console.error('[MealPlanStorage] Error saving meal plan:', error);
    throw error;
  }
};

/**
 * Get meal plan for a specific date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<Object|null>} - Meal plan or null if not found
 */
export const getMealPlanForDate = async (date) => {
  try {
    let userId = null;

    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    if (USE_LOCAL_STORAGE) {
      const plans = await getMealPlans();
      return plans.find(p => p.date === date && p.user_id === userId) || null;
    } else {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('[MealPlanStorage] Error getting meal plan:', error);
    return null;
  }
};

/**
 * Get all meal plans for user
 * @returns {Promise<Array>} - Array of meal plans
 */
const getMealPlans = async () => {
  try {
    if (USE_LOCAL_STORAGE) {
      const data = await AsyncStorage.getItem(MEAL_PLAN_KEY);
      return data ? JSON.parse(data) : [];
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    console.error('[MealPlanStorage] Error getting meal plans:', error);
    return [];
  }
};

/**
 * Get recent meal names (last 7 days) to avoid repetition
 * @returns {Promise<Array<string>>} - Array of recent meal names
 */
export const getRecentMealNames = async () => {
  try {
    let userId = null;

    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);

    let recentPlans = [];

    if (USE_LOCAL_STORAGE) {
      const allPlans = await getMealPlans();
      recentPlans = allPlans.filter(
        p => p.user_id === userId && p.date >= sevenDaysAgoStr
      );
    } else {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('meals')
        .eq('user_id', userId)
        .gte('date', sevenDaysAgoStr)
        .order('date', { ascending: false });

      if (error) throw error;
      recentPlans = data || [];
    }

    // Extract all meal names from recent plans
    const mealNames = [];
    recentPlans.forEach(plan => {
      if (plan.meals && Array.isArray(plan.meals)) {
        plan.meals.forEach(meal => {
          if (meal.name && !mealNames.includes(meal.name)) {
            mealNames.push(meal.name);
          }
        });
      }
    });

    console.log('[MealPlanStorage] Found', mealNames.length, 'unique meals from last 7 days:', mealNames);
    return mealNames;
  } catch (error) {
    console.error('[MealPlanStorage] Error getting recent meal names:', error);
    return [];
  }
};

/**
 * Update completion status for a meal in the plan
 * @param {string} date - Date string
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @param {boolean} completed - Completion status
 * @param {string} mealLogId - Optional meal_log_id to link to the meal log
 * @returns {Promise<boolean>} - Success status
 */
export const updateMealCompletion = async (date, mealType, completed, mealLogId = null) => {
  try {
    const plan = await getMealPlanForDate(date);
    if (!plan) return false;

    const updatedMeals = plan.meals.map(meal =>
      meal.meal_type === mealType ? { ...meal, completed, meal_log_id: mealLogId } : meal
    );

    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    if (USE_LOCAL_STORAGE) {
      const plans = await getMealPlans();
      const planIndex = plans.findIndex(p => p.date === date && p.user_id === userId);
      if (planIndex !== -1) {
        plans[planIndex].meals = updatedMeals;
        await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plans));
      }
    } else {
      const { error } = await supabase
        .from('meal_plans')
        .update({ meals: updatedMeals })
        .eq('id', plan.id);

      if (error) throw error;
    }

    console.log('[MealPlanStorage] Meal completion updated');
    return true;
  } catch (error) {
    console.error('[MealPlanStorage] Error updating meal completion:', error);
    return false;
  }
};

/**
 * Delete a meal plan for a specific date
 * @param {string} date - Date string
 * @returns {Promise<boolean>} - Success status
 */
export const deleteMealPlan = async (date) => {
  try {
    let userId = null;

    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    if (USE_LOCAL_STORAGE) {
      const plans = await getMealPlans();
      const filtered = plans.filter(p => !(p.date === date && p.user_id === userId));
      await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(filtered));
    } else {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', userId)
        .eq('date', date);

      if (error) throw error;
    }

    console.log('[MealPlanStorage] Meal plan deleted');
    return true;
  } catch (error) {
    console.error('[MealPlanStorage] Error deleting meal plan:', error);
    return false;
  }
};

/**
 * Update recipe for a specific meal in the plan
 * @param {string} date - Date string
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @param {Object} recipeData - Recipe data to save
 * @returns {Promise<boolean>} - Success status
 */
export const updateMealRecipe = async (date, mealType, recipeData) => {
  try {
    const plan = await getMealPlanForDate(date);
    if (!plan) return false;

    const updatedMeals = plan.meals.map(meal =>
      meal.meal_type === mealType ? { ...meal, recipe: recipeData } : meal
    );

    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    if (USE_LOCAL_STORAGE) {
      const plans = await getMealPlans();
      const planIndex = plans.findIndex(p => p.date === date && p.user_id === userId);
      if (planIndex !== -1) {
        plans[planIndex].meals = updatedMeals;
        await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plans));
      }
    } else {
      const { error } = await supabase
        .from('meal_plans')
        .update({ meals: updatedMeals })
        .eq('id', plan.id);

      if (error) throw error;
    }

    console.log('[MealPlanStorage] Recipe updated for meal:', mealType);
    return true;
  } catch (error) {
    console.error('[MealPlanStorage] Error updating recipe:', error);
    return false;
  }
};

/**
 * Update image for a specific meal in the plan
 * @param {string} date - Date string
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @param {string} imageUri - Image URI to save
 * @returns {Promise<boolean>} - Success status
 */
export const updateMealImage = async (date, mealType, imageUri) => {
  try {
    const plan = await getMealPlanForDate(date);
    if (!plan) return false;

    const updatedMeals = plan.meals.map(meal =>
      meal.meal_type === mealType ? { ...meal, image_uri: imageUri } : meal
    );

    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    if (USE_LOCAL_STORAGE) {
      const plans = await getMealPlans();
      const planIndex = plans.findIndex(p => p.date === date && p.user_id === userId);
      if (planIndex !== -1) {
        plans[planIndex].meals = updatedMeals;
        await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plans));
      }
    } else {
      const { error } = await supabase
        .from('meal_plans')
        .update({ meals: updatedMeals })
        .eq('id', plan.id);

      if (error) throw error;
    }

    console.log('[MealPlanStorage] Image updated for meal:', mealType);
    return true;
  } catch (error) {
    console.error('[MealPlanStorage] Error updating image:', error);
    return false;
  }
};

/**
 * Replace a specific meal in the plan with a new meal
 * @param {string} date - Date string
 * @param {string} mealType - Type of meal to replace (breakfast, lunch, dinner, snack)
 * @param {Object} newMeal - New meal data
 * @returns {Promise<boolean>} - Success status
 */
export const replaceMeal = async (date, mealType, newMeal) => {
  try {
    const plan = await getMealPlanForDate(date);
    if (!plan) {
      console.error('[MealPlanStorage] No plan found for date:', date);
      return false;
    }

    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    // Find the old meal to check if it was completed (has meal_log_id)
    const oldMeal = plan.meals.find(m => m.meal_type === mealType);

    // If the old meal was checked (has meal_log_id), delete it from meal_logs
    if (oldMeal?.meal_log_id && !USE_LOCAL_STORAGE) {
      console.log('[MealPlanStorage] Deleting old meal from meal_logs:', oldMeal.meal_log_id);
      const { error: deleteError } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', oldMeal.meal_log_id);

      if (deleteError) {
        console.error('[MealPlanStorage] Error deleting old meal log:', deleteError);
        // Continue anyway - the meal plan will still be updated
      } else {
        console.log('[MealPlanStorage] Old meal log deleted successfully');
      }
    }

    // Find and replace the meal (reset completed and meal_log_id)
    const updatedMeals = plan.meals.map(meal =>
      meal.meal_type === mealType
        ? {
            ...newMeal,
            meal_type: mealType,
            completed: false, // Reset completion status
            meal_log_id: null, // Clear meal_log_id
          }
        : meal
    );

    // Recalculate totals
    const total_calories = updatedMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const total_protein = updatedMeals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
    const total_carbs = updatedMeals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
    const total_fat = updatedMeals.reduce((sum, m) => sum + (m.fat_g || 0), 0);

    if (USE_LOCAL_STORAGE) {
      const plans = await getMealPlans();
      const planIndex = plans.findIndex(p => p.date === date && p.user_id === userId);
      if (planIndex !== -1) {
        plans[planIndex].meals = updatedMeals;
        plans[planIndex].total_calories = total_calories;
        plans[planIndex].total_protein = total_protein;
        plans[planIndex].total_carbs = total_carbs;
        plans[planIndex].total_fat = total_fat;
        await AsyncStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plans));
      }
    } else {
      const { error } = await supabase
        .from('meal_plans')
        .update({
          meals: updatedMeals,
          total_calories,
          total_protein,
          total_carbs,
          total_fat,
        })
        .eq('id', plan.id);

      if (error) throw error;
    }

    console.log('[MealPlanStorage] Meal replaced successfully:', mealType);
    return true;
  } catch (error) {
    console.error('[MealPlanStorage] Error replacing meal:', error);
    return false;
  }
};

export default {
  saveDailyMealPlan,
  getMealPlanForDate,
  updateMealCompletion,
  deleteMealPlan,
  updateMealRecipe,
  replaceMeal,
};
