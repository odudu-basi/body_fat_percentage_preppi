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

export default {
  saveDailyMealPlan,
  getMealPlanForDate,
  updateMealCompletion,
  deleteMealPlan,
  updateMealRecipe,
};
