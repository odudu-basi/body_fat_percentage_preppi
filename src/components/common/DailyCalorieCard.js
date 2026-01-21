import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
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
        {/* Outer ring (track) */}
        <View style={styles.ringTrack} />
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
              <Ionicons name="time-outline" size={14} color={Colors.dark.textPrimary} />
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
  ringTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 6,
    borderColor: 'rgba(160, 160, 160, 0.3)', // Subtle gray ring
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

