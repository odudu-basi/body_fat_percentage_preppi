import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { generateMealRecipe } from '../services/recipeGeneration';
import { updateMealRecipe } from '../services/mealPlanStorage';
import { getLocalDateString } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

// Macro Card Component
const MacroCard = ({ icon, label, value, unit, color, isFirst }) => (
  <View style={[
    styles.macroCard,
    { borderLeftColor: color },
    isFirst && styles.macroCardFirst,
  ]}>
    <Text style={styles.macroIcon}>{icon}</Text>
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}>{unit}</Text></Text>
  </View>
);

const MealDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { meal, date } = route.params || {};

  const [isLoading, setIsLoading] = useState(!meal?.recipe); // Skip loading if recipe exists
  const [recipe, setRecipe] = useState(meal?.recipe || null);
  const [error, setError] = useState(null);
  const [macroPage, setMacroPage] = useState(0);

  useEffect(() => {
    const loadRecipe = async () => {
      // If recipe already exists, use it
      if (meal?.recipe) {
        console.log('[MealDetails] Using existing recipe');
        setRecipe(meal.recipe);
        setIsLoading(false);
        return;
      }

      try {
        console.log('[MealDetails] Generating recipe for:', meal.name);
        const result = await generateMealRecipe(meal);

        if (result.success) {
          setRecipe(result.data);

          // Save recipe to database
          if (date) {
            console.log('[MealDetails] Saving recipe to database');
            await updateMealRecipe(date, meal.meal_type, result.data);
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('[MealDetails] Error:', err);
        setError('Failed to load recipe');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [meal, date]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleReplaceMeal = () => {
    navigation.navigate('ReplaceMeal', { meal, date });
  };

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Generating recipe...</Text>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.dark.primary} />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Details</Text>
        <TouchableOpacity style={styles.replaceMealButton} onPress={handleReplaceMeal}>
          <Text style={styles.replaceMealText}>Replace Meal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Food Image */}
        <View style={styles.imageContainer}>
          {meal.image_uri ? (
            <Image
              source={{ uri: meal.image_uri }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.foodImage, styles.placeholderImage]}>
              <Ionicons name="fast-food" size={64} color={Colors.dark.textSecondary} />
            </View>
          )}
          {/* Calories badge on image - bottom right */}
          <View style={styles.caloriesBadge}>
            <Text style={styles.caloriesBadgeText}>{meal.calories} kcal</Text>
          </View>
        </View>

        {/* Meal Info Card */}
        <View style={styles.mealInfoCard}>
          {/* Meal Name and Servings */}
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <View style={styles.servingsButton}>
              <Text style={styles.servingsText}>{recipe?.servings || 1} serving</Text>
            </View>
          </View>

          {/* Calories Card */}
          <View style={styles.caloriesCard}>
            <View style={styles.caloriesIcon}>
              <Ionicons name="flame" size={24} color={Colors.dark.primary} />
            </View>
            <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <Text style={styles.caloriesValue}>{meal.calories}</Text>
            </View>
          </View>

          {/* Macros Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const page = Math.round(offsetX / (width - (Spacing.lg * 2)));
              setMacroPage(page);
            }}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={width - (Spacing.lg * 2)}
            snapToAlignment="start"
          >
            {/* Page 1: Primary Macros */}
            <View style={[styles.macrosRow, { width: width - (Spacing.lg * 2) }]}>
              <MacroCard
                icon="🥩"
                label="Protein"
                value={meal.protein_g || 0}
                unit="g"
                color="#E57373"
                isFirst={true}
              />
              <MacroCard
                icon="🌾"
                label="Carbs"
                value={meal.carbs_g || 0}
                unit="g"
                color={Colors.dark.primary}
              />
              <MacroCard
                icon="💧"
                label="Fats"
                value={meal.fat_g || 0}
                unit="g"
                color="#64B5F6"
              />
            </View>

            {/* Page 2: Secondary Macros */}
            <View style={[styles.macrosRow, { width: width - (Spacing.lg * 2) }]}>
              <MacroCard
                icon="🥬"
                label="Fiber"
                value={meal.fiber_g || 0}
                unit="g"
                color="#8BC34A"
                isFirst={true}
              />
              <MacroCard
                icon="🍬"
                label="Sugar"
                value={meal.sugar_g || 0}
                unit="g"
                color="#FF5722"
              />
              <MacroCard
                icon="🧂"
                label="Sodium"
                value={meal.sodium_mg || 0}
                unit="mg"
                color="#9C27B0"
              />
            </View>
          </ScrollView>

          {/* Pagination dots */}
          <View style={styles.paginationDots}>
            <View style={[styles.dot, macroPage === 0 && styles.dotActive]} />
            <View style={[styles.dot, macroPage === 1 && styles.dotActive]} />
          </View>
        </View>

        {/* Ingredients Section */}
        {recipe?.ingredients && recipe.ingredients.length > 0 && (
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientAccent} />
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientPortion}>{ingredient.amount}</Text>
                </View>
                {ingredient.calories > 0 && (
                  <Text style={styles.ingredientCalories}>{ingredient.calories} cal</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recipe Section */}
        {recipe?.instructions && recipe.instructions.length > 0 && (
          <View style={styles.recipeSection}>
            <Text style={styles.sectionTitle}>Recipe</Text>

            {/* Time Info */}
            {(recipe.prep_time || recipe.cook_time) && (
              <View style={styles.timeInfo}>
                {recipe.prep_time && (
                  <View style={styles.timeItem}>
                    <Ionicons name="time-outline" size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.timeText}>Prep: {recipe.prep_time}</Text>
                  </View>
                )}
                {recipe.cook_time && (
                  <View style={styles.timeItem}>
                    <Ionicons name="flame-outline" size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.timeText}>Cook: {recipe.cook_time}</Text>
                  </View>
                )}
                {recipe.difficulty && (
                  <View style={styles.timeItem}>
                    <Ionicons name="bar-chart-outline" size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.timeText}>{recipe.difficulty}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>

            {/* Tips */}
            {recipe.tips && recipe.tips.length > 0 && (
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Tips</Text>
                {recipe.tips.map((tip, index) => (
                  <Text key={index} style={styles.tipText}>• {tip}</Text>
                ))}
              </View>
            )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.md,
  },
  errorTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.lg,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xl,
  },
  backButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  headerTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  replaceMealButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
  },
  replaceMealText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: width,
    height: width * 0.7,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  caloriesBadgeText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.primary,
  },
  mealInfoCard: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  mealName: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 24,
    color: Colors.dark.textPrimary,
    flex: 1,
    marginRight: Spacing.md,
  },
  servingsButton: {
    backgroundColor: Colors.dark.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  servingsText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },
  caloriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  caloriesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  caloriesInfo: {
    flex: 1,
  },
  caloriesLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  caloriesValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.textPrimary,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginHorizontal: 4,
    borderLeftWidth: 4,
  },
  macroCardFirst: {
    marginLeft: 0,
  },
  macroIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
  },
  macroValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
  },
  macroUnit: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(160, 160, 160, 0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.dark.primary,
    width: 24,
  },
  ingredientsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.md,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  ingredientAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.dark.primary,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  ingredientInfo: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  ingredientName: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
  },
  ingredientPortion: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  ingredientCalories: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  recipeSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  timeInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  timeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.xs,
  },
  instructionsContainer: {
    marginTop: Spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  instructionNumberText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.sm,
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  tipsTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  tipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
});

export default MealDetailsScreen;
