import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import {
  getChecklist as storageLayerGetChecklist,
  saveChecklist as storageLayerSaveChecklist,
} from './storage';
import { getTodayLocalDate, getCurrentTimestamp } from '../utils/dateUtils';

// Detect if running in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';
const USE_LOCAL_STORAGE = false; // Force Supabase mode for testing

// Default checklist items that are created for new users
// Only 4 core items - rest come from daily habits rotation
const DEFAULT_CHECKLIST_ITEMS = [
  {
    title: 'Drink 8 glasses of water',
    subtitle: 'Stay hydrated throughout the day',
    icon: 'water',
    icon_color: '#2196F3',
    is_recurring: true,
    is_custom: false,
    sort_order: 0,
  },
  {
    title: 'Complete your workout',
    subtitle: '45 min strength training',
    icon: 'barbell',
    icon_color: '#E85D04',
    is_recurring: true,
    is_custom: false,
    sort_order: 1,
  },
  {
    title: 'Hit your protein goal',
    subtitle: '120g protein target',
    icon: 'nutrition',
    icon_color: '#4CAF50',
    is_recurring: true,
    is_custom: false,
    sort_order: 2,
  },
  {
    title: 'Get 7-8 hours of sleep',
    subtitle: 'Rest and recovery is key',
    icon: 'moon',
    icon_color: '#9C27B0',
    is_recurring: true,
    is_custom: false,
    sort_order: 3,
  },
];

/**
 * Get today's checklist items for the current user
 * Includes recurring items + one-time items created today
 * Also fetches completion status for today
 *
 * @param {Object} options - Optional configuration
 * @param {Object} options.profile - User profile for dynamic values
 * @param {Array} options.exercises - Today's exercises for dynamic duration
 */
export const getTodaysChecklist = async (options = {}) => {
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
    const { profile, exercises } = options;

    if (USE_LOCAL_STORAGE) {
      // Local storage - simplified implementation
      // Store checklist items and completions separately
      const itemsData = await AsyncStorage.getItem('@bodymax:checklist_items');
      let items = itemsData ? JSON.parse(itemsData) : [];

      // If no items exist, create defaults
      if (items.length === 0) {
        items = await createDefaultChecklistItems(userId);
      }

      // Filter to recurring items or items created today
      items = items.filter(item => item.is_recurring || item.created_date === today);

      // Get today's completions
      const completionsData = await AsyncStorage.getItem('@bodymax:checklist_completions');
      const allCompletions = completionsData ? JSON.parse(completionsData) : [];
      const todaysCompletions = allCompletions.filter(c => c.date === today);

      // Create completion map
      const completionMap = {};
      todaysCompletions.forEach(c => {
        completionMap[c.checklist_item_id] = c;
      });

      // Merge items with completion status
      let formattedItems = items.map(item => ({
        ...formatChecklistItemFromDB(item),
        is_completed: completionMap[item.id]?.is_completed || false,
        completion_id: completionMap[item.id]?.id || null,
      }));

      // Update with dynamic values if profile/exercises provided
      if (profile || exercises) {
        formattedItems = updateDynamicChecklistValues(formattedItems, profile, exercises);
      }

      return formattedItems;
    } else {
      // Supabase
      const { data: items, error: itemsError } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('user_id', userId)
        .or(`is_recurring.eq.true,created_date.eq.${today}`)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        const defaultItems = await createDefaultChecklistItems(userId);
        // Update with dynamic values if profile/exercises provided
        if (profile || exercises) {
          return updateDynamicChecklistValues(defaultItems, profile, exercises);
        }
        return defaultItems;
      }

      const itemIds = items.map(item => item.id);
      const { data: completions, error: completionsError } = await supabase
        .from('checklist_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .in('checklist_item_id', itemIds);

      if (completionsError) throw completionsError;

      const completionMap = {};
      (completions || []).forEach(c => {
        completionMap[c.checklist_item_id] = c;
      });

      let formattedItems = items.map(item => ({
        ...formatChecklistItemFromDB(item),
        is_completed: completionMap[item.id]?.is_completed || false,
        completion_id: completionMap[item.id]?.id || null,
      }));

      // Update with dynamic values if profile/exercises provided
      if (profile || exercises) {
        formattedItems = updateDynamicChecklistValues(formattedItems, profile, exercises);
      }

      return formattedItems;
    }
  } catch (error) {
    console.error('Error getting today\'s checklist:', error);
    return [];
  }
};

