import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - Spacing.lg * 2;

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
  
  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(day)} ${month}, ${year}`;
};

const ScanDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { scanData } = route.params || {};
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef(null);

  if (!scanData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No scan data available</Text>
      </View>
    );
  }

  const {
    body_fat_percentage,
    front_image_path,
    side_image_path,
    weight_lbs,
    weight_kg,
    weight_unit,
    confidence_level,
    confidence_low,
    confidence_high,
    scan_date,
  } = scanData;

  const percentage = body_fat_percentage ? Math.round(body_fat_percentage * 10) / 10 : '--';
  const formattedDate = getFormattedDate(scan_date);
  
  // Display weight based on unit preference
  const displayWeight = weight_unit === 'kg' 
    ? `${weight_kg?.toFixed(1) || '--'} kg` 
    : `${weight_lbs || '--'} lbs`;

  // Confidence display
  const confidenceText = confidence_level 
    ? confidence_level.charAt(0).toUpperCase() + confidence_level.slice(1) 
    : 'Medium';
  const confidenceRange = (confidence_low && confidence_high) 
    ? `${confidence_low}% - ${confidence_high}%` 
    : null;

  // Images for carousel
  const images = [
    { id: 'front', uri: front_image_path, label: 'Front View' },
    { id: 'side', uri: side_image_path, label: 'Side View' },
  ].filter(img => img.uri);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleContinueToRoutine = () => {
    // Reset navigation stack and go directly to Daily tab with Checklist selected
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            state: {
              routes: [
                { name: 'Home' },
                { name: 'Daily', params: { initialTab: 'Checklist' } },
                { name: 'Progress' },
                { name: 'Profile' },
              ],
              index: 1,
            },
          },
        ],
      })
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveImageIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderImageItem = ({ item }) => (
    <View style={styles.imageSlide}>
      <Image 
        source={{ uri: item.uri }} 
        style={styles.scanImage}
        resizeMode="cover"
      />
      <View style={styles.imageLabelContainer}>
        <Text style={styles.imageLabel}>{item.label}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <Text style={styles.dateText}>{formattedDate}</Text>

        {/* Body Fat Percentage - Main Display */}
        <View style={styles.percentageSection}>
          <Text style={styles.percentageValue}>{percentage}</Text>
          <Text style={styles.percentageLabel}>% Body Fat</Text>
        </View>

        {/* Image Carousel */}
        {images.length > 0 && (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={images}
              renderItem={renderImageItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              snapToInterval={IMAGE_WIDTH + Spacing.md}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
            />
            
            {/* Pagination Dots */}
            {images.length > 1 && (
              <View style={styles.paginationContainer}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      activeImageIndex === index && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Weight */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="scale-outline" size={24} color={Colors.dark.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{displayWeight}</Text>
            </View>
          </View>
        </View>

        {/* Confidence Level */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="analytics-outline" size={24} color={Colors.dark.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Confidence Level</Text>
              <Text style={styles.infoValue}>{confidenceText}</Text>
              {confidenceRange && (
                <Text style={styles.infoSubtext}>Range: {confidenceRange}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Continue to Routine Button */}
        <TouchableOpacity 
          style={styles.routineButton}
          onPress={handleContinueToRoutine}
          activeOpacity={0.8}
        >
          <Text style={styles.routineButtonText}>Continue to Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  percentageSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  percentageValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 72,
    color: Colors.dark.primary,
    lineHeight: 80,
  },
  percentageLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginTop: -Spacing.xs,
  },
  carouselContainer: {
    marginBottom: Spacing.xl,
  },
  carouselContent: {
    paddingRight: Spacing.md,
  },
  imageSlide: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 1.2,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  imageLabelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  imageLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(160, 160, 160, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.dark.primary,
    width: 24,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
  },
  infoSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  routineButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  routineButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default ScanDetailsScreen;
