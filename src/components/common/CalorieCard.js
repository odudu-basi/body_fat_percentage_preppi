import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const CalorieCard = ({ 
  currentCalories = 1250, 
  targetCalories = 2000,
  onPress,
}) => {
  const caloriesLeft = targetCalories - currentCalories;

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Left side - Ring with flame icon */}
      <View style={styles.ringContainer}>
        {/* Outer ring (track) */}
        <View style={styles.ringTrack} />
        {/* Inner content */}
        <View style={styles.ringCenter}>
          <Ionicons name="flame" size={28} color={Colors.dark.primary} />
        </View>
      </View>

      {/* Right side - Calorie Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.caloriesNumber}>{caloriesLeft.toLocaleString()}</Text>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Calories left</Text>
          <View style={styles.targetBadge}>
            <Text style={styles.targetText}>/ {targetCalories.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RING_SIZE = 70;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
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
    borderWidth: 5,
    borderColor: 'rgba(160, 160, 160, 0.3)',
  },
  ringCenter: {
    width: RING_SIZE - 20,
    height: RING_SIZE - 20,
    borderRadius: (RING_SIZE - 20) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  caloriesNumber: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: Colors.dark.textPrimary,
    lineHeight: 42,
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
  targetBadge: {
    marginLeft: Spacing.sm,
  },
  targetText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
  },
});

export default CalorieCard;
