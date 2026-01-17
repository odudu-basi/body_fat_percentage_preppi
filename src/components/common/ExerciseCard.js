import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const ExerciseCard = ({ 
  title,
  description,
  duration,
  calories,
  icon,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Orange background card (peeking behind) */}
      <View style={styles.backgroundCard} />
      
      {/* Main card */}
      <View style={styles.mainCard}>
        {/* Left side - Icon and Info */}
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={28} color={Colors.dark.textPrimary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description} numberOfLines={2}>{description}</Text>
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={14} color={Colors.dark.textSecondary} />
              <Text style={styles.duration}>{duration}</Text>
            </View>
          </View>
        </View>

        {/* Right side - Calories */}
        <View style={styles.caloriesContainer}>
          <Text style={styles.caloriesValue}>{calories}</Text>
          <Text style={styles.caloriesLabel}>kcal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  backgroundCard: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: -8,
    bottom: -8,
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginLeft: 4,
  },
  caloriesContainer: {
    alignItems: 'flex-end',
    marginLeft: Spacing.md,
  },
  caloriesValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.primary,
  },
  caloriesLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: -2,
  },
});

export default ExerciseCard;

