import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import SettingsButton from '../components/common/SettingsButton';
import DailyChecklist from '../components/common/DailyChecklist';
import ExerciseList from '../components/common/ExerciseList';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { Ionicons } from '@expo/vector-icons';
import { saveMeal, deleteMeal } from '../services/mealStorage';
import { generateDailyMealPlan } from '../services/mealPlanGeneration';
import { generateMealPlanImages } from '../services/imageGeneration';
import { saveDailyMealPlan, getMealPlanForDate, updateMealCompletion } from '../services/mealPlanStorage';
import { getLocalDateString } from '../utils/dateUtils';
import { removeDuplicateChecklistItems } from '../services/checklistStorage';
import { useAuth } from '../context/AuthContext';

const DailyScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { profile } = useAuth();
  const initialTab = route.params?.initialTab || 'Checklist';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [exerciseCalories, setExerciseCalories] = useState(0);
  // Meal plan state (for Nutrition tab)
  const [mealPlan, setMealPlan] = useState(null);
  const [isGeneratingMeals, setIsGeneratingMeals] = useState(false);
  const [mealGenerationProgress, setMealGenerationProgress] = useState(0);

  // Update active tab if navigation params change
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // Clean up duplicate checklist items on first mount
  useEffect(() => {
    const cleanupDuplicates = async () => {
      const result = await removeDuplicateChecklistItems();
      if (result.removed > 0) {
        console.log(`[DailyScreen] Cleaned up ${result.removed} duplicate checklist items`);
      }
    };
    cleanupDuplicates();
  }, []);

  // Load today's meal plan when screen is focused
  const loadTodayMealPlan = useCallback(async () => {
    try {
      const todayDate = getLocalDateString(new Date());
      console.log('[DailyScreen] Loading meal plan for:', todayDate);
      const plan = await getMealPlanForDate(todayDate);
      setMealPlan(plan);
      console.log('[DailyScreen] Meal plan loaded:', plan ? 'found' : 'not found');
    } catch (error) {
      console.error('[DailyScreen] Error loading meal plan:', error);
      setMealPlan(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodayMealPlan();
    }, [loadTodayMealPlan])
  );

  // Handle create meals button press
  const handleCreateMeals = async () => {
    if (!profile) {
      Alert.alert('Profile Required', 'Please complete your profile first.');
      return;
    }

    try {
      setIsGeneratingMeals(true);
      setMealGenerationProgress(0);

      // Stage 1: Generating meal plan (0-40%)
      console.log('[DailyScreen] Generating meal plan...');
      setMealGenerationProgress(20);
      const mealPlanResult = await generateDailyMealPlan(profile);

      if (!mealPlanResult.success) {
        throw new Error(mealPlanResult.error);
      }
      setMealGenerationProgress(40);

      // Stage 2: Generating meal images (40-80%)
      console.log('[DailyScreen] Generating meal images...');
      const mealsWithImages = await generateMealPlanImages(mealPlanResult.data.meals);
      setMealGenerationProgress(80);

      const finalMealPlan = {
        ...mealPlanResult.data,
        meals: mealsWithImages,
      };

      // Stage 3: Saving meal plan (80-100%)
      console.log('[DailyScreen] Saving meal plan...');
      const todayDate = getLocalDateString(new Date());
      await saveDailyMealPlan(todayDate, finalMealPlan);
      setMealGenerationProgress(100);

      console.log('[DailyScreen] Meal plan created successfully!');
      setMealPlan(finalMealPlan);

      Alert.alert('Success', 'Your meal plan has been created!');
    } catch (error) {
      console.error('[DailyScreen] Error creating meals:', error);
      Alert.alert('Error', 'Failed to create meal plan. Please try again.');
    } finally {
      setIsGeneratingMeals(false);
      setMealGenerationProgress(0);
    }
  };

  // Handle meal checkbox toggle
  const handleMealToggle = async (mealType, currentStatus) => {
    try {
      const todayDate = getLocalDateString(new Date());
      const newStatus = !currentStatus;

      // Find the meal from the plan
      const meal = mealPlan.meals.find(m => m.meal_type === mealType);
      if (!meal) return;

      if (newStatus) {
        // Checking the meal - save to meal_logs
        console.log('[DailyScreen] Saving meal to logs:', meal.name);

        const structuredIngredients = (meal.ingredients || []).map(ingredient => {
          if (typeof ingredient === 'object' && ingredient.name) {
            return ingredient;
          }
          return {
            name: typeof ingredient === 'string' ? ingredient : String(ingredient),
            portion: meal.portion_details || 'As specified',
            calories: 0,
          };
        });

        const mealData = {
          meal_name: meal.name,
          meal_time: meal.meal_type,
          total_calories: meal.calories,
          macros: {
            protein_g: meal.protein_g || 0,
            carbs_g: meal.carbs_g || 0,
            fat_g: meal.fat_g || 0,
            fiber_g: meal.fiber_g || 0,
            sugar_g: meal.sugar_g || 0,
            sodium_mg: meal.sodium_mg || 0,
          },
          servings: 1,
          notes: `From meal plan: ${todayDate}`,
          photo_uri: meal.image_uri || null,
          ingredients: structuredIngredients,
          confidence: 'high',
          date: todayDate,
        };

        const savedMeal = await saveMeal(mealData);
        console.log('[DailyScreen] Meal saved with ID:', savedMeal.id);

        // Update meal plan with meal_log_id
        await updateMealCompletion(todayDate, mealType, newStatus, savedMeal.id);

        // Update local state
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(m =>
            m.meal_type === mealType ? { ...m, completed: newStatus, meal_log_id: savedMeal.id } : m
          ),
        }));

      } else {
        // Unchecking the meal - delete from meal_logs
        console.log('[DailyScreen] Deleting meal from logs:', meal.meal_log_id);

        if (meal.meal_log_id) {
          await deleteMeal(meal.meal_log_id);
          console.log('[DailyScreen] Meal deleted');
        }

        // Update meal plan
        await updateMealCompletion(todayDate, mealType, newStatus, null);

        // Update local state
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(m =>
            m.meal_type === mealType ? { ...m, completed: newStatus, meal_log_id: null } : m
          ),
        }));
      }
    } catch (error) {
      console.error('[DailyScreen] Error toggling meal:', error);
      Alert.alert('Error', 'Failed to update meal. Please try again.');
    }
  };

  const tabs = ['Checklist', 'Nutrition', 'Exercise'];

  // Dynamic header text based on active tab
  const getHeaderText = () => {
    switch (activeTab) {
      case 'Checklist':
        return { orange: 'Your', rest: ' daily routine' };
      case 'Nutrition':
        return { orange: 'Your', rest: ' meal plan' };
      case 'Exercise':
        return { orange: 'Your', rest: ' Workouts' };
      default:
        return { orange: 'Your', rest: ' meal plan' };
    }
  };

  const headerText = getHeaderText();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={styles.titleOrange}>{headerText.orange}</Text>{headerText.rest}
        </Text>
        <SettingsButton onPress={() => navigation.navigate('Profile')} />
      </View>

      {/* Tab Chooser */}
      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Nutrition' && (
          <View>
            {/* Meal Plan Content for Today */}
            {isGeneratingMeals ? (
              <View style={styles.loadingContainer}>
                <LoadingIndicator
                  text="Generating your meal plan..."
                  subtext="This may take a moment"
                  progress={mealGenerationProgress}
                />
              </View>
            ) : mealPlan && mealPlan.meals ? (
              <View style={styles.mealCardsContainer}>
                {mealPlan.meals.map((meal, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.mealCard}
                    onPress={() => {
                      const todayDate = getLocalDateString(new Date());
                      navigation.navigate('MealDetails', { meal, date: todayDate });
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Meal Image */}
                    <View style={styles.mealImageContainer}>
                      {meal.image_uri ? (
                        <Image
                          source={{ uri: meal.image_uri }}
                          style={styles.mealImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.mealImage, styles.mealImagePlaceholder]}>
                          <Ionicons name="fast-food" size={32} color={Colors.dark.textSecondary} />
                        </View>
                      )}
                    </View>

                    {/* Meal Info */}
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName} numberOfLines={2}>
                        {meal.name}
                      </Text>
                      <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                    </View>

                    {/* Checkbox */}
                    <TouchableOpacity
                      style={styles.mealCheckbox}
                      onPress={() => handleMealToggle(meal.meal_type, meal.completed)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        meal.completed && styles.checkboxChecked
                      ]}>
                        {meal.completed && (
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.dayContentContainer}>
                <Text style={styles.dayContentText}>No meal plan for today</Text>
                <TouchableOpacity
                  style={styles.createMealsButton}
                  activeOpacity={0.8}
                  onPress={handleCreateMeals}
                >
                  <Text style={styles.createMealsButtonText}>Generate meal plan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Checklist' && (
          <View>
            <DailyChecklist />
          </View>
        )}

        {activeTab === 'Exercise' && (
          <View>
            <ExerciseList 
              onExerciseCaloriesChange={setExerciseCalories}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.textPrimary,
  },
  titleOrange: {
    color: Colors.dark.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  tabActive: {
    backgroundColor: Colors.dark.primary, // Orange from design.md
  },
  tabText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: Colors.dark.textPrimary,
    fontFamily: 'Rubik_600SemiBold',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  placeholderText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  // Meal plan styles
  loadingContainer: {
    marginTop: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCardsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  mealImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealImagePlaceholder: {
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  mealName: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xs,
  },
  mealCalories: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
  },
  mealCheckbox: {
    marginLeft: Spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  dayContentContainer: {
    marginTop: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContentText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.lg,
  },
  createMealsButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  createMealsButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
});

export default DailyScreen;
