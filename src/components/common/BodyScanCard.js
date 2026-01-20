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
 * Format date to display day name (e.g., "Thursday")
 */
const getDayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/**
 * Format date to display full date (e.g., "18th February, 2025")
 */
const getFormattedDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  // Add ordinal suffix
  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(day)} ${month}, ${year}`;
};

const BodyScanCard = ({ 
  scanData,
  onPress,
  onDelete,
}) => {
  const swipeableRef = useRef(null);

  if (!scanData) {
    return null;
  }

  const {
    id,
    body_fat_percentage,
    front_image_path,
    scan_date,
  } = scanData;

  const dayName = getDayName(scan_date);
  const formattedDate = getFormattedDate(scan_date);
  const percentage = body_fat_percentage ? Math.round(body_fat_percentage * 10) / 10 : '--';

  const handleDelete = () => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this body scan? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Close the swipeable
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

  // Render the delete action when swiping right
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
        {/* Left side - Torso image thumbnail */}
        <View style={styles.imageContainer}>
          {front_image_path ? (
            <Image 
              source={{ uri: front_image_path }} 
              style={styles.torsoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <View style={styles.torsoIcon}>
                <View style={styles.torsoHead} />
                <View style={styles.torsoBody} />
              </View>
            </View>
          )}
        </View>

        {/* Middle - Date info */}
        <View style={styles.dateContainer}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.fullDate}>{formattedDate}</Text>
        </View>

        {/* Right side - Body fat percentage */}
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageValue}>{percentage}</Text>
          <Text style={styles.percentageSymbol}>%</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const IMAGE_SIZE = 60;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    // Orange accent on left edge
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
  torsoImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torsoIcon: {
    alignItems: 'center',
  },
  torsoHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.primary,
    marginBottom: 2,
  },
  torsoBody: {
    width: 20,
    height: 24,
    backgroundColor: Colors.dark.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  dateContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  dayName: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  fullDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  percentageValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.primary,
  },
  percentageSymbol: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.primary,
    marginLeft: 2,
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

export default BodyScanCard;
