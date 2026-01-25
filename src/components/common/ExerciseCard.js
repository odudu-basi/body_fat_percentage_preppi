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
      <View style={[
        styles.card,
        isChecked && styles.cardChecked
      ]}>
        {/* Left side - Checkbox and Icon */}
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

        <View style={[
          styles.iconContainer,
          isChecked && styles.iconContainerChecked
        ]}>
          <Ionicons
            name={icon}
            size={24}
            color={isChecked ? '#4CAF50' : Colors.dark.primary}
          />
        </View>

        {/* Middle - Content */}
        <View style={styles.content}>
          <Text style={[
            styles.title,
            isChecked && styles.titleChecked
          ]}>{title}</Text>
          <Text style={styles.description} numberOfLines={1}>{description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={Colors.dark.textSecondary} />
              <Text style={styles.metaText}>{duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={12} color={isChecked ? '#4CAF50' : Colors.dark.primary} />
              <Text style={[
                styles.metaText,
                isChecked && styles.metaTextChecked
              ]}>{calories} kcal</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  cardChecked: {
    borderLeftColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerChecked: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  titleChecked: {
    color: '#4CAF50',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
  },
  metaTextChecked: {
    color: '#4CAF50',
  },
});

export default ExerciseCard;
