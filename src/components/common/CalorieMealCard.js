import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

/**
 * Format time from ISO string
 */
const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

/**
 * Format date from ISO string
 */
const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
};

const CalorieMealCard = ({ 
  meal,
  onPress,
  onDelete,
}) => {
  const swipeableRef = useRef(null);

  if (!meal) {
    return null;
  }

  const {
    id,
    meal_name,
    total_calories,
    photo_uri,
    logged_at,
  } = meal;

  const time = formatTime(logged_at);
  const date = formatDate(logged_at);

  const handleDelete = () => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal log?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            swipeableRef.current?.close();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(id);
            }
          },
        },
      ]
    );
  };

  // Render the delete action when swiping
  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        style={styles.deleteAction}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <Animated.View 
          style={[
            styles.deleteContent,
            { 
              transform: [{ scale }],
              opacity,
            }
          ]}
        >
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity 
        style={styles.container} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Left side - Food image thumbnail */}
        <View style={styles.imageContainer}>
          {photo_uri ? (
            <Image 
              source={{ uri: photo_uri }} 
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="restaurant-outline" size={24} color={Colors.dark.primary} />
            </View>
          )}
        </View>

        {/* Middle - Meal info */}
        <View style={styles.infoContainer}>
          <Text style={styles.mealName} numberOfLines={1}>{meal_name}</Text>
          <Text style={styles.timeDate}>{time} • {date}</Text>
        </View>

        {/* Right side - Calories */}
        <View style={styles.caloriesContainer}>
          <Text style={styles.caloriesValue}>{total_calories}</Text>
          <Text style={styles.caloriesLabel}>cal</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const IMAGE_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    // Orange accent on left edge - following design.md
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(232, 93, 4, 0.1)',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  mealName: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  timeDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  caloriesContainer: {
    alignItems: 'flex-end',
  },
  caloriesValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 24,
    color: Colors.dark.primary, // Orange
  },
  caloriesLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    marginTop: -2,
  },
  // Delete action styles
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderTopRightRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    marginLeft: -BorderRadius.lg,
  },
  deleteContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: '#FFFFFF',
    marginTop: 4,
  },
});

export default CalorieMealCard;
