import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import DailyCalorieCard from './DailyCalorieCard';
import MacroCard from './MacroCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - (Spacing.lg * 2);

const NutritionCarousel = ({
  caloriesConsumed = 0,
  dailyTarget = 2000,
  bonusCalories = 0,
  // Primary macros - consumed and targets
  proteinConsumed = 0,
  proteinTarget = 120,
  carbsConsumed = 0,
  carbsTarget = 200,
  fatsConsumed = 0,
  fatsTarget = 65,
  // Secondary macros - consumed and targets
  fiberConsumed = 0,
  fiberTarget = 25,
  sodiumConsumed = 0,
  sodiumTarget = 2300,
  sugarConsumed = 0,
  sugarTarget = 50,
}) => {
  const [macroActiveIndex, setMacroActiveIndex] = useState(0);
  const [showMacrosConsumed, setShowMacrosConsumed] = useState(false);
  const macroScrollRef = useRef(null);

  const handleMacroScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setMacroActiveIndex(index);
  };

  const handleMacroToggle = () => {
    setShowMacrosConsumed(!showMacrosConsumed);
  };

  return (
    <View style={styles.container}>
      {/* Calorie Card - Fixed (not swipeable) */}
      <View style={styles.calorieCardWrapper}>
        <DailyCalorieCard
          caloriesConsumed={caloriesConsumed}
          dailyTarget={dailyTarget}
          bonusCalories={bonusCalories}
        />
      </View>

      {/* Macro Cards - Swipeable Carousel */}
      <ScrollView
        ref={macroScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleMacroScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.macroScrollContent}
      >
        {/* Page 1: Primary Macros (Protein, Carbs, Fats) */}
        <View style={[styles.macroPageWrapper, { width: CARD_WIDTH }]}>
          <MacroCard
            firstConsumed={proteinConsumed}
            firstTarget={proteinTarget}
            firstUnit="g"
            firstLabel="Protein"
            secondConsumed={carbsConsumed}
            secondTarget={carbsTarget}
            secondUnit="g"
            secondLabel="Carbs"
            thirdConsumed={fatsConsumed}
            thirdTarget={fatsTarget}
            thirdUnit="g"
            thirdLabel="Fats"
            icons={{
              first: 'fitness',
              second: 'leaf',
              third: 'water',
            }}
            colors={{
              first: '#E85D04',  // Orange for protein
              second: '#4CAF50', // Green for carbs
              third: '#FFC107',  // Yellow/gold for fats
            }}
            showConsumed={showMacrosConsumed}
            onPress={handleMacroToggle}
          />
        </View>

        {/* Page 2: Secondary Macros (Fiber, Sodium, Sugar) */}
        <View style={[styles.macroPageWrapper, { width: CARD_WIDTH }]}>
          <MacroCard
            firstConsumed={fiberConsumed}
            firstTarget={fiberTarget}
            firstUnit="g"
            firstLabel="Fiber"
            secondConsumed={sodiumConsumed}
            secondTarget={sodiumTarget}
            secondUnit="mg"
            secondLabel="Sodium"
            thirdConsumed={sugarConsumed}
            thirdTarget={sugarTarget}
            thirdUnit="g"
            thirdLabel="Sugar"
            icons={{
              first: 'nutrition',
              second: 'flask',
              third: 'cube',
            }}
            colors={{
              first: '#8BC34A',  // Light green for fiber
              second: '#9C27B0', // Purple for sodium
              third: '#FF5722',  // Deep orange for sugar
            }}
            showConsumed={showMacrosConsumed}
            onPress={handleMacroToggle}
          />
        </View>
      </ScrollView>

      {/* Pagination Dots for Macros */}
      <View style={styles.pagination}>
        {[0, 1].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              macroActiveIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  calorieCardWrapper: {
    marginBottom: Spacing.md,
  },
  macroScrollContent: {
    // No extra padding needed
  },
  macroPageWrapper: {
    // Each page takes full width
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(160, 160, 160, 0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.dark.primary,
    width: 24,
  },
});

export default NutritionCarousel;

