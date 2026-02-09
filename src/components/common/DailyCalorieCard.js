import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const DailyCalorieCard = ({
  caloriesConsumed = 0,
  dailyTarget = 2000,
  bonusCalories = 0,
}) => {
  const [showConsumed, setShowConsumed] = useState(false);

  // Calculate calories remaining
  const caloriesLeft = dailyTarget - caloriesConsumed + bonusCalories;

  // Determine what to display based on toggle state
  const displayValue = showConsumed ? caloriesConsumed : caloriesLeft;
  const displayLabel = showConsumed ? 'Calories consumed' : 'Calories left';

  // Calculate progress for ring (0-200%)
  const effectiveTarget = dailyTarget - bonusCalories; // Adjust target by bonus calories
  const progressPercentage = Math.min((caloriesConsumed / effectiveTarget) * 100, 200);

  // Determine ring color and progress value
  let ringColor = Colors.dark.primary; // Orange (#E85D04)
  let displayProgress = progressPercentage;

  if (progressPercentage > 100) {
    ringColor = '#FF3B30'; // Red
    displayProgress = progressPercentage - 100; // Show 0-100% in red zone
  }

  // SVG Circle calculations
  const STROKE_WIDTH = 6;
  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  const handlePress = () => {
    setShowConsumed(!showConsumed);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Left side - Ring with flame icon */}
      <View style={styles.ringContainer}>
        {/* SVG Progress Ring */}
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svgRing}>
          {/* Background track (gray) */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            stroke="rgba(160, 160, 160, 0.3)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress ring (orange or red) */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        {/* Inner content */}
        <View style={styles.ringCenter}>
          <Ionicons name="flame" size={28} color={Colors.dark.textPrimary} />
        </View>
      </View>

      {/* Right side - Calorie Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.caloriesNumber}>{displayValue.toLocaleString()}</Text>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{displayLabel}</Text>
          {bonusCalories > 0 && !showConsumed && (
            <View style={styles.bonusBadge}>
              <Ionicons name="fitness-outline" size={14} color={Colors.dark.textPrimary} />
              <Text style={styles.bonusText}>+{bonusCalories}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RING_SIZE = 90;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.xxl,
  },
  caloriesNumber: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 48,
    color: Colors.dark.textPrimary,
    lineHeight: 56,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginLeft: Spacing.sm,
  },
  bonusText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
    marginLeft: 4,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgRing: {
    position: 'absolute',
  },
  ringCenter: {
    width: RING_SIZE - 24,
    height: RING_SIZE - 24,
    borderRadius: (RING_SIZE - 24) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DailyCalorieCard;

