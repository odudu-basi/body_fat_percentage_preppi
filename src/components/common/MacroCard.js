import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const MacroItem = ({ value, unit, label, icon, iconColor }) => (
  <View style={styles.macroItem}>
    <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}>{unit}</Text></Text>
    <Text style={styles.macroLabel}>{label}</Text>
    <View style={styles.macroRingContainer}>
      <View style={styles.macroRingTrack} />
      <View style={styles.macroRingCenter}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
    </View>
  </View>
);

const MacroCard = ({ 
  protein = { value: 120, unit: 'g' },
  carbs = { value: 200, unit: 'g' },
  fats = { value: 65, unit: 'g' },
  // Custom labels for secondary macros
  labels = {
    first: 'Protein left',
    second: 'Carbs left',
    third: 'Fats left',
  },
  // Custom icons for secondary macros
  icons = {
    first: 'fitness',
    second: 'leaf',
    third: 'water',
  },
  // Custom colors for secondary macros
  colors = {
    first: '#E85D04',  // Orange for protein
    second: '#4CAF50', // Green for carbs
    third: '#FFC107',  // Yellow/gold for fats
  },
}) => {
  return (
    <View style={styles.container}>
      <MacroItem 
        value={protein.value}
        unit={protein.unit}
        label={labels.first}
        icon={icons.first}
        iconColor={colors.first}
      />
      <MacroItem 
        value={carbs.value}
        unit={carbs.unit}
        label={labels.second}
        icon={icons.second}
        iconColor={colors.second}
      />
      <MacroItem 
        value={fats.value}
        unit={fats.unit}
        label={labels.third}
        icon={icons.third}
        iconColor={colors.third}
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