/**
 * Create default checklist items for a new user
 * Only creates if no recurring items exist for the user
 */
const createDefaultChecklistItems = async (userId) => {
  try {
    const today = getTodayLocalDate();

    // Check if user already has any recurring items (to prevent duplicates)
    if (!USE_LOCAL_STORAGE) {
      const { data: existingRecurring, error: checkError } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('user_id', userId)
        .eq('is_recurring', true)
        .limit(1);

      if (checkError) throw checkError;

      // If user already has recurring items, don't create defaults
      if (existingRecurring && existingRecurring.length > 0) {
        console.log('[ChecklistStorage] User already has recurring items, skipping defaults');
        return [];
      }
    }

    console.log('[ChecklistStorage] Creating default checklist items for user');

    const itemsToCreate = DEFAULT_CHECKLIST_ITEMS.map((item, index) => {
      const baseItem = {
        user_id: userId,
        title: item.title,
        subtitle: item.subtitle,
        icon: item.icon,
        icon_color: item.icon_color,
        is_recurring: item.is_recurring,
        is_custom: item.is_custom,
        sort_order: item.sort_order,
        created_date: today,
        created_at: getCurrentTimestamp(),
      };

      // Only add ID for local storage
      if (USE_LOCAL_STORAGE) {
        baseItem.id = Date.now().toString() + index;
      }

      return baseItem;
    });

    if (USE_LOCAL_STORAGE) {
      // Local storage
      await AsyncStorage.setItem('@bodymax:checklist_items', JSON.stringify(itemsToCreate));
      return itemsToCreate.map(item => ({
        ...formatChecklistItemFromDB(item),
        is_completed: false,
        completion_id: null,
      }));
    } else {
      // Supabase
      const { data, error} = await supabase
        .from('checklist_items')
        .insert(itemsToCreate)
        .select();

      if (error) throw error;
      return (data || []).map(item => ({
        ...formatChecklistItemFromDB(item),
        is_completed: false,
        completion_id: null,
      }));
    }
  } catch (error) {
    console.error('Error creating default checklist items:', error);
    return [];
  }
};

/**
 * Add a new checklist item
 */
export const addChecklistItem = async (itemData) => {
  try {
    let userId = 'dev-user';
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const today = getTodayLocalDate();

    if (USE_LOCAL_STORAGE) {
      // Local storage
      const itemsData = await AsyncStorage.getItem('@bodymax:checklist_items');
      const items = itemsData ? JSON.parse(itemsData) : [];

      const nextSortOrder = items.length > 0
        ? Math.max(...items.map(i => i.sort_order || 0)) + 1
        : 0;

      const newItem = {
        id: Date.now().toString(),
        user_id: userId,
        title: itemData.title,
        subtitle: itemData.subtitle || '',
        icon: itemData.icon || 'checkbox',
        icon_color: itemData.icon_color || '#E85D04',
        is_recurring: itemData.is_recurring || false,
        is_custom: true,
        sort_order: nextSortOrder,
        created_date: today,
        created_at: getCurrentTimestamp(),
      };

      items.push(newItem);
      await AsyncStorage.setItem('@bodymax:checklist_items', JSON.stringify(items));

      console.log('Checklist item added:', newItem.id);
      return {
        ...formatChecklistItemFromDB(newItem),
        is_completed: false,
        completion_id: null,
      };
    } else {
      // Supabase
      const { data: existingItems } = await supabase
        .from('checklist_items')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = (existingItems?.[0]?.sort_order || 0) + 1;

      const itemRecord = {
        user_id: userId,
        title: itemData.title,
        subtitle: itemData.subtitle || '',
        icon: itemData.icon || 'checkbox',
        icon_color: itemData.icon_color || '#E85D04',
        is_recurring: itemData.is_recurring || false,
        is_custom: true,
        sort_order: nextSortOrder,
        created_date: today,
      };

      const { data, error } = await supabase
        .from('checklist_items')
        .insert(itemRecord)
        .select()
        .single();

      if (error) throw error;

      console.log('Checklist item added:', data.id);
      return {
        ...formatChecklistItemFromDB(data),
        is_completed: false,
        completion_id: null,
      };
    }
  } catch (error) {
    console.error('Error adding checklist item:', error);
    return null;
  }
};

