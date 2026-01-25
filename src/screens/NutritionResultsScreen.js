import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { analyzeFoodPhoto } from '../services/foodAnalysis';
import { saveMeal, updateMeal, formatMealForStorage } from '../services/mealStorage';
import { trackMealLog } from '../utils/analytics';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Progress Circle Component (same as ResultsScreen)
const ProgressCircle = ({ progress, size = 160, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <Svg width={size} height={size} style={styles.progressSvg}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(232, 93, 4, 0.2)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.dark.primary}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
};

// Macro Card Component - Following design.md: Orange accent on left edge
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

// Ingredient Item Component - Following design.md: Cards with rounded corners and orange accent
const IngredientItem = ({ ingredient, onPress, onDelete }) => {
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={onDelete}
      activeOpacity={0.8}
    >
      <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <TouchableOpacity
        style={styles.ingredientItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.ingredientAccent} />
        <View style={styles.ingredientInfo}>
          <Text style={styles.ingredientName}>{ingredient.name}</Text>
          <Text style={styles.ingredientPortion}>{ingredient.portion}</Text>
        </View>
        <Text style={styles.ingredientCalories}>{ingredient.calories} cal</Text>
      </TouchableOpacity>
    </Swipeable>
  );
};

const NutritionResultsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { photoUri, existingMeal } = route.params || {};
  
  // For existing meals, use original_analysis if available, otherwise construct from meal data
  const getInitialAnalysisResult = () => {
    if (!existingMeal) return null;
    
    // If we have the original analysis, use it
    if (existingMeal.original_analysis) {
      return existingMeal.original_analysis;
    }
    
    // Otherwise, construct from the saved meal data
    return {
      meal_name: existingMeal.meal_name,
      meal_time: existingMeal.meal_time,
      total_calories: existingMeal.total_calories,
      macros: existingMeal.macros,
      ingredients: existingMeal.ingredients,
      confidence: existingMeal.confidence,
      notes: existingMeal.notes,
    };
  };

  const [isLoading, setIsLoading] = useState(!existingMeal);
  const [analysisResult, setAnalysisResult] = useState(getInitialAnalysisResult);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(existingMeal ? 100 : 0);
  const [servings, setServings] = useState(existingMeal?.servings || 1);
  const [showAdjustSheet, setShowAdjustSheet] = useState(false);
  const [adjustedCalories, setAdjustedCalories] = useState('');
  const [macroPage, setMacroPage] = useState(0);
  const [showServingsSheet, setShowServingsSheet] = useState(false);
  const [tempServings, setTempServings] = useState('1');
  const [calorieOverride, setCalorieOverride] = useState(null); // For manual calorie adjustment

  // Ingredients management
  const [ingredients, setIngredients] = useState(analysisResult?.ingredients || []);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null); // null = adding new, otherwise editing
  const [tempIngredientName, setTempIngredientName] = useState('');
  const [tempIngredientPortion, setTempIngredientPortion] = useState('');
  const [tempIngredientCalories, setTempIngredientCalories] = useState('');

  // Flag to know if we're viewing an existing meal (to hide save on Done)
  const isViewingExisting = !!existingMeal;

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 70) {
            return prev + Math.random() * 15;
          } else if (prev < 90) {
            return prev + Math.random() * 3;
          }
          return prev;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isLoading]);

  // Run analysis when screen mounts (only for new photos, not existing meals)
  useEffect(() => {
    // Skip analysis if viewing an existing meal
    if (existingMeal) {
      console.log('[NutritionResults] Viewing existing meal, skipping analysis');
      return;
    }

    const runAnalysis = async () => {
      if (!photoUri) {
        setError('No photo provided');
        setIsLoading(false);
        return;
      }

      try {
        const result = await analyzeFoodPhoto(photoUri);

        if (result.success) {
          setAnalysisResult(result.data);
          setIngredients(result.data.ingredients || []);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Analysis error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, [photoUri, existingMeal]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    // Re-run analysis
    analyzeFoodPhoto(photoUri).then(result => {
      if (result.success) {
        setAnalysisResult(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    });
  };

  const handleDone = async () => {
    if (analysisResult) {
      try {
        // Format the meal with current servings (adjusts all macros)
        const formattedMeal = formatMealForStorage(analysisResult, displayPhotoUri, servings);

        // If calories were manually adjusted, override the calculated value
        if (calorieOverride !== null) {
          formattedMeal.total_calories = calorieOverride;
        }

        if (isViewingExisting && existingMeal?.id) {
          // Update existing meal with new values
          await updateMeal(existingMeal.id, {
            total_calories: formattedMeal.total_calories,
            macros: formattedMeal.macros,
            servings: servings,
          });
          console.log('Meal updated successfully');
        } else {
          // Save as new meal
          await saveMeal(formattedMeal);
          console.log('Meal saved successfully');

          // Track meal logging in Mixpanel
          trackMealLog(
            analysisResult.meal_type || 'unknown',
            formattedMeal.total_calories,
            !!displayPhotoUri
          );
        }
      } catch (error) {
        console.error('Error saving/updating meal:', error);
      }
    }
    navigation.goBack();
  };

  const handleAdjustCalories = () => {
    // Open the adjust calories sheet with current displayed calories
    const currentCalories = calorieOverride !== null 
      ? calorieOverride 
      : Math.round((analysisResult?.total_calories || 0) * servings);
    setAdjustedCalories(currentCalories.toString());
    setShowAdjustSheet(true);
  };

  const handleUpdateCalories = () => {
    // Set the calorie override
    const newCalories = parseInt(adjustedCalories, 10);
    if (!isNaN(newCalories) && newCalories >= 0) {
      setCalorieOverride(newCalories);
    }
    setShowAdjustSheet(false);
  };

  const handleOpenServingsSheet = () => {
    setTempServings(servings.toString());
    setShowServingsSheet(true);
  };

  const handleUpdateServings = () => {
    const newServings = parseFloat(tempServings);
    if (!isNaN(newServings) && newServings > 0) {
      setServings(newServings);
      // Reset calorie override when servings change (recalculate from base)
      setCalorieOverride(null);
    }
    setShowServingsSheet(false);
  };

  // Ingredient management handlers
  const handleDeleteIngredient = (index) => {
    Alert.alert(
      'Delete Ingredient',
      'Are you sure you want to remove this ingredient?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newIngredients = ingredients.filter((_, i) => i !== index);
            setIngredients(newIngredients);
            // Recalculate total calories
            recalculateTotalCalories(newIngredients);
          },
        },
      ]
    );
  };

  const handleEditIngredient = (index) => {
    const ingredient = ingredients[index];
    setEditingIngredient(index);
    setTempIngredientName(ingredient.name);
    setTempIngredientPortion(ingredient.portion);
    setTempIngredientCalories(ingredient.calories.toString());
    setShowIngredientModal(true);
  };

  const handleAddIngredient = () => {
    setEditingIngredient(null);
    setTempIngredientName('');
    setTempIngredientPortion('');
    setTempIngredientCalories('');
    setShowIngredientModal(true);
  };

  const handleSaveIngredient = () => {
    const name = tempIngredientName.trim();
    const portion = tempIngredientPortion.trim();
    const calories = parseInt(tempIngredientCalories, 10);

    if (!name || !portion || isNaN(calories) || calories < 0) {
      Alert.alert('Invalid Input', 'Please fill in all fields correctly.');
      return;
    }

    const newIngredient = { name, portion, calories };

    let newIngredients;
    if (editingIngredient !== null) {
      // Editing existing ingredient
      newIngredients = [...ingredients];
      newIngredients[editingIngredient] = newIngredient;
    } else {
      // Adding new ingredient
      newIngredients = [...ingredients, newIngredient];
    }

    setIngredients(newIngredients);
    recalculateTotalCalories(newIngredients);
    setShowIngredientModal(false);
  };

  const recalculateTotalCalories = (updatedIngredients) => {
    const total = updatedIngredients.reduce((sum, ing) => sum + ing.calories, 0);
    setCalorieOverride(total * servings);
  };

  // Calculate adjusted values based on servings
  const getAdjustedValue = (value) => {
    return Math.round(value * servings);
  };

  // Get displayed calories (either override or calculated)
  const getDisplayedCalories = () => {
    if (calorieOverride !== null) {
      return calorieOverride;
    }
    return Math.round((analysisResult?.total_calories || 0) * servings);
  };

  const getCurrentTime = () => {
    const date = existingMeal ? new Date(existingMeal.logged_at) : new Date();
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get the photo URI (from params or existing meal)
  const displayPhotoUri = photoUri || existingMeal?.photo_uri;

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.logoCircleContainer}>
            <ProgressCircle progress={loadingProgress} size={160} strokeWidth={6} />
            <View style={styles.logoCenter}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.loadingLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.loadingPercentage}>{Math.round(loadingProgress)}%</Text>
          <Text style={styles.loadingText}>Analyzing your meal...</Text>
          <Text style={styles.loadingSubtext}>Identifying ingredients and calculating nutrition</Text>
        </View>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.dark.primary} />
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={handleGoBack}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Results State
  const { meal_name, total_calories, macros, notes } = analysisResult || {};
  // Note: ingredients are managed separately via state

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={Colors.dark.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.dark.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Food Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: displayPhotoUri }}
            style={styles.foodImage}
            resizeMode="cover"
          />
          {/* Time badge on image - bottom right */}
          <View style={styles.imageTimeBadge}>
            <Text style={styles.imageTimeText}>{getCurrentTime()}</Text>
          </View>
        </View>

        {/* Meal Info Card */}
        <View style={styles.mealInfoCard}>
          {/* Meal Name and Servings */}
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealName}>{meal_name || 'Your Meal'}</Text>
            <TouchableOpacity style={styles.servingsButton} onPress={handleOpenServingsSheet}>
              <Text style={styles.servingsText}>{servings} serving{servings !== 1 ? 's' : ''}</Text>
              <Ionicons name="pencil" size={16} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Calories Card */}
          <View style={styles.caloriesCard}>
            <View style={styles.caloriesIcon}>
              <Ionicons name="flame" size={24} color={Colors.dark.primary} />
            </View>
            <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <Text style={styles.caloriesValue}>{getDisplayedCalories()}</Text>
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
            {/* Page 1: Primary Macros (Protein, Carbs, Fats) */}
            <View style={[styles.macrosRow, { width: width - (Spacing.lg * 2) }]}>
              <MacroCard 
                icon="🥩" 
                label="Protein" 
                value={getAdjustedValue(macros?.protein_g || 0)} 
                unit="g"
                color="#E57373"
                isFirst={true}
              />
              <MacroCard 
                icon="🌾" 
                label="Carbs" 
                value={getAdjustedValue(macros?.carbs_g || 0)} 
                unit="g"
                color={Colors.dark.primary}
              />
              <MacroCard 
                icon="💧" 
                label="Fats" 
                value={getAdjustedValue(macros?.fat_g || 0)} 
                unit="g"
                color="#64B5F6"
              />
            </View>

            {/* Page 2: Secondary Macros (Fiber, Sugar, Sodium) */}
            <View style={[styles.macrosRow, { width: width - (Spacing.lg * 2) }]}>
              <MacroCard 
                icon="🥬" 
                label="Fiber" 
                value={getAdjustedValue(macros?.fiber_g || 0)} 
                unit="g"
                color="#8BC34A"
                isFirst={true}
              />
              <MacroCard 
                icon="🍬" 
                label="Sugar" 
                value={getAdjustedValue(macros?.sugar_g || 0)} 
                unit="g"
                color="#FF5722"
              />
              <MacroCard 
                icon="🧂" 
                label="Sodium" 
                value={getAdjustedValue(macros?.sodium_mg || 0)} 
                unit="mg"
                color="#9C27B0"
              />
            </View>
          </ScrollView>

          {/* Pagination dots (for carousel effect) */}
          <View style={styles.paginationDots}>
            <View style={[styles.dot, macroPage === 0 && styles.dotActive]} />
            <View style={[styles.dot, macroPage === 1 && styles.dotActive]} />
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsHeader}>
            <Text style={styles.ingredientsTitle}>Ingredients</Text>
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={handleAddIngredient}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={Colors.dark.primary} />
              <Text style={styles.addMoreText}>Add More</Text>
            </TouchableOpacity>
          </View>

          {ingredients?.map((ingredient, index) => (
            <IngredientItem
              key={index}
              ingredient={ingredient}
              onPress={() => handleEditIngredient(index)}
              onDelete={() => handleDeleteIngredient(index)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={styles.adjustButton} onPress={handleAdjustCalories}>
          <Ionicons name="create-outline" size={20} color={Colors.dark.textPrimary} />
          <Text style={styles.adjustButtonText}>Adjust Calories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Adjust Calories Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAdjustSheet}
        onRequestClose={() => setShowAdjustSheet(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetOverlay}
        >
          <TouchableOpacity 
            style={styles.sheetBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowAdjustSheet(false)}
          />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Adjust Calories</Text>
            <Text style={styles.sheetSubtitle}>Enter the correct calorie amount</Text>
            
            <View style={styles.calorieInputContainer}>
              <TextInput
                style={styles.calorieInput}
                value={adjustedCalories}
                onChangeText={setAdjustedCalories}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.dark.textSecondary}
              />
              <Text style={styles.calorieInputLabel}>calories</Text>
            </View>

            <TouchableOpacity 
              style={styles.updateButton} 
              onPress={handleUpdateCalories}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Servings Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showServingsSheet}
        onRequestClose={() => setShowServingsSheet(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetOverlay}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowServingsSheet(false)}
          />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Adjust Servings</Text>
            <Text style={styles.sheetSubtitle}>Change the number of servings</Text>

            <View style={styles.servingsInputContainer}>
              <TouchableOpacity
                style={styles.servingsAdjustButton}
                onPress={() => {
                  const current = parseFloat(tempServings) || 1;
                  if (current > 0.5) {
                    setTempServings((current - 0.5).toString());
                  }
                }}
              >
                <Ionicons name="remove" size={28} color={Colors.dark.textPrimary} />
              </TouchableOpacity>

              <TextInput
                style={styles.servingsInput}
                value={tempServings}
                onChangeText={setTempServings}
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor={Colors.dark.textSecondary}
              />

              <TouchableOpacity
                style={styles.servingsAdjustButton}
                onPress={() => {
                  const current = parseFloat(tempServings) || 1;
                  setTempServings((current + 0.5).toString());
                }}
              >
                <Ionicons name="add" size={28} color={Colors.dark.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.servingsHint}>
              This will adjust all nutritional values proportionally
            </Text>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateServings}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Update Servings</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Ingredient Edit/Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showIngredientModal}
        onRequestClose={() => setShowIngredientModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetOverlay}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowIngredientModal(false)}
          />
          <View style={[styles.sheetContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {editingIngredient !== null ? 'Edit Ingredient' : 'Add Ingredient'}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {editingIngredient !== null ? 'Update ingredient details' : 'Enter ingredient details'}
            </Text>

            <View style={styles.ingredientFormContainer}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Ingredient Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={tempIngredientName}
                  onChangeText={setTempIngredientName}
                  placeholder="e.g., Chicken Breast"
                  placeholderTextColor={Colors.dark.textSecondary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Serving Size</Text>
                <TextInput
                  style={styles.formInput}
                  value={tempIngredientPortion}
                  onChangeText={setTempIngredientPortion}
                  placeholder="e.g., 100g"
                  placeholderTextColor={Colors.dark.textSecondary}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Calories</Text>
                <TextInput
                  style={styles.formInput}
                  value={tempIngredientCalories}
                  onChangeText={setTempIngredientCalories}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.dark.textSecondary}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleSaveIngredient}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>
                {editingIngredient !== null ? 'Update Ingredient' : 'Add Ingredient'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  // Loading styles
  loadingContainer: {
    alignItems: 'center',
  },
  logoCircleContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSvg: {
    position: 'absolute',
  },
  logoCenter: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
  },
  loadingPercentage: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 24,
    color: Colors.dark.primary,
    marginTop: Spacing.lg,
  },
  loadingText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.sm,
  },
  loadingSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  // Error styles
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
  retryButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xl,
  },
  retryButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
  backLink: {
    marginTop: Spacing.md,
  },
  backLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
    marginLeft: Spacing.xs,
  },
  // Content styles
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 120,
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
  imageTimeBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  imageTimeText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary, // Orange color
  },
  // Meal Info Card - Flush with image, straight line division
  mealInfoCard: {
    backgroundColor: Colors.dark.surface,
    // No rounded corners - straight line between image and content
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: 0, // Flush with image, no overlap
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    // Add a subtle top border for visual separation
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bookmarkButton: {
    marginRight: Spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  servingsText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginRight: Spacing.xs,
  },
  // Calories Card - Following design.md: Cards with rounded corners and orange accent
  caloriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.lg, // design.md: 12-16px radius
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary, // design.md: Orange accent on left edge
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
  // Macros Row
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.lg, // design.md: 12-16px radius
    padding: Spacing.sm,
    marginHorizontal: 4,
    borderLeftWidth: 4, // design.md: Orange accent on left edge
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
  // Pagination dots - Following design.md: Orange highlight for active state
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
    backgroundColor: Colors.dark.primary, // design.md: Orange highlight
    width: 24, // Elongated active dot
  },
  // Ingredients Section
  ingredientsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  ingredientsTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMoreText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary, // design.md: Orange for interactive elements
    marginLeft: 4,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg, // design.md: 12-16px radius
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
    backgroundColor: Colors.dark.primary, // design.md: Orange accent on left edge
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
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.surface,
  },
  adjustButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  adjustButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginLeft: Spacing.xs,
  },
  doneButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary, // Orange button
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  doneButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF', // White text on orange button
  },
  // Adjust Calories Sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.dark.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  sheetSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  calorieInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  calorieInput: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 48,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    minWidth: 150,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
  },
  calorieInputLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.sm,
  },
  updateButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  updateButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  // Servings Sheet
  servingsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  servingsAdjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsInput: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 48,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    minWidth: 100,
    marginHorizontal: Spacing.lg,
  },
  servingsHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  // Delete action (for swipeable)
  deleteAction: {
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  deleteActionText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xs,
    color: '#FFFFFF',
    marginTop: 4,
  },
  // Ingredient form
  ingredientFormContainer: {
    marginBottom: Spacing.lg,
  },
  formField: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default NutritionResultsScreen;
