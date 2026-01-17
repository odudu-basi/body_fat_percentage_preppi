import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const ChatCard = ({ 
  icon, 
  title, 
  onPress,
  gradientColors = ['#9B59B6', '#8E44AD'], // Default purple gradient
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Icon with gradient background */}
      <View style={[styles.iconContainer, { backgroundColor: gradientColors[0] }]}>
        {typeof icon === 'number' ? (
          <Image source={icon} style={styles.iconImage} resizeMode="contain" />
        ) : (
          <Text style={styles.iconEmoji}>{icon}</Text>
        )}
      </View>
      
      {/* Title */}
      <Text style={styles.title}>{title}</Text>
      
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
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  iconImage: {
    width: 50,
    height: 50,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginLeft: Spacing.md,
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

export default ChatCard;

