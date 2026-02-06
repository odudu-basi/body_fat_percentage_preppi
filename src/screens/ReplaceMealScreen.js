import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { generateMealSuggestion } from '../services/mealPlanGeneration';
import { generateMealImage } from '../services/imageGeneration';
import { replaceMeal } from '../services/mealPlanStorage';
import { getFavoriteMeals } from '../services/favoriteMeals';
import LoadingIndicator from '../components/common/LoadingIndicator';

const ReplaceMealScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { meal, date } = route.params || {};
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'favourites'
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedMeal, setSuggestedMeal] = useState(null);
  const [previousMealName, setPreviousMealName] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [favoriteMeals, setFavoriteMeals] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Load favorites when switching to favourites tab
  useEffect(() => {
    const loadFavorites = async () => {
      if (activeTab === 'favourites') {
        console.log('[ReplaceMeal] Loading ALL favorites (no meal type filter)');
        setIsLoadingFavorites(true);
        const favorites = await getFavoriteMeals(); // Remove meal type filter to show all favorites
        console.log('[ReplaceMeal] Favorites loaded:', favorites);
        console.log('[ReplaceMeal] Number of favorites:', favorites.length);
        setFavoriteMeals(favorites);
        setIsLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [activeTab]);

  const handleSeeSuggestions = async () => {
    try {
      setIsGenerating(true);
      setSuggestedMeal(null);

      console.log('[ReplaceMeal] Generating meal suggestion for:', meal.meal_type);
      console.log('[ReplaceMeal] User profile kitchen items:', profile?.kitchen_items);
      console.log('[ReplaceMeal] Avoiding meal:', previousMealName);

      // Generate meal using the new suggestion function
      const mealResult = await generateMealSuggestion(
        meal.meal_type,
        profile,
        previousMealName
      );

      if (!mealResult.success) {
        Alert.alert('Error', mealResult.error || 'Failed to generate meal');
        return;
      }

      const generatedMeal = mealResult.data;

      // Track this meal name to avoid repeating it
      setPreviousMealName(generatedMeal.name);

      // Generate image for the meal
      console.log('[ReplaceMeal] Generating image for:', generatedMeal.name);
      const imageUri = await generateMealImage(
        generatedMeal.name,
        generatedMeal.description
      );

      if (imageUri) {
        generatedMeal.image_uri = imageUri;
        console.log('[ReplaceMeal] Image URI set:', imageUri);
      } else {
        console.log('[ReplaceMeal] No image generated');
      }

      setSuggestedMeal(generatedMeal);
    } catch (error) {
      console.error('[ReplaceMeal] Error generating suggestion:', error);
      Alert.alert('Error', 'Failed to generate meal suggestion');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowAnother = () => {
    // Re-generate another suggestion (will avoid the previous one)
    handleSeeSuggestions();
  };

  const handleAccept = async () => {
    if (!suggestedMeal) return;

    try {
      setIsAccepting(true);

      console.log('[ReplaceMeal] Accepting meal:', suggestedMeal.name);
      console.log('[ReplaceMeal] Replacing meal type:', meal.meal_type);
      console.log('[ReplaceMeal] Date:', date);

      // Replace the meal in the database
      const success = await replaceMeal(date, meal.meal_type, suggestedMeal);

      if (success) {
        // Navigate directly to home screen - it will reload with the new meal
        navigation.navigate('MainTabs', { screen: 'Home' });
      } else {
        Alert.alert('Error', 'Failed to replace meal. Please try again.');
      }
    } catch (error) {
      console.error('[ReplaceMeal] Error accepting meal:', error);
      Alert.alert('Error', 'Failed to replace meal. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const renderNewTab = () => {
    if (isGenerating) {
      return (
        <View style={styles.centerContent}>
          <LoadingIndicator text="Generating meal suggestion..." subtext="Please wait" />
        </View>
      );
    }

    if (!suggestedMeal) {
      return (
        <View style={styles.centerContent}>
          <TouchableOpacity
            style={styles.seeSuggestionsButton}
            onPress={handleSeeSuggestions}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={24} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.seeSuggestionsText}>See meal suggestions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.suggestionContainer}>
        {/* Suggested Meal Card */}
        <View style={styles.suggestedMealCard}>
          {/* Meal Image */}
          <View style={styles.mealImageContainer}>
            {suggestedMeal.image_uri ? (
              <Image
                source={{ uri: suggestedMeal.image_uri }}
                style={styles.mealImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.mealImage, styles.placeholderImage]}>
                <Ionicons name="fast-food" size={48} color={Colors.dark.textSecondary} />
              </View>
            )}
          </View>

          {/* Meal Info */}
          <View style={styles.mealCardContent}>
            <Text style={styles.suggestedMealName}>{suggestedMeal.name}</Text>

            {/* Calories */}
            <View style={styles.caloriesRow}>
              <Ionicons name="flame" size={20} color={Colors.dark.primary} />
              <Text style={styles.caloriesText}>{suggestedMeal.calories} kcal</Text>
            </View>

            {/* Time Info */}
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="time-outline" size={16} color={Colors.dark.primary} />
                <Text style={styles.timeText}>Prep: {suggestedMeal.prep_time || 'N/A'}</Text>
              </View>
              <View style={styles.timeItem}>
                <Ionicons name="flame-outline" size={16} color={Colors.dark.primary} />
                <Text style={styles.timeText}>Cook: {suggestedMeal.cook_time || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.showAnotherButton}
            onPress={handleShowAnother}
            activeOpacity={0.8}
          >
            <Text style={styles.showAnotherText}>Show me another</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            activeOpacity={0.8}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFavouritesTab = () => {
    if (isLoadingFavorites) {
      return (
        <View style={styles.centerContent}>
          <LoadingIndicator text="Loading favorites..." />
        </View>
      );
    }

    if (favoriteMeals.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="heart-outline" size={48} color={Colors.dark.textSecondary} />
          <Text style={styles.placeholderText}>No favourite meals yet</Text>
          <Text style={styles.placeholderSubtext}>
            Tap the heart icon on any meal to save it here
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.favoritesContainer}>
        {favoriteMeals.map((favMeal, index) => (
          <TouchableOpacity
            key={index}
            style={styles.favoriteMealCard}
            onPress={() => {
              // Convert favorite meal structure to match regular meal structure
              const normalizedMeal = {
                ...favMeal,
                name: favMeal.meal_name, // Database uses meal_name, but code expects name
              };
              // Set this favorite as the suggested meal
              setSuggestedMeal(normalizedMeal);
              setActiveTab('new');
            }}
            activeOpacity={0.7}
          >
            {/* Meal Image */}
            <View style={styles.favoriteMealImageContainer}>
              {favMeal.image_uri ? (
                <Image
                  source={{ uri: favMeal.image_uri }}
                  style={styles.favoriteMealImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.favoriteMealImage, styles.placeholderImage]}>
                  <Ionicons name="fast-food" size={32} color={Colors.dark.textSecondary} />
                </View>
              )}
            </View>

            {/* Meal Info */}
            <View style={styles.favoriteMealContent}>
              <Text style={styles.favoriteMealName} numberOfLines={2}>
                {favMeal.meal_name}
              </Text>

              {/* Calories */}
              <View style={styles.favoriteCaloriesRow}>
                <Ionicons name="flame" size={16} color={Colors.dark.primary} />
                <Text style={styles.favoriteCaloriesText}>{favMeal.calories} kcal</Text>
              </View>

              {/* Time Info */}
              {(favMeal.prep_time || favMeal.cook_time) && (
                <View style={styles.favoriteTimeRow}>
                  {favMeal.prep_time && (
                    <Text style={styles.favoriteTimeText}>Prep: {favMeal.prep_time}</Text>
                  )}
                  {favMeal.cook_time && (
                    <Text style={styles.favoriteTimeText}>Cook: {favMeal.cook_time}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Arrow Icon */}
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Replace Meal</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Current Meal Info */}
      <View style={styles.currentMealCard}>
        <Text style={styles.sectionTitle}>Current Meal</Text>
        <View style={styles.mealInfoRow}>
          <View style={styles.mealIconCircle}>
            <Ionicons name="restaurant" size={24} color={Colors.dark.primary} />
          </View>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal?.name || 'Meal'}</Text>
            <Text style={styles.mealCalories}>{meal?.calories || 0} kcal</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          onPress={() => setActiveTab('new')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            New
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favourites' && styles.tabActive]}
          onPress={() => setActiveTab('favourites')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'favourites' && styles.tabTextActive]}>
            Favourites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'new' ? renderNewTab() : renderFavouritesTab()}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  currentMealCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.md,
  },
  mealInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  mealCalories: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
  },
  tabActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  loadingText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.md,
  },
  placeholderText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    opacity: 0.7,
  },
  seeSuggestionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  seeSuggestionsText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  suggestionContainer: {
    flex: 1,
  },
  suggestedMealCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  mealImageContainer: {
    width: '100%',
    height: 200,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCardContent: {
    padding: Spacing.lg,
  },
  suggestedMealName: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 20,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.md,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  caloriesText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.primary,
    marginLeft: Spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
    marginLeft: Spacing.xs,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  showAnotherButton: {
    backgroundColor: Colors.dark.surface,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  showAnotherText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  acceptButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  favoritesContainer: {
    flex: 1,
    gap: Spacing.md,
  },
  favoriteMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  favoriteMealImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  favoriteMealImage: {
    width: '100%',
    height: '100%',
  },
  favoriteMealContent: {
    flex: 1,
  },
  favoriteMealName: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xs,
  },
  favoriteCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  favoriteCaloriesText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
    marginLeft: 4,
  },
  favoriteTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  favoriteTimeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
  },
});

export default ReplaceMealScreen;
