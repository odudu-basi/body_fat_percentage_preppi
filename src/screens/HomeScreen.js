import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import DailyCalorieCard from '../components/common/DailyCalorieCard';
import SettingsButton from '../components/common/SettingsButton';
import { getTodaysCalories, saveMeal, deleteMeal } from '../services/mealStorage';
import { getTodaysBurnedCalories } from '../services/exerciseStorage';
import { generateDailyMealPlan } from '../services/mealPlanGeneration';
import { generateMealPlanImages } from '../services/imageGeneration';
import { saveDailyMealPlan, getMealPlanForDate, updateMealCompletion } from '../services/mealPlanStorage';
import { useAuth } from '../context/AuthContext';
import { trackLogoPress } from '../utils/analytics';
import { getLocalDateString } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, user, isAuthenticated } = useAuth();
  const [totalCalories, setTotalCalories] = useState(0);
  const [exerciseCalories, setExerciseCalories] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());
  const [todayDayIndex] = useState(new Date().getDay()); // Track today's day index
  const [mealPlan, setMealPlan] = useState(null);
  const [isGeneratingMeals, setIsGeneratingMeals] = useState(false);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // Only load data if user is authenticated
        if (!isAuthenticated || !user) {
          console.log('HomeScreen: User not authenticated, skipping data load');
          return;
        }

        console.log('HomeScreen focused - loading data for user:', user.id);

        // Load today's calories
        try {
          const calories = await getTodaysCalories();
          setTotalCalories(calories);
          console.log('Today\'s calories loaded:', calories);
        } catch (error) {
          console.error('Error loading calories:', error);
        }
        
        // Load exercise burned calories
        try {
          const burned = await getTodaysBurnedCalories();
          setExerciseCalories(burned);
          console.log('Exercise calories loaded:', burned);
        } catch (error) {
          console.error('Error loading exercise calories:', error);
        }
      };
      loadData();
    }, [isAuthenticated, user])
  );

  // Also load on initial mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const calories = await getTodaysCalories();
        setTotalCalories(calories);
      } catch (error) {
        console.error('Error loading initial calories:', error);
      }

      try {
        const burned = await getTodaysBurnedCalories();
        setExerciseCalories(burned);
      } catch (error) {
        console.error('Error loading initial exercise calories:', error);
      }
    };
    loadInitialData();
  }, []);

  const handleLogoPress = () => {
    trackLogoPress('Home');
    navigation.navigate('Buddy');
  };

  // Get date for selected day index
  const getDateForDayIndex = (dayIndex) => {
    const today = new Date();
    const currentDayIndex = today.getDay();
    const diff = dayIndex - currentDayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return getLocalDateString(targetDate);
  };

  // Load meal plan for selected day
  const loadMealPlanForDay = async (dayIndex) => {
    try {
      const dateStr = getDateForDayIndex(dayIndex);
      console.log('[HomeScreen] Loading meal plan for:', dateStr);
      const plan = await getMealPlanForDate(dateStr);
      setMealPlan(plan);
      console.log('[HomeScreen] Meal plan loaded:', plan ? 'found' : 'not found');
    } catch (error) {
      console.error('[HomeScreen] Error loading meal plan:', error);
      setMealPlan(null);
    }
  };

  // Load meal plan when selected day changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadMealPlanForDay(selectedDayIndex);
    }
  }, [selectedDayIndex, isAuthenticated, user]);

  // Reload meal plan when screen comes back into focus (to get updated recipes)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user) {
        loadMealPlanForDay(selectedDayIndex);
      }
    }, [selectedDayIndex, isAuthenticated, user])
  );

  // Handle create meals button press
  const handleCreateMeals = async () => {
    if (!profile) {
      Alert.alert('Profile Required', 'Please complete your profile first.');
      return;
    }

    try {
      setIsGeneratingMeals(true);

      console.log('[HomeScreen] Generating meal plan...');
      const mealPlanResult = await generateDailyMealPlan(profile);

      if (!mealPlanResult.success) {
        throw new Error(mealPlanResult.error);
      }

      console.log('[HomeScreen] Generating meal images...');
      const mealsWithImages = await generateMealPlanImages(mealPlanResult.data.meals);

      const finalMealPlan = {
        ...mealPlanResult.data,
        meals: mealsWithImages,
      };

      console.log('[HomeScreen] Saving meal plan...');
      const dateStr = getDateForDayIndex(selectedDayIndex);
      await saveDailyMealPlan(dateStr, finalMealPlan);

      console.log('[HomeScreen] Meal plan created successfully!');
      setMealPlan(finalMealPlan);

      Alert.alert('Success', 'Your meal plan has been created!');
    } catch (error) {
      console.error('[HomeScreen] Error creating meals:', error);
      Alert.alert('Error', 'Failed to create meal plan. Please try again.');
    } finally {
      setIsGeneratingMeals(false);
    }
  };

  // Handle meal checkbox toggle
  const handleMealToggle = async (mealType, currentStatus) => {
    try {
      const dateStr = getDateForDayIndex(selectedDayIndex);
      const newStatus = !currentStatus;

      // Find the meal from the plan
      const meal = mealPlan.meals.find(m => m.meal_type === mealType);
      if (!meal) return;

      if (newStatus) {
        // Checking the meal - save to meal_logs with the selected day's date
        console.log('[HomeScreen] Saving meal to logs:', meal.name, 'for date:', dateStr);

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
          notes: `From meal plan: ${dateStr}`,
          photo_uri: meal.image_uri || null,
          ingredients: meal.ingredients || [],
          confidence: 'high',
          date: dateStr, // Pass the selected day's date
        };

        const savedMeal = await saveMeal(mealData);
        console.log('[HomeScreen] Meal saved with ID:', savedMeal.id, 'for date:', dateStr);

        // Update meal plan with meal_log_id
        await updateMealCompletion(dateStr, mealType, newStatus, savedMeal.id);

        // Update local state
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(m =>
            m.meal_type === mealType ? { ...m, completed: newStatus, meal_log_id: savedMeal.id } : m
          ),
        }));

        // Reload calorie data (only if selected day is today)
        const today = new Date();
        const selectedDate = getDateForDayIndex(selectedDayIndex);
        const todayDate = getLocalDateString(today);

        if (selectedDate === todayDate) {
          const calories = await getTodaysCalories();
          setTotalCalories(calories);
          console.log('[HomeScreen] Updated today\'s calories:', calories);
        }

      } else {
        // Unchecking the meal - delete from meal_logs
        console.log('[HomeScreen] Deleting meal from logs:', meal.meal_log_id);

        if (meal.meal_log_id) {
          await deleteMeal(meal.meal_log_id);
          console.log('[HomeScreen] Meal deleted');
        }

        // Update meal plan
        await updateMealCompletion(dateStr, mealType, newStatus, null);

        // Update local state
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(m =>
            m.meal_type === mealType ? { ...m, completed: newStatus, meal_log_id: null } : m
          ),
        }));

        // Reload calorie data (only if selected day is today)
        const today = new Date();
        const selectedDate = getDateForDayIndex(selectedDayIndex);
        const todayDate = getLocalDateString(today);

        if (selectedDate === todayDate) {
          const calories = await getTodaysCalories();
          setTotalCalories(calories);
          console.log('[HomeScreen] Updated today\'s calories:', calories);
        }
      }
    } catch (error) {
      console.error('[HomeScreen] Error toggling meal:', error);
      Alert.alert('Error', 'Failed to update meal. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header with Logo and Settings */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.logoContainer} 
          onPress={handleLogoPress}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={styles.brandBody}>Body</Text>
            <Text style={styles.brandMax}>Maxx</Text>
          </View>
        </TouchableOpacity>
        <SettingsButton onPress={() => navigation.navigate('Profile')} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Weight Cards */}
        <View style={styles.weightCardsContainer}>
          {/* Current Weight Card */}
          <View style={styles.weightCard}>
            <Text style={styles.weightCardLabel}>Current Weight</Text>
            <Text style={styles.weightCardValue}>
              {profile?.weight_kg ? `${Math.round(profile.weight_kg * 2.20462)} lbs` : 'N/A'}
            </Text>
            {profile?.weight_kg && (
              <Text style={styles.weightCardSubtext}>
                {Math.round(profile.weight_kg)} kg
              </Text>
            )}
          </View>

          {/* Target Weight Card */}
          <View style={styles.weightCard}>
            <Text style={styles.weightCardLabel}>Target Weight</Text>
            <Text style={styles.weightCardValue}>N/A</Text>
          </View>
        </View>

        {/* Day Slider */}
        <View style={styles.daySliderSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySliderContainer}
          >
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  selectedDayIndex === index && styles.dayButtonActive,
                  todayDayIndex === index && selectedDayIndex !== index && styles.dayButtonToday
                ]}
                onPress={() => setSelectedDayIndex(index)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDayIndex === index && styles.dayButtonTextActive
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content for selected day */}
          {isGeneratingMeals ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
              <Text style={styles.loadingText}>Generating your meal plan...</Text>
              <Text style={styles.loadingSubtext}>This may take a moment</Text>
            </View>
          ) : mealPlan && mealPlan.meals ? (
            <View style={styles.mealCardsContainer}>
              {mealPlan.meals.map((meal, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.mealCard}
                  onPress={() => {
                    const dateStr = getDateForDayIndex(selectedDayIndex);
                    navigation.navigate('MealDetails', { meal, date: dateStr });
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
              <Text style={styles.dayContentText}>Nothing to show for today</Text>
              <TouchableOpacity
                style={styles.createMealsButton}
                activeOpacity={0.8}
                onPress={handleCreateMeals}
              >
                <Text style={styles.createMealsButtonText}>Create meals for today</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Calorie Card - Same as Nutrition tab */}
        <View style={styles.calorieSection}>
          <DailyCalorieCard
            caloriesConsumed={totalCalories}
            dailyTarget={profile?.daily_calorie_target || 2000}
            bonusCalories={exerciseCalories}
          />
        </View>
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
    paddingBottom: Spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 64,
    height: 64,
  },
  brandText: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },
  brandBody: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.primary,
  },
  brandMax: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.textPrimary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140, // Extra padding for glassmorphic tab bar
  },
  weightCardsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  weightCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  weightCardLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  weightCardValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xs,
  },
  weightCardSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  calorieSection: {
    marginTop: Spacing.lg,
  },
  daySliderSection: {
    marginTop: Spacing.lg,
  },
  daySliderContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  dayButtonToday: {
    borderColor: Colors.dark.primary,
  },
  dayButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
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
  loadingContainer: {
    marginTop: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.md,
  },
  loadingSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
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
});

export default HomeScreen;

