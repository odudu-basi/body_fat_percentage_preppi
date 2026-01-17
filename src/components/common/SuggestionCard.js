import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const SuggestionCard = ({ 
  title, 
  onPress,
  icon = '💬',
  backgroundColor = '#4A90A4', // Default teal color
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Icon with colored background */}
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      
      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      
      {/* Arrow */}
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    paddingRight: Spacing.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginLeft: Spacing.md,
    lineHeight: 24,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 28,
    color: Colors.dark.textSecondary,
    fontWeight: '300',
  },
});

export default SuggestionCard;
