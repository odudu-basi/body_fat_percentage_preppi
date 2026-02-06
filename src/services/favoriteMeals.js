import { supabase } from './supabase';

/**
 * Add a meal to favorites
 * @param {Object} meal - The meal to favorite
 * @returns {Promise<Object>} - Result object
 */
export const addFavoriteMeal = async (meal) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[FavoriteMeals] Adding meal to favorites:', meal.name);
    console.log('[FavoriteMeals] Meal type:', meal.meal_type);

    const favoriteMeal = {
      user_id: user.id,
      meal_name: meal.name,
      meal_type: meal.meal_type,
      description: meal.description,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      fiber_g: meal.fiber_g,
      sugar_g: meal.sugar_g,
      sodium_mg: meal.sodium_mg,
      ingredients: meal.ingredients || [],
      portion_details: meal.portion_details,
      prep_time: meal.prep_time,
      cook_time: meal.cook_time,
      image_uri: meal.image_uri,
      recipe: meal.recipe,
    };

    console.log('[FavoriteMeals] Inserting favorite meal:', JSON.stringify(favoriteMeal, null, 2));

    const { data, error } = await supabase
      .from('favorite_meals')
      .insert([favoriteMeal])
      .select()
      .single();

    if (error) {
      console.error('[FavoriteMeals] Insert error:', error);
      // Check if it's a duplicate error
      if (error.code === '23505') {
        throw new Error('This meal is already in your favorites');
      }
      throw error;
    }

    console.log('[FavoriteMeals] Meal added to favorites successfully:', meal.name);
    console.log('[FavoriteMeals] Inserted data:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[FavoriteMeals] Error adding favorite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove a meal from favorites
 * @param {string} mealName - Name of the meal to remove
 * @returns {Promise<Object>} - Result object
 */
export const removeFavoriteMeal = async (mealName) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('favorite_meals')
      .delete()
      .eq('user_id', user.id)
      .eq('meal_name', mealName);

    if (error) throw error;

    console.log('[FavoriteMeals] Meal removed from favorites:', mealName);
    return { success: true };
  } catch (error) {
    console.error('[FavoriteMeals] Error removing favorite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a meal is favorited
 * @param {string} mealName - Name of the meal to check
 * @returns {Promise<boolean>} - True if favorited
 */
export const isMealFavorited = async (mealName) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favorite_meals')
      .select('id')
      .eq('user_id', user.id)
      .eq('meal_name', mealName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('[FavoriteMeals] Error checking favorite:', error);
    return false;
  }
};

/**
 * Get all favorite meals for user
 * @param {string} mealType - Optional meal type filter
 * @returns {Promise<Array>} - Array of favorite meals
 */
export const getFavoriteMeals = async (mealType = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[FavoriteMeals] No user found');
      return [];
    }

    console.log('[FavoriteMeals] Querying favorites for user:', user.id);
    console.log('[FavoriteMeals] Filtering by meal type:', mealType);

    let query = supabase
      .from('favorite_meals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (mealType) {
      query = query.eq('meal_type', mealType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FavoriteMeals] Query error:', error);
      throw error;
    }

    console.log('[FavoriteMeals] Retrieved favorites:', data?.length || 0);
    console.log('[FavoriteMeals] Favorites data:', JSON.stringify(data, null, 2));
    return data || [];
  } catch (error) {
    console.error('[FavoriteMeals] Error getting favorites:', error);
    return [];
  }
};

/**
 * Toggle favorite status for a meal
 * @param {Object} meal - The meal to toggle
 * @returns {Promise<Object>} - Result object with new favorite status
 */
export const toggleFavoriteMeal = async (meal) => {
  try {
    const isFavorited = await isMealFavorited(meal.name);

    if (isFavorited) {
      const result = await removeFavoriteMeal(meal.name);
      return { ...result, isFavorited: false };
    } else {
      const result = await addFavoriteMeal(meal);
      return { ...result, isFavorited: true };
    }
  } catch (error) {
    console.error('[FavoriteMeals] Error toggling favorite:', error);
    return { success: false, error: error.message };
  }
};

export default {
  addFavoriteMeal,
  removeFavoriteMeal,
  isMealFavorited,
  getFavoriteMeals,
  toggleFavoriteMeal,
};
