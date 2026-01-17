import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import SettingsButton from '../components/common/SettingsButton';
import NutritionCarousel from '../components/common/NutritionCarousel';
import DailyChecklist from '../components/common/DailyChecklist';
import ExerciseList from '../components/common/ExerciseList';
import AddCaloriesBox from '../components/common/AddCaloriesBox';

const DailyScreen = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Nutrition');

  const tabs = ['Checklist', 'Nutrition', 'Exercise'];

  // Dynamic header text based on active tab
  const getHeaderText = () => {
    switch (activeTab) {
      case 'Checklist':
        return { orange: 'Your', rest: ' daily routine' };
      case 'Nutrition':
        return { orange: 'Track', rest: ' your calories' };
      case 'Exercise':
        return { orange: 'Complete', rest: ' your workout' };
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
              caloriesLeft={2223}
              bonusCalories={200}
              protein={{ value: 120, unit: 'g' }}
              carbs={{ value: 200, unit: 'g' }}
              fats={{ value: 65, unit: 'g' }}
            />
            
            {/* Add Calories Box */}
            <AddCaloriesBox 
              onDescribe={() => console.log('Describe pressed')}
              onPhoto={() => console.log('Photo pressed')}
            />
          </View>
        )}

        {activeTab === 'Checklist' && (
          <View>
            <DailyChecklist />
          </View>
        )}

        {activeTab === 'Exercise' && (
          <View>
            <ExerciseList />
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
});

export default DailyScreen;
