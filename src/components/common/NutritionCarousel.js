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
  protein = { value: 120, unit: 'g' },
  carbs = { value: 200, unit: 'g' },
  fats = { value: 65, unit: 'g' },
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + Spacing.md}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Page 1: Calorie Card */}
        <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
          <DailyCalorieCard 
            caloriesLeft={caloriesLeft}
            bonusCalories={bonusCalories}
            onPress={() => console.log('Calorie card pressed')}
          />
        </View>

        {/* Page 2: Macro Cards */}
        <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
          <MacroCard 
            protein={protein}
            carbs={carbs}
            fats={fats}
          />
        </View>
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {[0, 1].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
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
  scrollContent: {
    paddingRight: Spacing.md,
  },
  cardWrapper: {
    marginRight: Spacing.md,
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

