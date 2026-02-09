import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const RING_SIZE = 70;
const STROKE_WIDTH = 5;

const MacroItem = ({ value, unit, label, icon, iconColor, onPress, consumed, target }) => {
  // Calculate progress for ring (0-200%)
  const progressPercentage = Math.min((consumed / target) * 100, 200);

  // Determine ring color and progress value
  let ringColor = iconColor; // Use the macro's original color for 0-100%
  let displayProgress = progressPercentage;

  if (progressPercentage > 100) {
    ringColor = '#FF3B30'; // Red for over 100%
    displayProgress = progressPercentage - 100; // Show 0-100% in red zone
  }

  // SVG Circle calculations
  const radius = (RING_SIZE - STROKE_WIDTH) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <TouchableOpacity style={styles.macroItem} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}>{unit}</Text></Text>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroRingContainer}>
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
          {/* Progress ring (colored or red) */}
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
        <View style={styles.macroRingCenter}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MacroCard = ({
  // First macro (consumed and target)
  firstConsumed = 0,
  firstTarget = 120,
  firstUnit = 'g',
  firstLabel = 'Protein',
  // Second macro (consumed and target)
  secondConsumed = 0,
  secondTarget = 200,
  secondUnit = 'g',
  secondLabel = 'Carbs',
  // Third macro (consumed and target)
  thirdConsumed = 0,
  thirdTarget = 65,
  thirdUnit = 'g',
  thirdLabel = 'Fats',
  // Custom icons
  icons = {
    first: 'fitness',
    second: 'leaf',
    third: 'water',
  },
  // Custom colors
  colors = {
    first: '#E85D04',  // Orange for protein
    second: '#4CAF50', // Green for carbs
    third: '#FFC107',  // Yellow/gold for fats
  },
  // Toggle state
  showConsumed = false,
  onPress,
}) => {
  // Calculate remaining values
  const firstRemaining = Math.max(0, firstTarget - firstConsumed);
  const secondRemaining = Math.max(0, secondTarget - secondConsumed);
  const thirdRemaining = Math.max(0, thirdTarget - thirdConsumed);

  // Determine display values and labels based on toggle state
  const firstValue = showConsumed ? firstConsumed : firstRemaining;
  const secondValue = showConsumed ? secondConsumed : secondRemaining;
  const thirdValue = showConsumed ? thirdConsumed : thirdRemaining;

  const suffix = showConsumed ? 'consumed' : 'left';
  const firstDisplayLabel = `${firstLabel} ${suffix}`;
  const secondDisplayLabel = `${secondLabel} ${suffix}`;
  const thirdDisplayLabel = `${thirdLabel} ${suffix}`;

  return (
    <View style={styles.container}>
      <MacroItem
        value={Math.round(firstValue)}
        unit={firstUnit}
        label={firstDisplayLabel}
        icon={icons.first}
        iconColor={colors.first}
        onPress={onPress}
        consumed={firstConsumed}
        target={firstTarget}
      />
      <MacroItem
        value={Math.round(secondValue)}
        unit={secondUnit}
        label={secondDisplayLabel}
        icon={icons.second}
        iconColor={colors.second}
        onPress={onPress}
        consumed={secondConsumed}
        target={secondTarget}
      />
      <MacroItem
        value={Math.round(thirdValue)}
        unit={thirdUnit}
        label={thirdDisplayLabel}
        icon={icons.third}
        iconColor={colors.third}
        onPress={onPress}
        consumed={thirdConsumed}
        target={thirdTarget}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  macroItem: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  macroValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: Colors.dark.textPrimary,
  },
  macroUnit: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 18,
    color: Colors.dark.textPrimary,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  macroRingContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
  },
  svgRing: {
    position: 'absolute',
  },
  macroRingCenter: {
    width: RING_SIZE - 20,
    height: RING_SIZE - 20,
    borderRadius: (RING_SIZE - 20) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MacroCard;

