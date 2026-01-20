import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import SettingsButton from '../components/common/SettingsButton';
import NutritionCarousel from '../components/common/NutritionCarousel';
import DailyChecklist from '../components/common/DailyChecklist';
import ExerciseList from '../components/common/ExerciseList';
import AddCaloriesBox from '../components/common/AddCaloriesBox';
import CalorieMealCard from '../components/common/CalorieMealCard';
import { getTodaysMeals, deleteMeal, getTodaysCalories } from '../services/mealStorage';

const DailyScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const initialTab = route.params?.initialTab || 'Nutrition';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [exerciseCalories, setExerciseCalories] = useState(0);

  // Update active tab if navigation params change
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // Load today's meals when screen is focused
  const loadMeals = useCallback(async () => {
    try {
      const meals = await getTodaysMeals();
      const calories = await getTodaysCalories();
      setTodaysMeals(meals);
      setTotalCalories(calories);
      console.log('[DailyScreen] Loaded meals:', meals.length, 'Total calories:', calories);
    } catch (error) {
      console.error('[DailyScreen] Error loading meals:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [loadMeals])
  );

  // Handle meal card press - navigate to nutrition results
  const handleMealCardPress = (meal) => {
    navigation.navigate('NutritionResults', { existingMeal: meal });
  };

  // Handle meal deletion
  const handleDeleteMeal = async (mealId) => {
    try {
      await deleteMeal(mealId);
      await loadMeals(); // Refresh the list
      console.log('[DailyScreen] Meal deleted:', mealId);
    } catch (error) {
      console.error('[DailyScreen] Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
    }
  };

  const tabs = ['Checklist', 'Nutrition', 'Exercise'];

  // Request camera permission
  const requestCameraPermission = async () => {
    console.log('[DailyScreen] Requesting camera permission...');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[DailyScreen] Camera permission status:', status);
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('[DailyScreen] Camera permission error:', error);
      return false;
    }
  };

  // Request media library permission
  const requestMediaLibraryPermission = async () => {
    console.log('[DailyScreen] Requesting media library permission...');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[DailyScreen] Media library permission status:', status);
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please enable photo library access in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('[DailyScreen] Media library permission error:', error);
      return false;
    }
  };

  // Take photo with camera
  const takePhotoWithCamera = async () => {
    console.log('[DailyScreen] takePhotoWithCamera called');
    try {
      const hasPermission = await requestCameraPermission();
      console.log('[DailyScreen] Has camera permission:', hasPermission);
      if (!hasPermission) return;

      console.log('[DailyScreen] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      console.log('[DailyScreen] Camera result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('[DailyScreen] Navigating to NutritionResults with URI:', result.assets[0].uri);
        navigation.navigate('NutritionResults', { photoUri: result.assets[0].uri });
      } else {
        console.log('[DailyScreen] Camera was canceled or no assets');
      }
    } catch (error) {
      console.error('[DailyScreen] Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  // Choose from library
  const chooseFromLibrary = async () => {
    console.log('[DailyScreen] chooseFromLibrary called');
    try {
      const hasPermission = await requestMediaLibraryPermission();
      console.log('[DailyScreen] Has media library permission:', hasPermission);
      if (!hasPermission) return;

      console.log('[DailyScreen] Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      console.log('[DailyScreen] Library result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('[DailyScreen] Navigating to NutritionResults with URI:', result.assets[0].uri);
        navigation.navigate('NutritionResults', { photoUri: result.assets[0].uri });
      } else {
        console.log('[DailyScreen] Library selection was canceled or no assets');
      }
    } catch (error) {
      console.error('[DailyScreen] Library error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  // Handle photo button press
  const handlePhotoPress = () => {
    console.log('[DailyScreen] handlePhotoPress called');
    // Use Alert for both platforms to avoid ActionSheetIOS issues with modal timing
    Alert.alert(
      'Add Food Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => console.log('[DailyScreen] Cancel pressed') },
        { text: 'Take Photo', onPress: () => {
          console.log('[DailyScreen] Take Photo selected');
          takePhotoWithCamera();
        }},
        { text: 'Choose from Library', onPress: () => {
          console.log('[DailyScreen] Choose from Library selected');
          chooseFromLibrary();
        }},
      ]
    );
  };

  // Handle describe button press
  const handleDescribePress = () => {
    // TODO: Implement describe flow
    console.log('Describe pressed');
  };

  // Dynamic header text based on active tab
  const getHeaderText = () => {
    switch (activeTab) {
      case 'Checklist':
        return { orange: 'Your', rest: ' daily routine' };
      case 'Nutrition':
        return { orange: 'Track', rest: ' your calories' };
      case 'Exercise':
        return { orange: 'Your', rest: ' Workouts' };
      default:
        return { orange: 'Track', rest: ' your calories' };
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
        <SettingsButton onPress={() => console.log('Settings pressed')} />
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
            {/* Nutrition Carousel - Calories & Macros */}
            <NutritionCarousel 
              caloriesLeft={2223 - totalCalories + exerciseCalories}
              bonusCalories={exerciseCalories}
              // Primary macros
              protein={{ value: 120, unit: 'g' }}
              carbs={{ value: 200, unit: 'g' }}
              fats={{ value: 65, unit: 'g' }}
              // Secondary macros
              fiber={{ value: 25, unit: 'g' }}
              sodium={{ value: 2300, unit: 'mg' }}
              sugar={{ value: 50, unit: 'g' }}
            />
            
            {/* Add Calories Box */}
            <AddCaloriesBox 
              onDescribe={handleDescribePress}
              onPhoto={handlePhotoPress}
            />

            {/* Today's Logged Meals */}
            {todaysMeals.length > 0 && (
              <View style={styles.mealsSection}>
                <Text style={styles.mealsSectionTitle}>Today's Meals</Text>
                {todaysMeals.map((meal) => (
                  <View key={meal.id} style={styles.mealCardWrapper}>
                    <CalorieMealCard
                      meal={meal}
                      onPress={() => handleMealCardPress(meal)}
                      onDelete={handleDeleteMeal}
                    />
                  </View>
                ))}
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
  // Meals section
  mealsSection: {
    marginTop: Spacing.lg,
  },
  mealsSectionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.md,
  },
  mealCardWrapper: {
    marginBottom: Spacing.sm,
  },
});

export default DailyScreen;
