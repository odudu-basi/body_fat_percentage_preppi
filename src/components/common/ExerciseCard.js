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
  isChecked = false,
  onToggle,
  onPress,
  onLongPress,
}) => {
  const handlePress = () => {
    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      {/* Orange background card (peeking behind) */}
      <View style={[
        styles.backgroundCard,
        isChecked && styles.backgroundCardChecked
      ]} />
      
      {/* Main card */}
      <View style={[
        styles.mainCard,
        isChecked && styles.mainCardChecked
      ]}>
        {/* Checkbox */}
        <TouchableOpacity 
          style={[
            styles.checkbox,
            isChecked && styles.checkboxChecked
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {isChecked && (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Left side - Icon and Info */}
        <View style={styles.leftContent}>
          <View style={[
            styles.iconContainer,
            isChecked && styles.iconContainerChecked
          ]}>
            <Ionicons 
              name={icon} 
              size={28} 
              color={isChecked ? Colors.dark.primary : Colors.dark.textPrimary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[
              styles.title,
              isChecked && styles.titleChecked
            ]}>{title}</Text>
            <Text style={styles.description} numberOfLines={2}>{description}</Text>
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={14} color={Colors.dark.textSecondary} />
              <Text style={styles.duration}>{duration}</Text>
            </View>
          </View>
        </View>

        {/* Right side - Calories */}
        <View style={styles.caloriesContainer}>
          <Text style={[
            styles.caloriesValue,
            isChecked && styles.caloriesValueChecked
          ]}>{calories}</Text>
          <Text style={styles.caloriesLabel}>kcal</Text>
          {isChecked && (
            <View style={styles.burnedBadge}>
              <Ionicons name="flame" size={12} color="#4CAF50" />
              <Text style={styles.burnedText}>Burned</Text>
            </View>
          )}
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
  backgroundCardChecked: {
    backgroundColor: '#4CAF50', // Green when checked
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingLeft: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  mainCardChecked: {
    borderColor: 'rgba(76, 175, 80, 0.3)', // Subtle green border when checked
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
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
  iconContainerChecked: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
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
  titleChecked: {
    color: '#4CAF50',
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
  caloriesValueChecked: {
    color: '#4CAF50',
  },
  caloriesLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: -2,
  },
  burnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  burnedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.xs,
    color: '#4CAF50',
    marginLeft: 2,
  },
});

export default ExerciseCard;
