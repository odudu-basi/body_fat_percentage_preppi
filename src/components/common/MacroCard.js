import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const MacroItem = ({ value, unit, label, icon, iconColor, onPress }) => (
  <TouchableOpacity style={styles.macroItem} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}>{unit}</Text></Text>
    <Text style={styles.macroLabel}>{label}</Text>
    <View style={styles.macroRingContainer}>
      <View style={styles.macroRingTrack} />
      <View style={styles.macroRingCenter}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
    </View>
  </TouchableOpacity>
);

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
      />
      <MacroItem
        value={Math.round(secondValue)}
        unit={secondUnit}
        label={secondDisplayLabel}
        icon={icons.second}
        iconColor={colors.second}
        onPress={onPress}
      />
      <MacroItem
        value={Math.round(thirdValue)}
        unit={thirdUnit}
        label={thirdDisplayLabel}
        icon={icons.third}
        iconColor={colors.third}
        onPress={onPress}
      />
    </View>
  );
};

const RING_SIZE = 70;

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
  macroRingTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 5,
    borderColor: 'rgba(160, 160, 160, 0.3)',
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

