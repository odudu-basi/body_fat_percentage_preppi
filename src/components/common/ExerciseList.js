import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import ExerciseCard from './ExerciseCard';

const ExerciseList = () => {
  const exercises = [
    {
      id: 'cardio',
      title: 'Cardio',
      description: 'High intensity interval training to boost your metabolism and burn fat',
      duration: '30 min',
      calories: 320,
      icon: 'heart',
    },
    {
      id: 'weights',
      title: 'Weight Lifting',
      description: 'Strength training to build muscle and increase your resting metabolic rate',
      duration: '45 min',
      calories: 280,
      icon: 'barbell',
    },
  ];

  const totalCalories = exercises.reduce((sum, ex) => sum + ex.calories, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Workout</Text>
        <View style={styles.totalCalories}>
          <Text style={styles.totalLabel}>Total burn: </Text>
          <Text style={styles.totalValue}>{totalCalories} kcal</Text>
        </View>
      </View>

      {/* Exercise Cards */}
      <View style={styles.cardsContainer}>
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            title={exercise.title}
            description={exercise.description}
            duration={exercise.duration}
            calories={exercise.calories}
            icon={exercise.icon}
            onPress={() => console.log(`${exercise.title} pressed`)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  totalCalories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  totalValue: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
  },
  cardsContainer: {
    flex: 1,
  },
});

export default ExerciseList;