/**
 * Toggle checklist item completion for today
 */
export const toggleChecklistCompletion = async (itemId, isCompleted, completionId = null) => {
  try {
    let userId = 'dev-user';
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const today = getTodayLocalDate();

    if (USE_LOCAL_STORAGE) {
      // Local storage
      const completionsData = await AsyncStorage.getItem('@bodymax:checklist_completions');
      let completions = completionsData ? JSON.parse(completionsData) : [];

      if (completionId) {
        // Update existing
        const index = completions.findIndex(c => c.id === completionId);
        if (index !== -1) {
          completions[index].is_completed = isCompleted;
          completions[index].completed_at = isCompleted ? getCurrentTimestamp() : null;
          await AsyncStorage.setItem('@bodymax:checklist_completions', JSON.stringify(completions));
          return completions[index];
        }
      } else {
        // Create new
        const newCompletion = {
          id: Date.now().toString(),
          user_id: userId,
          checklist_item_id: itemId,
          date: today,
          is_completed: isCompleted,
          completed_at: isCompleted ? getCurrentTimestamp() : null,
        };
        completions.push(newCompletion);
        await AsyncStorage.setItem('@bodymax:checklist_completions', JSON.stringify(completions));
        return newCompletion;
      }
    } else {
      // Supabase
      if (completionId) {
        const { data, error } = await supabase
          .from('checklist_completions')
          .update({
            is_completed: isCompleted,
            completed_at: isCompleted ? getCurrentTimestamp() : null,
          })
          .eq('id', completionId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('checklist_completions')
          .insert({
            user_id: userId,
            checklist_item_id: itemId,
            date: today,
            is_completed: isCompleted,
            completed_at: isCompleted ? getCurrentTimestamp() : null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }
  } catch (error) {
    console.error('Error toggling checklist completion:', error);
    return null;
  }
};

/**
 * Delete a checklist item
 */
export const deleteChecklistItem = async (itemId) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage - delete from items and completions
      const itemsData = await AsyncStorage.getItem('@bodymax:checklist_items');
      let items = itemsData ? JSON.parse(itemsData) : [];
      items = items.filter(i => i.id !== itemId);
      await AsyncStorage.setItem('@bodymax:checklist_items', JSON.stringify(items));

      const completionsData = await AsyncStorage.getItem('@bodymax:checklist_completions');
      let completions = completionsData ? JSON.parse(completionsData) : [];
      completions = completions.filter(c => c.checklist_item_id !== itemId);
      await AsyncStorage.setItem('@bodymax:checklist_completions', JSON.stringify(completions));

      console.log('Checklist item deleted:', itemId);
      return true;
    } else {
      // Supabase
      await supabase
        .from('checklist_completions')
        .delete()
        .eq('checklist_item_id', itemId);

      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      console.log('Checklist item deleted:', itemId);
      return true;
    }
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    return false;
  }
};

/**
 * Get completion stats for today
 * @returns {Promise<Object>} - Stats object
 */
export const getTodaysChecklistStats = async () => {
  try {
    const items = await getTodaysChecklist();
    const completedCount = items.filter(item => item.is_completed).length;
    const totalCount = items.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completedCount,
      totalCount,
      progressPercent,
    };
  } catch (error) {
    console.error('Error getting checklist stats:', error);
    return { completedCount: 0, totalCount: 0, progressPercent: 0 };
  }
};

