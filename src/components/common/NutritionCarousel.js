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
  caloriesLeft = 2223,
  bonusCalories = 200,
  // Primary macros (Page 1)
  protein = { value: 120, unit: 'g' },
  carbs = { value: 200, unit: 'g' },
  fats = { value: 65, unit: 'g' },
  // Secondary macros (Page 2)
  fiber = { value: 25, unit: 'g' },
  sodium = { value: 2300, unit: 'mg' },
  sugar = { value: 50, unit: 'g' },
}) => {
  const [macroActiveIndex, setMacroActiveIndex] = useState(0);
  const macroScrollRef = useRef(null);

  const handleMacroScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setMacroActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Calorie Card - Fixed (not swipeable) */}
      <View style={styles.calorieCardWrapper}>
        <DailyCalorieCard 
          caloriesLeft={caloriesLeft}
          bonusCalories={bonusCalories}
          onPress={() => console.log('Calorie card pressed')}
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
            protein={protein}
            carbs={carbs}
            fats={fats}
          />
        </View>

        {/* Page 2: Secondary Macros (Fiber, Sodium, Sugar) */}
        <View style={[styles.macroPageWrapper, { width: CARD_WIDTH }]}>
          <MacroCard 
            protein={fiber}
            carbs={sodium}
            fats={sugar}
            labels={{
              first: 'Fiber left',
              second: 'Sodium left',
              third: 'Sugar left',
            }}
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