/**
 * Format database record to app format
 * @param {Object} dbRecord - Database record
 * @returns {Object} - Formatted item for app use
 */
const formatChecklistItemFromDB = (dbRecord) => {
  return {
    id: dbRecord.id,
    title: dbRecord.title,
    subtitle: dbRecord.subtitle,
    icon: dbRecord.icon,
    iconColor: dbRecord.icon_color,
    is_recurring: dbRecord.is_recurring,
    is_custom: dbRecord.is_custom,
    sort_order: dbRecord.sort_order,
    created_date: dbRecord.created_date,
    created_at: dbRecord.created_at,
  };
};

/**
 * Update checklist items with dynamic values from user profile and exercises
 * @param {Array} items - Checklist items
 * @param {Object} profile - User profile
 * @param {Array} exercises - Today's exercises
 * @returns {Array} - Updated items
 */
const updateDynamicChecklistValues = (items, profile, exercises) => {
  return items.map(item => {
    // Update protein goal with user's actual target
    if (item.title === 'Hit your protein goal' && profile?.protein_g) {
      return {
        ...item,
        subtitle: `${profile.protein_g}g protein target`,
      };
    }

    // Update workout completion with total exercise duration
    if (item.title === 'Complete your workout' && exercises?.length > 0) {
      // Calculate total duration from exercises
      const totalMinutes = exercises.reduce((total, exercise) => {
        // Extract minutes from duration string (e.g., "20 min" -> 20)
        const match = exercise.duration?.match(/(\d+)/);
        return total + (match ? parseInt(match[1]) : 0);
      }, 0);

      return {
        ...item,
        subtitle: `Hit that ${totalMinutes} min cardio`,
      };
    }

    return item;
  });
};

/**
 * Remove duplicate checklist items
 * Keeps only the oldest instance of each duplicate title
 */
export const removeDuplicateChecklistItems = async () => {
  try {
    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { removed: 0 };
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    if (USE_LOCAL_STORAGE) {
      // Local storage cleanup
      const itemsData = await AsyncStorage.getItem('@bodymax:checklist_items');
      let items = itemsData ? JSON.parse(itemsData) : [];

      const seen = new Map();
      const toKeep = [];
      const toRemove = [];

      items.forEach(item => {
        const key = `${item.title}_${item.is_recurring}`;
        if (!seen.has(key)) {
          seen.set(key, true);
          toKeep.push(item);
        } else {
          toRemove.push(item.id);
        }
      });

      await AsyncStorage.setItem('@bodymax:checklist_items', JSON.stringify(toKeep));
      console.log(`Removed ${toRemove.length} duplicate checklist items`);
      return { removed: toRemove.length };
    } else {
      // Supabase cleanup - find duplicates by title and is_recurring
      const { data: items, error } = await supabase
        .from('checklist_items')
        .select('id, title, is_recurring, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const seen = new Map();
      const toRemove = [];

      items.forEach(item => {
        const key = `${item.title}_${item.is_recurring}`;
        if (!seen.has(key)) {
          seen.set(key, item.id);
        } else {
          // This is a duplicate, mark for removal
          toRemove.push(item.id);
        }
      });

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('checklist_items')
          .delete()
          .in('id', toRemove);

        if (deleteError) throw deleteError;
        console.log(`Removed ${toRemove.length} duplicate checklist items`);
      }

      return { removed: toRemove.length };
    }
  } catch (error) {
    console.error('Error removing duplicate checklist items:', error);
    return { removed: 0 };
  }
};

export default {
  getTodaysChecklist,
  addChecklistItem,
  toggleChecklistCompletion,
  deleteChecklistItem,
  getTodaysChecklistStats,
  removeDuplicateChecklistItems,
};
